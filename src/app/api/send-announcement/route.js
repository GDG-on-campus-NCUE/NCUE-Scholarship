import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabaseServer } from '@/lib/supabase/server'; 
import { verifyUserAuth, checkRateLimit, handleApiError, logSuccessAction } from '@/lib/apiMiddleware';

// --- Helper Functions ---

const parseUrls = (urlsString) => {
    if (!urlsString) return [];
    try {
        const parsed = JSON.parse(urlsString);
        if (Array.isArray(parsed)) {
            return parsed.filter(item => item.url && typeof item.url === 'string');
        }
    } catch (e) {
        // Fallback for a single URL string that isn't JSON
        if (typeof urlsString === 'string' && urlsString.startsWith('http')) {
            return [{ url: urlsString }];
        }
    }
    return [];
};

// --- Email Template Generator ---

const generateAnnouncementEmailHtml = (announcement) => {
    // --- Data Preparation ---
    const platformUrlBase = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const platformUrlWithQuery = `${platformUrlBase}/?announcement_id=${announcement.id}`;
    const currentYear = new Date().getFullYear();

    const deadline = announcement.application_deadline
        ? new Date(announcement.application_deadline).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })
        : '未指定';
    
    const externalUrls = parseUrls(announcement.external_urls);
    let richTextContent = announcement.summary || '<p>請至平台查看詳細內容。</p>';

    // --- Absolute Path Conversion for Email Clients ---
    richTextContent = richTextContent.replace(/(href|src)\s*=\s*["']([^"']*)["']/g, (match, attr, path) => {
        const trimmedPath = path.trim();
        if (/^(https?:|mailto:|tel:|#)/i.test(trimmedPath)) {
            return match; // Already an absolute path
        }
        if (trimmedPath.startsWith('//')) {
            return `${attr}="https:${trimmedPath}"`; // Protocol-relative
        }
        const absolutePath = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
        return `${attr}="${platformUrlBase}${absolutePath}"`;
    });

    // --- Component Renderers ---
    const renderExternalUrls = () => {
        if (externalUrls.length === 0) return '';
        const linksHtml = externalUrls.map(item => 
            `<li style="margin-bottom: 8px;"><a href="${item.url}" target="_blank" style="color: #7c3aed; text-decoration: underline; word-break: break-all;">${item.url}</a></li>`
        ).join('');
        return `<hr class="divider" /><div style="margin-top: 24px;"><h3 class="prose-h3">相關連結</h3><ul style="list-style-type: none; padding-left: 0; margin-top: 12px;">${linksHtml}</ul></div>`;
    };
    
    // --- Final HTML Template ---
    return `
    <!DOCTYPE html>
    <html lang="zh-Hant">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>彰師生輔組校外獎助學金資訊平台</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap');
            body { margin: 0; padding: 0; background-color: #f4f4f7; font-family: 'Noto Sans TC', 'Microsoft JhengHei', sans-serif; -webkit-font-smoothing: antialiased; width: 100% !important; }
            table { border-collapse: collapse; width: 100%; }
            .wrapper { background-color: #f4f4f7; width: 100%; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 32px; text-align: center; }
            .header h1 { margin: 0; font-size: 26px; font-weight: 700; }
            .content { padding: 32px 40px; color: #374151; }
            .content h2 { color: #1f2937; margin-top: 0; margin-bottom: 24px; font-size: 22px; font-weight: 700; text-align: left; }
            .details-table { width: 100%; margin-bottom: 24px; border-spacing: 0; }
            .details-table td { padding: 8px 0; font-size: 15px; vertical-align: top; }
            .details-table td.label { color: #6b7280; font-weight: 500; width: 90px; padding-right: 10px; }
            .details-table td.value { color: #1f2937; }
            .deadline { color: #9333ea; font-weight: 700; }
            .divider { border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0; }
            .prose { font-size: 16px; line-height: 1.7; color: #374151; word-break: break-word; }
            .prose p { margin: 0 0 16px; }
            .prose a { color: #4f46e5; text-decoration: underline; }
            .prose h1, .prose h2, .prose h3 { font-weight: 700; color: #1f2937; margin-top: 24px; margin-bottom: 12px; }
            .prose h1 { font-size: 22px; } .prose h2 { font-size: 20px; } .prose h3 { font-size: 18px; }
            .prose ul, .prose ol { padding-left: 24px; margin-bottom: 16px; } .prose li { margin-bottom: 8px; }
            .prose table { width: 100% !important; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; border: 1px solid #dee2e6; }
            .prose th, .prose td { border: 1px solid #dee2e6; padding: 10px 12px; text-align: left; }
            .prose th { background-color: #f8f9fa; font-weight: 600; color: #495057; }
            .prose tr:nth-of-type(even) { background-color: #f8f9fa; }
            .prose * { max-width: 100%; }
            .cta-button { display: inline-block; background-color: #7c3aed; color: #ffffff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 500; }
            .footer { padding: 24px 40px; font-size: 12px; text-align: center; color: #9ca3af; background-color: #f9fafb; border-top: 1px solid #e5e7eb; }
            .footer a { color: #6b7280; text-decoration: none; }
        </style>
    </head>
    <body>
        <table class="wrapper" border="0" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding: 24px 0;">
        <table class="container" border="0" cellpadding="0" cellspacing="0">
            <tr><td class="header"><h1>生輔組校外獎助學金資訊平台</h1></td></tr>
            <tr><td class="content">
                <h2>${announcement.title}</h2>
                <table class="details-table">
                    ${announcement.category ? `<tr><td class="label">類 別</td><td class="value">${announcement.category}</td></tr>` : ''}
                    ${announcement.application_deadline ? `<tr><td class="label">申請截止</td><td class="value"><span class="deadline">${deadline}</span></td></tr>` : ''}
                    ${announcement.target_audience ? `<tr><td class="label">適用對象</td><td class="value">${announcement.target_audience}</td></tr>` : ''}
                    ${announcement.submission_method ? `<tr><td class="label">送件方式</td><td class="value">${announcement.submission_method}</td></tr>` : ''}
                </table>
                <hr class="divider" />
                <div class="prose">${richTextContent}</div>
                ${renderExternalUrls()}
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 32px;">
                    <tr><td align="center"><a href="${platformUrlWithQuery}" target="_blank" class="cta-button">前往平台查看完整資訊</a></td></tr>
                </table>
            </td></tr>
            <tr><td class="footer">
                <p style="margin: 0 0 12px;"><a href="${platformUrlBase}" target="_blank">生輔組獎助學金資訊平台</a> &nbsp;&bull;&nbsp; <a href="https://stuaffweb.ncue.edu.tw/" target="_blank">生輔組首頁</a></p>
                <p style="margin: 0 0 5px;">© ${currentYear} 彰師生輔組校外獎助學金資訊平台. All Rights Reserved.</p>
                <p style="margin: 0;">此為系統自動發送之信件，請勿直接回覆。</p>
            </td></tr>
        </table>
        </td></tr></table>
    </body>
    </html>`;
};

// --- UPDATED: Nodemailer Transporter to match the first example ---
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_PORT === '465', // Use true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD
    },
});

// --- API POST Handler ---
export async function POST(request) {
    try {
        const rateLimitCheck = checkRateLimit(request, 'send-announcement', 5, 300000);
        if (!rateLimitCheck.success) return rateLimitCheck.error;

        const authCheck = await verifyUserAuth(request, {
            requireAuth: true,
            requireAdmin: true,
            endpoint: '/api/send-announcement'
        });
        if (!authCheck.success) return authCheck.error;

        const body = await request.json();
        const { announcementId } = body;

        if (typeof announcementId !== 'string' || announcementId.trim().length === 0) {
            return NextResponse.json({ error: '無效的公告 ID' }, { status: 400 });
        }

        const { data: announcement, error: annError } = await supabaseServer
            .from('announcements')
            .select('*')
            .eq('id', announcementId)
            .single();
        if (annError || !announcement) {
            return NextResponse.json({ error: '無法取得公告資料', details: annError?.message }, { status: 500 });
        }

        // 取得所有使用者 Email (處理分頁)
        let allEmails = [];
        let page = 1;
        const perPage = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data: authData, error: authError } = await supabaseServer.auth.admin.listUsers({
                page: page,
                perPage: perPage
            });
            
            if (authError) throw authError;

            if (authData?.users && authData.users.length > 0) {
                const pageEmails = authData.users
                    .map(u => u.email)
                    .filter(email => email);
                
                allEmails = [...allEmails, ...pageEmails];

                if (authData.users.length < perPage) hasMore = false;
                else page++;
            } else {
                hasMore = false;
            }
        }

        if (allEmails.length === 0) {
            return NextResponse.json({ error: '沒有可寄送的 Email' }, { status: 400 });
        }

        const finalHtmlContent = generateAnnouncementEmailHtml(announcement);
        const plainTextContent = (announcement.summary || '').replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();

        // --- 分批寄送邏輯 (Batching) ---
        const BATCH_SIZE = 90; 
        const batches = [];
        for (let i = 0; i < allEmails.length; i += BATCH_SIZE) {
            batches.push(allEmails.slice(i, i + BATCH_SIZE));
        }

        console.log(`[ANNOUNCEMENT-EMAIL] Total recipients: ${allEmails.length}, splitting into ${batches.length} batches.`);

        const sendResults = [];
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const mailOptions = {
                from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`,
                bcc: batch,
                subject: `【獎學金公告通知】${announcement.title}`,
                text: plainTextContent,
                html: finalHtmlContent
            };

            const result = await transporter.sendMail(mailOptions);
            sendResults.push(result.messageId);
            console.log(`[ANNOUNCEMENT-EMAIL] Batch ${i + 1}/${batches.length} sent. MessageId: ${result.messageId}`);
        }
        
        logSuccessAction('ANNOUNCEMENT_SENT', '/api/send-announcement', {
            adminId: authCheck.user.id,
            announcementId,
            recipientCount: allEmails.length,
            batchCount: batches.length,
            messageIds: sendResults
        });

        return NextResponse.json({
            success: true,
            message: `公告已成功發送給 ${allEmails.length} 位使用者 (分為 ${batches.length} 批次寄出)`,
            messageIds: sendResults,
            recipientCount: allEmails.length
        });

    } catch (err) {
        return handleApiError(err, '/api/send-announcement');
    }
}
