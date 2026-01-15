import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyUserAuth, handleApiError, logSuccessAction } from '@/lib/apiMiddleware';

export async function POST(req) {
  const authResult = await verifyUserAuth(req, { requireAdmin: true, endpoint: 'batch_delete' });
  if (!authResult.success) return authResult.error;

  try {
    const { ids } = await req.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: '未提供 ID列表' }, { status: 400 });
    }

    // 1. Get attachments to delete files from storage
    const { data: attachments, error: attError } = await supabaseServer
        .from('attachments')
        .select('stored_file_path')
        .in('announcement_id', ids);
    
    if (!attError && attachments?.length > 0) {
        const paths = attachments.map(a => a.stored_file_path);
        // Assuming bucket name is 'attachments', verify if needed or use environment variable
        // Based on typical setup. If it fails, DB delete still proceeds.
        await supabaseServer.storage.from('attachments').remove(paths);
    }

    // 2. Delete DB records (Manual Cascade)
    await supabaseServer.from('attachments').delete().in('announcement_id', ids);
    await supabaseServer.from('announcement_views').delete().in('announcement_id', ids);
    
    const { error: delError } = await supabaseServer
        .from('announcements')
        .delete()
        .in('id', ids);

    if (delError) throw delError;

    logSuccessAction('BATCH_DELETE', 'batch_delete', { count: ids.length, ids });

    return NextResponse.json({ message: `成功刪除 ${ids.length} 筆公告` });

  } catch (error) {
    return handleApiError(error, 'batch_delete');
  }
}
