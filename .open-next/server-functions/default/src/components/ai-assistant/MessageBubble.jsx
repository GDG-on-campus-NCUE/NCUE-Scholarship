'use client';

import { useState, useEffect } from 'react';
import HtmlRenderer from '@/components/HtmlRenderer';
import AnnouncementCard from './AnnouncementCard';
import { User, Sparkles } from 'lucide-react';

const MessageBubble = ({ message, user, isLoading = false }) => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-start gap-3 max-w-2xl w-full">
                <div className="flex flex-col items-center w-10 flex-shrink-0">
                    <div className="relative w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center gemini-avatar-glow">
                        <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                            <Sparkles size={20} className="text-gray-600" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">Gemini</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-2xl flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                </div>
            </div>
        );
    }

    if (!message) {
        return null;
    }

    const isUser = message.role === 'user';
    const name = isUser ? (user?.user_metadata?.name || 'User') : 'Gemini';
    const avatarChar = name.charAt(0).toUpperCase();

    let time = '';
    try {
        time = new Date(message.timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch (e) { /* 忽略無效日期 */ }

    const cardRegex = /\[ANNOUNCEMENT_CARD:([\w,-]+)\]/g;
    let rawAnnouncementIds = [];
    let content = message.content.replace(cardRegex, (match, ids) => {
        rawAnnouncementIds.push(...ids.split(','));
        return '';
    }).trim();

    const announcementIds = [...new Set(rawAnnouncementIds)];

    return (
        <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse ml-auto' : ''} max-w-2xl w-full`}>
            {/* 頭像、名字區塊 */}
            <div className="flex flex-col items-center w-10 flex-shrink-0">
                <div className={`relative w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center text-white font-bold
                    ${isUser ? 'bg-purple-400' : ''}`}
                >
                    {isUser ?
                        (user?.user_metadata?.name ? avatarChar : <User size={20} />) :
                        <div className="w-full h-full bg-white rounded-full flex items-center justify-center border-2 border-gray-200">
                            <Sparkles size={20} className="text-gray-600" />
                        </div>
                    }
                </div>
                <p className="text-xs text-gray-500 mt-1.5 whitespace-nowrap">{name}</p>
            </div>

            {/* 訊息內容區塊 */}
            <div className={`flex flex-col w-[calc(100%-52px)] ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-3 rounded-2xl w-fit max-w-full
                    ${isUser
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}
                >
                    {isClient && (
                        <>
                            <div className="prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-table:my-4">
                                <HtmlRenderer content={content} />
                            </div>

                            {announcementIds.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-t-black/10 space-y-3">
                                    {announcementIds.map(id => <AnnouncementCard key={id} id={id.trim()} />)}
                                </div>
                            )}
                        </>
                    )}
                </div>
                {time && <p className="text-xs text-gray-400 mt-1.5 px-2">{time}</p>}
            </div>
        </div>
    );
};

export default MessageBubble;
