'use client';

import React, { useState, useEffect } from 'react';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import AnnouncementPDF from './AnnouncementPDF';
import { createRoot } from 'react-dom/client';

const DownloadPDFButton = ({ announcement, className }) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // 判斷是否為行動裝置
        const userAgent = typeof window.navigator === "undefined" ? "" : navigator.userAgent;
        const mobile = Boolean(/Android|iP(ad|hone|od)|IEMobile|BlackBerry|Opera Mini/i.test(userAgent));
        setIsMobile(mobile);
    }, []);

    // 電腦版：在新分頁中預覽 PDF
    const openPdfInNewTab = () => {
        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write('<!DOCTYPE html><html><head><title>正在生成 PDF...</title><style>body { margin: 0; padding: 0; overflow: hidden; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; background-color: #f0f0f0; } .loader { border: 8px solid #f3f3f3; border-top: 8px solid #3498db; border-radius: 50%; width: 60px; height: 60px; animation: spin 2s linear infinite; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style></head><body><div class="loader"></div></body></html>');
            newWindow.document.title = `彰師生輔組獎學金公告-${announcement.title}`;

            const container = newWindow.document.body;
            container.innerHTML = '';
            container.style.width = '100vw';
            container.style.height = '100vh';
            
            const root = createRoot(container);
            root.render(
                <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
                    <AnnouncementPDF announcement={announcement} />
                </PDFViewer>
            );
        }
    };

    // 手機版：直接下載 PDF
    const generateAndDownloadPdf = async () => {
        if (!announcement) {
            console.error("公告資料不存在。");
            return;
        }
        setIsLoading(true);
        try {
            const blob = await pdf(<AnnouncementPDF announcement={announcement} />).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `彰師生輔組獎學金公告-${announcement.title}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("PDF 生成失敗:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClick = () => {
        if (isMobile) {
            generateAndDownloadPdf();
        } else {
            openPdfInNewTab();
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`${className} whitespace-nowrap`}
            disabled={isLoading}
        >
            {isLoading ? '生成中...' : '下載'}
        </button>
    );
};

export default DownloadPDFButton;
