import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyUserAuth, handleApiError, logSuccessAction } from '@/lib/apiMiddleware';
import { deleteAnnouncementFromDify } from '@/lib/difySync';

export async function POST(req) {
  const authResult = await verifyUserAuth(req, { requireAdmin: true, endpoint: 'batch_delete' });
  if (!authResult.success) return authResult.error;

  try {
    const { ids } = await req.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: '未提供 ID列表' }, { status: 400 });
    }

    // 1. Get attachments and Dify IDs
    const { data: announcements, error: annError } = await supabaseServer
        .from('announcements')
        .select('id, dify_document_id')
        .in('id', ids);
    
    const { data: attachments, error: attError } = await supabaseServer
        .from('attachments')
        .select('stored_file_path')
        .in('announcement_id', ids);
    
    // 2. Delete from Dify
    if (!annError && announcements?.length > 0) {
        for (const ann of announcements) {
            if (ann.dify_document_id) {
                await deleteAnnouncementFromDify(ann.dify_document_id, true);
            }
        }
    }

    // 3. Delete files from storage
    if (!attError && attachments?.length > 0) {
        const paths = attachments.map(a => a.stored_file_path);
        await supabaseServer.storage.from('attachments').remove(paths);
    }

    // 4. Delete DB records (Manual Cascade)
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
