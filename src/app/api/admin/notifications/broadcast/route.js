import { supabaseServer as supabase } from '@/lib/supabase/server';
import { messaging } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
import { verifyUserAuth, handleApiError } from '@/lib/apiMiddleware';

export async function POST(request) {
    try {
        // 1. 檢查權限 (確保是管理員)
        const authCheck = await verifyUserAuth(request, {
            requireAuth: true,
            requireAdmin: true,
            endpoint: '/api/admin/notifications/broadcast'
        });

        if (!authCheck.success) {
            return authCheck.error;
        }

        const { title, body, url, announcementId } = await request.json();

        // 2. 獲取所有 Token
        const { data: tokens, error: tokenError } = await supabase
            .from('fcm_tokens')
            .select('fcm_token');

        if (tokenError) throw tokenError;
        if (!tokens || tokens.length === 0) {
            return NextResponse.json({ message: 'No subscribers found' });
        }

        const fcmTokens = tokens.map(t => t.fcm_token);

        // 3. 構建 FCM 訊息
        const message = {
            notification: {
                title: title || '新公告通知',
                body: body || '您有新的獎助學金資訊',
            },
            data: {
                url: url || '/',
                announcementId: announcementId || '',
            },
            tokens: fcmTokens,
        };

        // 4. 批次發送
        const response = await messaging.sendEachForMulticast(message);
        
        // --- 新增：詳細日誌記錄 ---
        console.log(`[FCM Broadcast] 嘗試發送至 ${fcmTokens.length} 個裝置`);
        console.log(`[FCM Broadcast] 成功: ${response.successCount}, 失敗: ${response.failureCount}`);
        
        response.responses.forEach((resp, idx) => {
            if (resp.success) {
                console.log(`[FCM Success] Token Index ${idx}: Message ID = ${resp.messageId}`);
            } else {
                console.error(`[FCM Failure] Token Index ${idx}: Error =`, resp.error);
            }
        });
        // -----------------------

        // 5. 清理失效的 Token
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success && (resp.error.code === 'messaging/registration-token-not-registered' || resp.error.code === 'messaging/invalid-registration-token')) {
                    failedTokens.push(fcmTokens[idx]);
                }
            });

            if (failedTokens.length > 0) {
                await supabase.from('fcm_tokens').delete().in('fcm_token', failedTokens);
            }
        }

        return NextResponse.json({
            success: true,
            successCount: response.successCount,
            failureCount: response.failureCount
        });

    } catch (error) {
        return handleApiError(error, '/api/admin/notifications/broadcast');
    }
}
