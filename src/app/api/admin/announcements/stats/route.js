import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyUserAuth, handleApiError } from '@/lib/apiMiddleware';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const authResult = await verifyUserAuth(req, { requireAdmin: true, endpoint: 'admin_stats' });
  if (!authResult.success) return authResult.error;

  try {
    // 1. Total Announcements & View Count Sum
    const { data: allAnnouncements, error: fetchError } = await supabaseServer
      .from('announcements')
      .select('id, view_count, application_end_date, created_at');

    if (fetchError) throw fetchError;

    const totalAnnouncements = allAnnouncements.length;
    const totalViews = allAnnouncements.reduce((sum, a) => sum + (a.view_count || 0), 0);

    // 2. Overdue Calculation (Older than 2 years from NOW)
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    
    const overdueAnnouncements = allAnnouncements.filter(a => {
        const endDate = a.application_end_date ? new Date(a.application_end_date) : null;
        if (endDate) {
            return endDate < twoYearsAgo;
        }
        return new Date(a.created_at) < twoYearsAgo;
    });

    const overdueCount = overdueAnnouncements.length;

    // 3. Views Chart Data (Daily)
    const { data: viewsData, error: viewsError } = await supabaseServer
        .from('announcement_views')
        .select('viewed_at');

    if (viewsError) throw viewsError;

    const dailyStats = {};
    
    viewsData.forEach(v => {
        if (!v.viewed_at) return;
        const date = new Date(v.viewed_at);
        // YYYY-MM-DD
        const key = date.toISOString().split('T')[0];
        dailyStats[key] = (dailyStats[key] || 0) + 1;
    });

    // Convert to array and sort
    const chartData = Object.entries(dailyStats)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
        totalAnnouncements,
        totalViews,
        overdueCount,
        overdueIds: overdueAnnouncements.map(a => a.id),
        chartData
    });

  } catch (error) {
    return handleApiError(error, 'admin_stats');
  }
}
