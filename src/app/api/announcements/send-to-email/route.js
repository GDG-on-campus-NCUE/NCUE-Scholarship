import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { verifyUserAuth, checkRateLimit, logSuccessAction, handleApiError } from '@/lib/apiMiddleware';

const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL;

const newCorsResponse = (body, status) => {
    return new NextResponse(JSON.stringify(body), {
        status,
        headers: {
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
        },
    });
};

export async function OPTIONS(request) {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
        },
    });
}

const generateEmailHtml = (announcement) => {
    const currentYear = new Date().getFullYear();
    const platformUrl = process.env.NEXT_PUBLIC_APP_URL;
    const announcementUrl = `${platformUrl}/?announcement_id=${announcement.id}`;
    
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '未指定';
    
    const applicationLimitText = announcement.application_limitations === 'Y' ? '可兼領' : '不可兼領';
    
    // Process HTML content to handle relative URLs
    const processHtml = (htmlBody) => {
        if (!htmlBody) return '無';
        return htmlBody.replace(/(href|src)\s*=\s*["']([^"']*)["']/g, (match, attr, path) => {
            const trimmedPath = path.trim();
            if (/^(https?:|mailto:|tel:|#)/i.test(trimmedPath)) return match;
            if (trimmedPath.startsWith('//')) return `${attr}="https:${trimmedPath}"`;
            const absolutePath = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
            return `${attr}="${platformUrl}${absolutePath}"`;
        });
    };

    const processedTargetAudience = processHtml(announcement.target_audience);
    const processedSummary = processHtml(announcement.summary);

    return `
    <!DOCTYPE html>
    <html lang="zh-Hant">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>獎助學金公告：${announcement.title}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap');
            body { margin: 0; padding: 0; background-color: #f4f4f7; font-family: 'Noto Sans TC', 'Microsoft JhengHei', sans-serif; -webkit-font-smoothing: antialiased; width: 100% !important; }
            table { border-collapse: collapse; width: 100%; }
            .wrapper { background-color: #f4f4f7; width: 100%; }
            .container { max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; margin-top: 20px; margin-bottom: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 32px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
            .content { padding: 32px 40px; color: #374151; }
            .announcement-title { color: #1f2937; margin-top: 0; margin-bottom: 24px; font-size: 22px; font-weight: 700; text-align: left; line-height: 1.4; }
            
            .info-box { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px; }
            .info-grid { display: table; width: 100%; }
            .info-row { display: table-row; }
            .info-label { display: table-cell; font-weight: 700; color: #6b7280; padding: 8px 0; width: 100px; font-size: 14px; }
            .info-value { display: table-cell; color: #1f2937; padding: 8px 0; font-size: 14px; }
            
            .section-title { font-size: 18px; font-weight: 700; color: #4f46e5; border-left: 4px solid #4f46e5; padding-left: 12px; margin: 32px 0 16px 0; }
            .html-body { font-size: 15px; line-height: 1.7; color: #374151; word-break: break-word; }
            .html-body p { margin: 0 0 1em 0; }
            .html-body a { color: #4f46e5; text-decoration: underline; }
            .html-body table { width: 100%; border-collapse: collapse; margin-bottom: 1em; }
            .html-body th, .html-body td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
            .html-body th { background-color: #f9fafb; }
            
            .btn-container { text-align: center; margin: 40px 0; }
            .btn { background-color: #4f46e5; color: white !important; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; display: inline-block; }
            
            .footer { padding: 24px 40px; font-size: 12px; text-align: center; color: #9ca3af; background-color: #f9fafb; border-top: 1px solid #e5e7eb; }
            .footer a { color: #6b7280; text-decoration: none; }

            @media screen and (max-width: 600px) {
                .container { width: 100% !important; border-radius: 0; border: none; margin: 0; }
                .content { padding: 24px 20px; }
                .announcement-title { font-size: 20px; }
            }
        </style>
    </head>
    <body>
        <table class="wrapper" border="0" cellpadding="0" cellspacing="0">
            <tr>
                <td align="center">
                    <table class="container" border="0" cellpadding="0" cellspacing="0">
                        <tr><td class="header"><h1>生輔組校外獎助學金資訊平台</h1></td></tr>
                        <tr><td class="content">
                            <h2 class="announcement-title">${announcement.title}</h2>
                            
                            <div class="info-box">
                                <div class="info-grid">
                                    <div class="info-row">
                                        <div class="info-label">公告 ID</div>
                                        <div class="info-value">${announcement.id}</div>
                                    </div>
                                    <div class="info-row">
                                        <div class="info-label">申請期間</div>
                                        <div class="info-value">${formatDate(announcement.application_start_date)} ~ ${formatDate(announcement.application_end_date)}</div>
                                    </div>
                                    <div class="info-row">
                                        <div class="info-label">送件方式</div>
                                        <div class="info-value">${announcement.submission_method || '未指定'}</div>
                                    </div>
                                    <div class="info-row">
                                        <div class="info-label">兼領限制</div>
                                        <div class="info-value">${applicationLimitText}</div>
                                    </div>
                                </div>
                            </div>

                            <div class="section-title">適用對象</div>
                            <div class="html-body">${processedTargetAudience}</div>

                            <div class="section-title">詳細內容</div>
                            <div class="html-body">${processedSummary}</div>

                            <div class="btn-container">
                                <a href="${announcementUrl}" class="btn">前往平台查看完整公告</a>
                            </div>
                        </td></tr>
                        <tr><td class="footer">
                            <p style="margin: 0 0 12px;"><a href="${platformUrl}" target="_blank">獎助學金資訊平台</a> • <a href="https://stuaffweb.ncue.edu.tw/" target="_blank">生輔組首頁</a></p>
                            <p style="margin: 0 0 5px;">© ${currentYear} 彰師生輔組校外獎助學金資訊平台. All Rights Reserved.</p>
                            <p style="margin: 0;">此為系統自動發送之信件，請勿直接回覆。</p>
                        </td></tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`;
};

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
    const endpoint = '/api/announcements/send-to-email';
    try {
        const rateLimitCheck = checkRateLimit(request, 'send-announcement-to-email', 5, 60000);
        if (!rateLimitCheck.success) return newCorsResponse(rateLimitCheck.error.body, { status: rateLimitCheck.error.status });

        const authCheck = await verifyUserAuth(request, {
            requireAuth: true,
            endpoint
        });
        if (!authCheck.success) return newCorsResponse(authCheck.error.body, { status: authCheck.error.status });

        const { announcement } = await request.json();
        if (!announcement || !announcement.id) {
            return newCorsResponse({ error: '無效的公告資料' }, { status: 400 });
        }

        const userEmail = authCheck.user.email;
        const subject = `[獎助學金公告] ${announcement.title}`;
        const finalHtmlContent = generateEmailHtml(announcement);
        const plainTextVersion = `獎助學金公告：${announcement.title}\n\n詳細資訊請至平台查看：${process.env.NEXT_PUBLIC_APP_URL}/?announcement_id=${announcement.id}`;

        const mailOptions = {
            from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`,
            to: userEmail,
            subject: subject,
            html: finalHtmlContent,
            text: plainTextVersion
        };

        const result = await transporter.sendMail(mailOptions);

        logSuccessAction('ANNOUNCEMENT_EMAIL_SENT', endpoint, {
            userId: authCheck.user.id,
            userEmail: userEmail,
            announcementId: announcement.id,
            messageId: result.messageId
        });

        return newCorsResponse({
            success: true,
            message: `公告已成功寄送至您的信箱：${userEmail}`,
        }, 200);

    } catch (err) {
        return handleApiError(err, endpoint);
    }
}
