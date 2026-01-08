import { NextResponse } from 'next/server';

/**
 * 獲取用戶 IP 位址的 API
 * 用於在前端顯示用戶當前的 IP
 */
export async function GET(request) {
    let ip = '';
    
    // 優先嘗試 Nginx 傳遞的 X-Real-IP
    const realIp = request.headers.get('x-real-ip');
    
    if (realIp) {
        ip = realIp.trim();
    } else {
        // 其次嘗試 x-forwarded-for
        const forwarded = request.headers.get('x-forwarded-for');
        if (forwarded) {
            ip = forwarded.split(',')[0].trim();
        } else {
            // 最後使用 request.ip
            ip = request.ip || '127.0.0.1';
        }
    }

    // 處理 IPv6 映射的 IPv4 地址 (::ffff:127.0.0.1)
    if (ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
    }

    return NextResponse.json({ ip });
}
