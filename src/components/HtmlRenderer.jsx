'use client';

import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

const HtmlRenderer = ({ content, isUser = false }) => {
    // 狀態：確保只在客戶端渲染，以避免 Next.js 的 hydration 錯誤
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // 如果沒有內容，或還在伺服器端渲染，則不顯示任何東西
    if (!content || !isClient) {
        return null;
    }

    // 移除多餘的 br 標籤，並處理可能的特殊分隔線字符
    const processedContent = content
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/\\n/g, '\n');

    const cleanContent = DOMPurify.sanitize(processedContent, {
        ADD_ATTR: ['style', 'class', 'target'],
        ALLOWED_CSS_PROPERTIES: ['color'],
        ADD_TAGS: ['iframe'], 
    });

    return (
        <div className={`rich-text-content prose prose-sm max-w-none 
            ${isUser ? 'prose-invert' : 'prose-slate'} 
            prose-headings:text-slate-900 prose-headings:font-bold prose-headings:mt-7 prose-headings:mb-3
            prose-p:leading-relaxed prose-p:mb-4
            prose-ul:pl-6 prose-ul:mb-4
            prose-ol:pl-6 prose-ol:mb-4
            prose-li:my-1.5
            prose-table:border prose-table:border-slate-200 prose-table:rounded-lg
            prose-th:bg-slate-50 prose-th:px-3 prose-th:py-2 prose-th:text-slate-700
            prose-td:px-3 prose-td:py-2 prose-td:border-t prose-td:border-slate-100
            prose-hr:hidden
        `}>
            <ReactMarkdown 
                rehypePlugins={[rehypeRaw]}
                components={{
                    // ✅ 連結樣式：預設即為紫色，深色底線
                    a: ({ node, ...props }) => (
                        <a 
                            {...props} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={`${isUser ? 'text-white underline' : 'text-violet-600 hover:text-violet-700 font-semibold underline underline-offset-4 decoration-violet-400 hover:decoration-violet-600'} transition-all duration-200`}
                        />
                    ),
                    // 標題樣式
                    h1: ({node, ...props}) => <h1 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-b border-slate-100 pb-2 ml-0" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-lg font-bold text-slate-800 mt-7 mb-3 ml-0 flex items-center gap-2" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-base font-bold text-slate-800 mt-6 mb-2 ml-0" {...props} />,
                    
                    // 段落：移除縮排
                    p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
                    
                    // 清單樣式：使用標準縮排
                    ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-1" {...props} />,
                    li: ({node, ...props}) => <li className="text-slate-700" {...props} />,

                    // 表格：移除左側位移
                    table: ({node, ...props}) => (
                        <div className="overflow-x-auto my-6 rounded-lg border border-slate-200 shadow-sm">
                            <table className="min-w-full divide-y divide-slate-200" {...props} />
                        </div>
                    ),
                    
                    // 區塊引用：移除縮排
                    blockquote: ({node, ...props}) => (
                        <blockquote className="border-l-4 border-slate-200 pl-4 italic text-slate-500 my-6 bg-slate-50/50 py-2 rounded-r-lg" {...props} />
                    ),
                    
                    // 移除 br 顯示
                    br: () => null,
                    
                    // 移除 hr (分隔線) 以減少間距
                    hr: () => null
                }}
            >
                {cleanContent}
            </ReactMarkdown>
            
            <style jsx global>{`
                .rich-text-content br {
                    display: none !important;
                }
                /* 修正清單內段落不應再次縮排 */
                .rich-text-content li p {
                    padding-left: 0 !important;
                    margin-bottom: 0.5rem !important;
                }
            `}</style>
        </div>
    );
};

export default HtmlRenderer;
