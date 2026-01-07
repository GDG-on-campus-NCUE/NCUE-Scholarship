import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const { announcementId } = await request.json();

    if (!announcementId) {
      return NextResponse.json({ error: 'Missing announcementId' }, { status: 400 });
    }

    // 1. Get Client IP
    let ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    
    // Handle multiple IPs in x-forwarded-for (e.g. client, proxy1, proxy2)
    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    
    // Validate IP format simply (optional, but postgres inet type is strict)
    // If it's a local dev environment, it might be ::1, which is valid IPv6
    
    // 2. Check for duplicate view in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: existingViews, error: searchError } = await supabaseServer
      .from('announcement_views')
      .select('id')
      .eq('announcement_id', announcementId)
      .eq('ip_address', ip)
      .gte('viewed_at', oneHourAgo);

    if (searchError) {
      console.error('Error checking views:', searchError);
      return NextResponse.json({ error: searchError.message }, { status: 500 });
    }

    let viewed = false;

    // 3. If no recent view, record it
    if (!existingViews || existingViews.length === 0) {
      const { error: insertError } = await supabaseServer
        .from('announcement_views')
        .insert({
          announcement_id: announcementId,
          ip_address: ip
        });

      if (insertError) {
        console.error('Error inserting view:', insertError);
        // If error is related to invalid IP format or other constraint, we shouldn't crash the UI response
        // But for now return 500
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      viewed = true;
    }

    // 4. Get current count (it should be updated by trigger if we inserted)
    const { data: announcement, error: getError } = await supabaseServer
      .from('announcements')
      .select('view_count')
      .eq('id', announcementId)
      .single();

    if (getError) {
       return NextResponse.json({ error: getError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      view_count: announcement.view_count, 
      viewed: viewed 
    });

  } catch (error) {
    console.error('View API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
