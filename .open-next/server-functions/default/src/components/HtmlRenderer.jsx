'use client';

import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';

const HtmlRenderer = ({ content }) => {
    // 狀態：確保只在客戶端渲染，以避免 Next.js 的 hydration 錯誤
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // 如果沒有內容，或還在伺服器端渲染，則不顯示任何東西
    if (!content || !isClient) {
        return null;
    }

    const cleanHtml = DOMPurify.sanitize(content, {
        ADD_ATTR: ['style', 'class', 'target'],
        ALLOWED_CSS_PROPERTIES: ['color'],
    });

    return (
        <div
            className="rich-text-content prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: cleanHtml }}
        />
    );
};

export default HtmlRenderer;
