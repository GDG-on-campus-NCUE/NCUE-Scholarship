'use client';

import { useState, useEffect, useRef } from 'react';
import HtmlRenderer from '@/components/HtmlRenderer';
import AnnouncementCard from './AnnouncementCard';
import { Sparkles, Bot, ChevronDown, ChevronUp, BrainCircuit, Search } from 'lucide-react';

/**
 * ✅ 思考計時器組件
 * 顯示 00.00 格式的快速計時 (秒.毫秒)
 */
const ThinkingTimer = ({ isStopped }) => {
    const [ms, setMs] = useState(0);
    const startTimeRef = useRef(Date.now());

    useEffect(() => {
        if (isStopped) return;
        
        const interval = setInterval(() => {
            const delta = Date.now() - startTimeRef.current;
            setMs(delta);
        }, 33); // 約 30fps 更新一次

        return () => clearInterval(interval);
    }, [isStopped]);

    const seconds = Math.floor(ms / 1000);
    const remainingMs = Math.floor((ms % 1000) / 10);
    
    return (
        <span className="font-mono tabular-nums opacity-60">
            {seconds.toString().padStart(2, '0')}.{remainingMs.toString().padStart(2, '0')}
        </span>
    );
};

/**
 * ✅ 遞迴處理 <think> 標籤並渲染 Markdown
 */
const ThoughtSection = ({ content, reasoning, hasFormalContent, isStreaming = false }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const prevIsThinkingRef = useRef(false);
    const prevHasFormalContentRef = useRef(false);

    const isThinking = !!reasoning || (content && content.includes('<think>') && !content.includes('</think>')) || (isStreaming && !hasFormalContent);

    // 💡 強化版自動展開/收合邏輯
    useEffect(() => {
        // 1. 當進入「思考狀態」且還沒有正式回覆時，自動展開
        if (isThinking && !prevIsThinkingRef.current && !hasFormalContent) {
            setIsExpanded(true);
        }
        prevIsThinkingRef.current = isThinking;

        // 2. 當「正式回覆」首次出現時，自動收合
        if (hasFormalContent && !prevHasFormalContentRef.current) {
            setIsExpanded(false);
        }
        prevHasFormalContentRef.current = hasFormalContent;
    }, [isThinking, hasFormalContent]);

    const parts = [];

    if (reasoning || (isStreaming && !hasFormalContent)) {
        parts.push({ 
            type: 'thought', 
            value: reasoning || (isStreaming ? '' : ''), 
            isUnfinished: !hasFormalContent && isStreaming 
        });
    } else if (content) {
        // 解析嵌套標籤 (簡單正則提取最外層)
        const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
        let lastIndex = 0;
        let match;

        while ((match = thinkRegex.exec(content)) !== null) {
            if (match.index > lastIndex) {
                parts.push({ type: 'text', value: content.substring(lastIndex, match.index) });
            }
            parts.push({ type: 'thought', value: match[1] });
            lastIndex = thinkRegex.lastIndex;
        }

        if (lastIndex < content.length) {
            const remaining = content.substring(lastIndex);
            if (remaining.includes('<think>')) {
                const [pre, post] = remaining.split('<think>');
                if (pre) parts.push({ type: 'text', value: pre });
                parts.push({ type: 'thought', value: post, isUnfinished: true });
            } else {
                parts.push({ type: 'text', value: remaining });
            }
        }
    }

    if (parts.length === 0) return null;

    return (
        <div className="space-y-3 mb-4 w-full">
            {parts.map((part, idx) => {
                if (part.type === 'text') {
                    return part.value.trim() ? (
                        <div key={idx} className="prose prose-sm max-w-none text-slate-700">
                            <HtmlRenderer content={part.value} />
                        </div>
                    ) : null;
                }

                return (
                    <div key={idx} className="w-full">
                        {/* 藥丸按鈕 */}
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-100 bg-white shadow-sm text-[11px] font-medium text-slate-600 hover:bg-indigo-50/30 transition-all select-none group"
                        >
                            <div className="relative">
                                <Search size={13} className={`text-indigo-500 ${!isExpanded && part.isUnfinished ? 'animate-pulse' : ''}`} />
                                {!isExpanded && part.isUnfinished && (
                                    <div className="absolute inset-0 bg-indigo-400 blur-md opacity-40 animate-ping rounded-full"></div>
                                )}
                            </div>
                            
                            <span className="flex items-center gap-1.5">
                                {part.isUnfinished ? 'Gemini 正在搜尋資料庫，深度思考中...' : '顯示思路'}
                                <ThinkingTimer isStopped={!part.isUnfinished} />
                            </span>

                            {isExpanded ? <ChevronUp size={13} className="opacity-50 group-hover:opacity-100" /> : <ChevronDown size={13} className="opacity-50 group-hover:opacity-100" />}
                        </button>
                        
                        {/* 思考內容 (支援 Markdown) */}
                        {isExpanded && (
                            <div className="relative mt-2 pl-4 py-1 ml-2 animate-in fade-in slide-in-from-left-1 duration-500">
                                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-200 via-indigo-100 to-transparent rounded-full opacity-60"></div>
                                <div className="text-[13px] text-slate-500/90 italic leading-relaxed prose prose-sm prose-slate prose-p:my-1 prose-pre:bg-slate-50/50">
                                    {part.value ? <HtmlRenderer content={part.value} /> : <span className="opacity-50">正在整理思維脈絡...</span>}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const MessageBubble = ({ message, user, isLoading = false, isStreaming = false }) => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // ✅ 強化版的載入中 UI (Gemini 深度思考風格)
    if (isLoading && !message) {
        return (
            <div className="flex gap-3 w-full group animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex-shrink-0 flex flex-col items-center gap-1 mt-1">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white border border-indigo-100 text-indigo-600 shadow-sm">
                        <Sparkles size={18} />
                    </div>
                </div>
                <div className="flex flex-col items-start max-w-[85%] sm:max-w-[75%]">
                    <div className="flex items-baseline gap-2 mb-2 px-1">
                        <span className="text-xs font-semibold text-gray-500">AI Assistant</span>
                    </div>
                    
                    {/* 即時顯示思考藥丸 */}
                    <div className="mb-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-100 bg-white shadow-sm text-[11px] font-medium text-slate-600 select-none">
                            <div className="relative">
                                <Search size={13} className="text-indigo-500 animate-pulse" />
                                <div className="absolute inset-0 bg-indigo-400 blur-md opacity-40 animate-ping rounded-full"></div>
                            </div>
                            <span className="flex items-center gap-1.5">
                                Gemini 正在搜尋資料庫，深度思考中...
                                <ThinkingTimer isStopped={false} />
                            </span>
                        </div>
                    </div>

                    {/* 準備回應的動態點 */}
                    <div className="px-5 py-3 bg-white border border-gray-100 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!message) return null;

    const isUser = message.role === 'user';
    const name = isUser ? (user?.profile?.username || user?.user_metadata?.name || 'User') : 'AI Assistant';
    const avatarChar = name.charAt(0).toUpperCase();

    let time = '';
    try {
        if (message.timestamp) {
            time = new Date(message.timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
        }
    } catch (e) { /* ignore */ }

    // Parse announcement cards
    const cardRegex = /\[ANNOUNCEMENT_CARD:([\w,-]+)\]/g;
    let rawAnnouncementIds = [];
    
    let messageContent = message.content || '';

    const mainContentFiltered = messageContent.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/<think>[\s\S]*/, '').trim();

    let parsedContent = mainContentFiltered.replace(cardRegex, (match, ids) => {
        rawAnnouncementIds.push(...ids.split(','));
        return '';
    }).trim();

    const announcementIds = [...new Set(rawAnnouncementIds)];

    return (
        <div className={`flex gap-3 w-full ${isUser ? 'flex-row-reverse' : 'flex-row'} group`}>
            {/* Avatar */}
            <div className={`flex-shrink-0 flex flex-col items-center gap-1 ${isUser ? 'mt-1' : 'mt-1'}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm text-sm font-bold select-none transition-transform group-hover:scale-105
                    ${isUser 
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white ring-2 ring-white' 
                        : 'bg-white border border-indigo-100 text-indigo-600'
                    }`}
                >
                    {isUser ? (
                        (user?.profile?.avatar_url || user?.user_metadata?.avatar_url) ? (
                            <img src={user?.profile?.avatar_url || user?.user_metadata?.avatar_url} alt={name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            avatarChar
                        )
                    ) : (
                        <Sparkles size={18} />
                    )}
                </div>
            </div>

            {/* Message Body */}
            <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div className="flex items-baseline gap-2 mb-1 px-1">
                    <span className="text-xs font-semibold text-gray-500">{name}</span>
                    <span className="text-[10px] text-gray-400">{time}</span>
                </div>

                {/* 💡 AI 思考過程區塊 */}
                {!isUser && (message.reasoning || messageContent.includes('<think>') || (isLoading && !parsedContent)) && (
                    <ThoughtSection content={messageContent} reasoning={message.reasoning} hasFormalContent={!!parsedContent} isStreaming={isLoading} />
                )}

                {/* 主對話框 */}
                {parsedContent ? (
                    <div className={`relative px-5 py-3.5 shadow-sm text-[15px] leading-relaxed break-words w-fit
                        ${isUser
                            ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none selection:bg-indigo-800 ml-auto'
                            : 'bg-white text-slate-800 border border-gray-200/60 rounded-2xl rounded-tl-none selection:bg-indigo-100 mr-auto'
                        }`}
                    >
                         {isClient && (
                            <>
                                <div className="max-w-none">
                                    <HtmlRenderer content={parsedContent} isUser={isUser} />
                                </div>

                                {announcementIds.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-gray-100/10 space-y-3 w-full">
                                        <p className="text-xs font-medium opacity-70 mb-2 flex items-center gap-1">
                                            <Bot size={12} />
                                            相關公告推薦
                                        </p>
                                        <div className="grid grid-cols-1 gap-2">
                                            {announcementIds.map(id => <AnnouncementCard key={id} id={id.trim()} />)}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    !isUser && isLoading && (
                        <div className="px-5 py-3 bg-white border border-gray-100 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5 animate-pulse">
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default MessageBubble;
