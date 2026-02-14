import { NextResponse } from 'next/server';
import { verifyUserAuth, handleApiError, logSuccessAction } from '@/lib/apiMiddleware';
import { syncAnnouncementToDify, deleteAnnouncementFromDify } from '@/lib/difySync';

/**
 * API Route for Dify Knowledge Base Synchronization
 * 
 * POST /api/admin/announcements/sync-dify
 * Body: { id: string, action: 'sync' | 'delete' }
 */
export async function POST(req) {
    const authResult = await verifyUserAuth(req, { requireAdmin: true, endpoint: 'sync-dify' });
    if (!authResult.success) return authResult.error;

    try {
        const { id, action } = await req.json();

        if (!id) {
            return NextResponse.json({ error: 'Missing announcement ID' }, { status: 400 });
        }

        if (action === 'delete') {
            const success = await deleteAnnouncementFromDify(id);
            if (success) {
                logSuccessAction('DIFY_SYNC_DELETE', 'sync-dify', { id });
                return NextResponse.json({ success: true, message: 'Document deleted from Dify' });
            } else {
                return NextResponse.json({ error: 'Failed to delete from Dify' }, { status: 500 });
            }
        } else {
            // Default action is sync (create or update)
            const result = await syncAnnouncementToDify(id);
            if (result.success) {
                logSuccessAction('DIFY_SYNC_UPSERT', 'sync-dify', { id, documentId: result.documentId });
                return NextResponse.json({ success: true, documentId: result.documentId });
            } else {
                return NextResponse.json({ error: result.error }, { status: 500 });
            }
        }

    } catch (error) {
        return handleApiError(error, 'sync-dify');
    }
}
