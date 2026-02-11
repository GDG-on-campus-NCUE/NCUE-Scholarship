'use client';

import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from '@/lib/supabase/client';

const DownloadPDFButton = ({ announcement, className }) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // 判斷是否為行動裝置
        const userAgent = typeof window.navigator === "undefined" ? "" : navigator.userAgent;
        const mobile = Boolean(/Android|iP(ad|hone|od)|IEMobile|BlackBerry|Opera Mini/i.test(userAgent));
        setIsMobile(mobile);
    }, []);

    const fetchFullAnnouncement = async (partialAnn) => {
        if (partialAnn.summary && partialAnn.attachments) return partialAnn;
        
        const { data, error } = await supabase
            .from('announcements')
            .select('*, attachments(*)')
            .eq('id', partialAnn.id)
            .single();
        
        if (error || !data) {
            console.error("Error fetching full announcement:", error);
            throw new Error("無法載入公告詳細資料");
        }
        return data;
    };

    // 電腦版：在新分頁中預覽 PDF
    const openPdfInNewTab = async () => {
        // Open window immediately to avoid popup blockers
        const newWindow = window.open('', '_blank');
        if (!newWindow) {
            alert('請允許開啟彈出視窗以預覽 PDF');
            return;
        }

        // Show loading state in the new window
        newWindow.document.write('<!DOCTYPE html><html><head><title>正在生成 PDF...</title><style>body { margin: 0; padding: 0; overflow: hidden; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; background-color: #f0f0f0; } .loader { border: 8px solid #f3f3f3; border-top: 8px solid #9f36d0; border-radius: 50%; width: 60px; height: 60px; animation: spin 2s linear infinite; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style></head><body><div class="loader"></div><div style="margin-left: 20px; color: #555; font-size: 1.2rem;">正在準備資料與生成 PDF...</div></body></html>');
        newWindow.document.title = `彰師生輔組獎學金公告-${announcement.title}`;

        try {
            // 1. Fetch data if needed
            const fullAnn = await fetchFullAnnouncement(announcement);

            // 2. Dynamic Import
            const { PDFViewer } = await import('@react-pdf/renderer');
            const { default: AnnouncementPDF } = await import('./AnnouncementPDF');

            // 3. Render
            const container = newWindow.document.body;
            container.innerHTML = '';
            container.style.width = '100vw';
            container.style.height = '100vh';
            
            const root = createRoot(container);
            root.render(
                <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
                    <AnnouncementPDF announcement={fullAnn} />
                </PDFViewer>
            );
        } catch (error) {
            console.error(error);
            newWindow.document.body.innerHTML = `<div style="padding: 20px; color: red;">PDF 生成失敗: ${error.message}</div>`;
        }
    };

    // 手機版：直接下載 PDF
    const generateAndDownloadPdf = async () => {
        try {
            // 1. Fetch data if needed
            const fullAnn = await fetchFullAnnouncement(announcement);

            // 2. Dynamic Import
            const { pdf } = await import('@react-pdf/renderer');
            const { default: AnnouncementPDF } = await import('./AnnouncementPDF');

            const blob = await pdf(<AnnouncementPDF announcement={fullAnn} />).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `彰師生輔組獎學金公告-${fullAnn.title}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("PDF 生成失敗:", error);
            alert(`PDF 生成失敗: ${error.message}`);
        }
    };

    const handleClick = async () => {
        if (!announcement) {
            console.error("公告資料不存在。");
            return;
        }
        
        setIsLoading(true);
        try {
            if (isMobile) {
                await generateAndDownloadPdf();
            } else {
                await openPdfInNewTab();
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`${className} whitespace-nowrap`}
            disabled={isLoading}
        >
            {isLoading ? '生成中...' : '下載 PDF'}
        </button>
    );
};

export default DownloadPDFButton;