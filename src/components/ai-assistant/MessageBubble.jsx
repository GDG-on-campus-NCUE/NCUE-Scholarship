'use client';

import { useState, useEffect } from 'react';
import HtmlRenderer from '@/components/HtmlRenderer';
import AnnouncementCard from './AnnouncementCard';
import { User, Sparkles, Bot, BrainCircuit } from 'lucide-react';

const MessageBubble = ({ message, user, isLoading = false }) => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-end gap-3 max-w-2xl w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 mb-1">
                    <Sparkles size={16} className="text-indigo-600" />
                </div>
                <div className="p-4 bg-white border border-gray-100 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                </div>
            </div>
        );
    }

    if (!message) return null;

    const isUser = message.role === 'user';
    const name = isUser ? (user?.user_metadata?.name || 'User') : 'AI Assistant';
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
    
    // 支援 v5/v6 的 parts 結構提取文字
    let messageContent = '';
    if (message.parts && Array.isArray(message.parts)) {
        messageContent = message.parts
            .filter(part => part.type === 'text')
            .map(part => part.text)
            .join('');
    } else {
        messageContent = message.content || '';
    }

    let content = messageContent.replace(cardRegex, (match, ids) => {
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
                        user?.user_metadata?.avatar_url ? (
                            <img src={user.user_metadata.avatar_url} alt={name} className="w-full h-full rounded-full object-cover" />
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

                {/* 💡 顯示 AI 思考過程 (Reasoning) */}
                {!isUser && message.reasoning && (
                    <div className="mb-2 w-full animate-in fade-in slide-in-from-top-1 duration-500">
                        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 mb-1 px-1">
                            <BrainCircuit size={12} className="text-indigo-400" />
                            <span>AI 正在思考...</span>
                        </div>
                        <div className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-500 italic leading-relaxed">
                            {message.reasoning}
                        </div>
                    </div>
                )}

                <div className={`relative px-5 py-3.5 shadow-sm text-[15px] leading-relaxed break-words
                    ${isUser
                        ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none selection:bg-indigo-800'
                        : 'bg-white text-slate-800 border border-gray-200/60 rounded-2xl rounded-tl-none selection:bg-indigo-100'
                    }`}
                >
                     {isClient && (
                        <>
                            <div className={`prose prose-sm max-w-none 
                                ${isUser ? 'prose-invert text-white prose-p:leading-relaxed' : 'text-slate-700 prose-headings:text-slate-900 prose-strong:text-slate-900 prose-a:text-indigo-600 hover:prose-a:text-indigo-700'}
                                prose-p:my-1.5 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5
                            `}>
                                <HtmlRenderer content={content} />
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
            </div>
        </div>
    );
};

export default MessageBubble;
