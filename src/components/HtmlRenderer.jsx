'use client';

import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

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

    const cleanContent = DOMPurify.sanitize(content, {
        ADD_ATTR: ['style', 'class', 'target'],
        ALLOWED_CSS_PROPERTIES: ['color'],
        ADD_TAGS: ['iframe'], // Allow iframes if needed, but mostly for safety to match previous potentially permissive behavior if any
    });

    return (
        <div className="rich-text-content prose prose-sm max-w-none">
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                {cleanContent}
            </ReactMarkdown>
        </div>
    );
};

export default HtmlRenderer;
