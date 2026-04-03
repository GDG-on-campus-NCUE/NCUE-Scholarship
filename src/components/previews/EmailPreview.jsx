'use client';

import { useMemo } from 'react';

const parseUrls = (urlsString) => {
    if (!urlsString) return [];
    try {
        const parsed = JSON.parse(urlsString);
        if (Array.isArray(parsed)) {
            return parsed.filter(item => item.url && typeof item.url === 'string');
        }
    } catch (e) {
        if (typeof urlsString === 'string' && urlsString.startsWith('http')) {
            return [{ url: urlsString }];
        }
    }
    return [];
};

export default function EmailPreview({ announcement }) {
    const platformUrlBase = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const platformUrlWithQuery = `${platformUrlBase}/?announcement_id=${announcement.id}`;
    const currentYear = new Date().getFullYear();

    const deadline = announcement.application_deadline || announcement.application_end_date
        ? new Date(announcement.application_deadline || announcement.application_end_date).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })
        : '未指定';
    
    const externalUrls = useMemo(() => parseUrls(announcement.external_urls), [announcement.external_urls]);
    
    let richTextContent = announcement.summary || '<p>請至平台查看詳細內容。</p>';

    // Absolute path conversion for preview
    richTextContent = richTextContent.replace(/(href|src)\s*=\s*["']([^"']*)["']/g, (match, attr, path) => {
        const trimmedPath = path.trim();
        if (/^(https?:|mailto:|tel:|#)/i.test(trimmedPath)) return match;
        if (trimmedPath.startsWith('//')) return `${attr}="https:${trimmedPath}"`;
        const absolutePath = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
        return `${attr}="${platformUrlBase}${absolutePath}"`;
    });

    const renderExternalUrls = () => {
        if (externalUrls.length === 0) return '';
        const linksHtml = externalUrls.map(item => 
            `<li style="margin-bottom: 8px;"><a href="${item.url}" target="_blank" style="color: #7c3aed; text-decoration: underline; word-break: break-all;">${item.url}</a></li>`
        ).join('');
        return `<hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" /><div style="margin-top: 24px;"><h3 style="font-weight: 700; color: #1f2937; margin-top: 24px; margin-bottom: 12px; font-size: 18px;">相關連結</h3><ul style="list-style-type: none; padding-left: 0; margin-top: 12px;">${linksHtml}</ul></div>`;
    };

    // Style constants to match route.js
    const emailStyles = {
        wrapper: { backgroundColor: '#f4f4f7', width: '100%', padding: '24px 0', fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif" },
        container: { maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb', textAlign: 'left' },
        header: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '32px', textAlign: 'center' },
        content: { padding: '32px 40px', color: '#374151' },
        h2: { color: '#1f2937', marginTop: '0', marginBottom: '24px', fontSize: '22px', fontWeight: '700' },
        detailsTable: { width: '100%', marginBottom: '24px', borderSpacing: '0' },
        label: { color: '#6b7280', fontWeight: '500', width: '90px', padding: '8px 10px 8px 0', fontSize: '15px', verticalAlign: 'top' },
        value: { color: '#1f2937', padding: '8px 0', fontSize: '15px', verticalAlign: 'top' },
        deadline: { color: '#9333ea', fontWeight: '700' },
        divider: { border: '0', borderTop: '1px solid #e5e7eb', margin: '24px 0' },
        prose: { fontSize: '16px', lineHeight: '1.7', color: '#374151' },
        ctaButton: { display: 'inline-block', backgroundColor: '#7c3aed', color: '#ffffff', padding: '14px 28px', borderRadius: '8px', textDecoration: 'none', fontSize: '16px', fontWeight: '500' },
        footer: { padding: '24px 40px', fontSize: '12px', textAlign: 'center', color: '#9ca3af', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb' }
    };

    return (
        <div className="w-full overflow-auto bg-gray-100 rounded-xl shadow-inner border border-gray-200">
            <div style={emailStyles.wrapper} className="email-wrapper-preview">
                <table style={emailStyles.container} cellPadding="0" cellSpacing="0" className="email-container-preview">
                    <tbody>
                        <tr>
                            <td style={emailStyles.header} className="email-header-preview">
                                <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 700 }}>生輔組校外獎助學金資訊平台</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style={emailStyles.content} className="email-content-preview">
                                <h2 style={emailStyles.h2}>{announcement.title}</h2>
                                <table style={emailStyles.detailsTable}>
                                    <tbody>
                                        {announcement.category && (
                                            <tr>
                                                <td style={emailStyles.label}>類 別</td>
                                                <td style={emailStyles.value}>{announcement.category}</td>
                                            </tr>
                                        )}
                                        <tr>
                                            <td style={emailStyles.label}>申請截止</td>
                                            <td style={emailStyles.value}><span style={emailStyles.deadline}>{deadline}</span></td>
                                        </tr>
                                        {announcement.target_audience && (
                                            <tr>
                                                <td style={emailStyles.label}>適用對象</td>
                                                <td style={emailStyles.value}>{announcement.target_audience.replace(/<[^>]*>?/gm, '')}</td>
                                            </tr>
                                        )}
                                        {announcement.submission_method && (
                                            <tr>
                                                <td style={emailStyles.label}>送件方式</td>
                                                <td style={emailStyles.value}>{announcement.submission_method}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                <hr style={emailStyles.divider} />
                                <div style={emailStyles.prose} className="email-prose-preview">
                                    <div dangerouslySetInnerHTML={{ __html: richTextContent }} />
                                    <div dangerouslySetInnerHTML={{ __html: renderExternalUrls() }} />
                                </div>
                                <table border="0" cellPadding="0" cellSpacing="0" width="100%" style={{ marginTop: '32px' }}>
                                    <tbody>
                                        <tr>
                                            <td align="center">
                                                <a href={platformUrlWithQuery} target="_blank" rel="noopener noreferrer" style={emailStyles.ctaButton}>
                                                    前往平台查看完整資訊
                                                </a>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style={emailStyles.footer}>
                                <p style={{ margin: '0 0 12px' }}>
                                    <a href={platformUrlBase} target="_blank" rel="noopener noreferrer" style={{ color: '#6b7280', textDecoration: 'none' }}>生輔組獎助學金資訊平台</a> 
                                    &nbsp;&bull;&nbsp; 
                                    <a href="https://stuaffweb.ncue.edu.tw/" target="_blank" rel="noopener noreferrer" style={{ color: '#6b7280', textDecoration: 'none' }}>生輔組首頁</a>
                                </p>
                                <p style={{ margin: '0 0 5px' }}>© {currentYear} 彰師生輔組校外獎助學金資訊平台. All Rights Reserved.</p>
                                <p style={{ margin: 0 }}>此為系統自動發送之信件，請勿直接回覆。</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <style jsx global>{`
                @media screen and (max-width: 600px) {
                    .email-wrapper-preview { padding: 12px 0 !important; }
                    .email-container-preview { width: 100% !important; border-radius: 0 !important; border-left: 0 !important; border-right: 0 !important; }
                    .email-content-preview { padding: 24px 16px !important; }
                    .email-header-preview { padding: 24px !important; }
                    .email-header-preview h1 { font-size: 22px !important; }
                    .email-content-preview h2 { font-size: 20px !important; }
                }
                .email-prose-preview p { margin: 0 0 16px; }
                .email-prose-preview a { color: #4f46e5; text-decoration: underline; }
                .email-prose-preview h1, .email-prose-preview h2, .email-prose-preview h3 { font-weight: 700; color: #1f2937; margin-top: 24px; margin-bottom: 12px; }
                .email-prose-preview h1 { font-size: 22px; }
                .email-prose-preview h2 { font-size: 20px; }
                .email-prose-preview h3 { font-size: 18px; }
                .email-prose-preview ul, .email-prose-preview ol { padding-left: 24px; margin-bottom: 16px; }
                .email-prose-preview li { margin-bottom: 8px; }
                .email-prose-preview table { width: 100% !important; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; border: 1px solid #dee2e6; }
                .email-prose-preview th, .email-prose-preview td { border: 1px solid #dee2e6; padding: 10px 12px; text-align: left; }
                .email-prose-preview th { background-color: #f8f9fa; font-weight: 600; color: #495057; }
                .email-prose-preview tr:nth-of-type(even) { background-color: #f8f9fa; }
                .email-prose-preview * { max-width: 100%; }
            `}</style>
        </div>
    );
}
