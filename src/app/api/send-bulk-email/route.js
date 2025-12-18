import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { verifyUserAuth, checkRateLimit, validateRequestData, logSuccessAction, handleApiError } from '@/lib/apiMiddleware';

// --- CORS 處理 ---
const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL;

const newCorsResponse = (body, status) => {
    return new NextResponse(JSON.stringify(body), {
        status,
        headers: {
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
};

export async function OPTIONS(request) {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

// --- 郵件範本產生器 (與 send-custom-email 相同) ---
const generateEmailHtml = (subject, htmlBody) => {
    const currentYear = new Date().getFullYear();
    const platformUrl = process.env.NEXT_PUBLIC_APP_URL;

    let processedHtmlBody = htmlBody.replace(/(href|src)\s*=\s*["']([^"']*)["']/g, (match, attr, path) => {
        const trimmedPath = path.trim();
        if (/^(https?:|mailto:|tel:|#)/i.test(trimmedPath)) return match;
        if (trimmedPath.startsWith('//')) return `${attr}="https:${trimmedPath}"`;
        const absolutePath = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
        return `${attr}="${platformUrl}${absolutePath}"`;
    });

    return `
    <!DOCTYPE html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>彰師生輔組校外獎助學金資訊平台</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap');
        body{margin:0;padding:0;background-color:#f4f4f7;font-family:'Noto Sans TC','Microsoft JhengHei',sans-serif;-webkit-font-smoothing:antialiased;width:100%!important}
        table{border-collapse:collapse;width:100%}.wrapper{background-color:#f4f4f7;width:100%}.container{max-width:600px;margin:0 auto;background-color:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb}
        .header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:32px;text-align:center}.header h1{margin:0;font-size:26px;font-weight:700}
        .content{padding:32px 40px;color:#374151}.content h2{color:#1f2937;margin-top:0;margin-bottom:24px;font-size:22px;font-weight:700;text-align:left}
        .html-body{font-size:16px;line-height:1.7;color:#374151;word-break:break-word}.html-body p{margin:0 0 1em 0}.html-body a{color:#4f46e5;text-decoration:underline}.html-body *{max-width:100%}
        .footer{padding:24px 40px;font-size:12px;text-align:center;color:#9ca3af;background-color:#f9fafb;border-top:1px solid #e5e7eb}.footer a{color:#6b7280;text-decoration:none}
        @media screen and (max-width:600px){.wrapper{padding:16px 0!important}.container{width:100%!important}.content{padding:24px 20px}.header h1{font-size:22px}.content h2{font-size:20px}}
    </style></head><body><table class="wrapper" border="0" cellpadding="0" cellspacing="0"><tr><td align="center"><table class="container" border="0" cellpadding="0" cellspacing="0">
    <tr><td class="header"><h1>生輔組校外獎助學金資訊平台</h1></td></tr><tr><td class="content"><h2>${subject}</h2><div class="html-body">${processedHtmlBody}</div></td></tr>
    <tr><td class="footer"><p style="margin:0 0 12px;"><a href="${platformUrl}" target="_blank">平台首頁</a> • <a href="https://stuaffweb.ncue.edu.tw/" target="_blank">生輔組</a></p>
    <p style="margin:0 0 5px;">© ${currentYear} 彰師生輔組. All Rights Reserved.</p><p style="margin:0;">此為系統自動發送之信件，請勿直接回覆。</p></td></tr>
    </table></td></tr></table></body></html>`;
};


// --- 郵件傳輸器設定 ---
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD
    },
});

export async function POST(request) {
    const endpoint = '/api/send-bulk-email';
    try {
        // 速率限制
        const rateLimitCheck = checkRateLimit(request, 'send-bulk-email', 5, 60000); // 1分鐘內最多5次
        if (!rateLimitCheck.success) return newCorsResponse(rateLimitCheck.error.body, { status: rateLimitCheck.error.status });

        // 驗證管理員身份
        const authCheck = await verifyUserAuth(request, {
            requireAuth: true,
            requireAdmin: true,
            endpoint
        });
        if (!authCheck.success) return newCorsResponse(authCheck.error.body, { status: authCheck.error.status });

        const body = await request.json();

        // 驗證請求資料
        const dataValidation = validateRequestData(body, ['bcc', 'subject', 'body']);
        if (!dataValidation.success) return newCorsResponse(dataValidation.error.body, { status: dataValidation.error.status });

        const { bcc, subject, body: htmlBody } = dataValidation.data;

        if (!Array.isArray(bcc) || bcc.length === 0) {
            return newCorsResponse({ error: 'BCC 收件人列表格式不正確或為空' }, { status: 400 });
        }

        const finalHtmlContent = generateEmailHtml(subject, htmlBody);
        const plainTextVersion = htmlBody.replace(/<[^>]*>?/gm, '');

        const mailOptions = {
            from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`,
            bcc: bcc,
            subject: `${subject}`,
            html: finalHtmlContent,
            text: plainTextVersion
        };

        const result = await transporter.sendMail(mailOptions);

        logSuccessAction('BULK_EMAIL_SENT', endpoint, {
            adminId: authCheck.user.id,
            recipientCount: bcc.length,
            subject: subject,
            messageId: result.messageId
        });

        return newCorsResponse({
            success: true,
            message: `群發郵件已成功寄送給 ${bcc.length} 位使用者`,
        }, 200);

    } catch (err) {
        return handleApiError(err, endpoint);
    }
}
