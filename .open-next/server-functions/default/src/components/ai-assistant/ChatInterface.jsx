'use client'

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { authFetch } from '@/lib/authFetch';
import Toast from '@/components/ui/Toast';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { Loader2, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Database, Globe, Sparkles, Lightbulb, AlertTriangle } from 'lucide-react';

const ChatInterface = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const scrollAreaRef = useRef(null);
    const messagesEndRef = useRef(null);
    const hasStartedConversation = !isHistoryLoading && messages.length > 0;

    const scrollToBottom = useCallback(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, []);

    const loadChatHistory = useCallback(async () => {
        if (!user) {
            setIsHistoryLoading(false);
            return;
        };

        setIsHistoryLoading(true);
        try {
            const response = await authFetch(`/api/chat-history`);
            const data = await response.json();
            if (data.success && data.data.length > 0) {
                setMessages(data.data.map(msg => ({
                    role: msg.role,
                    content: msg.message_content,
                    timestamp: msg.timestamp
                })));
            }
        } catch (error) {
            setToast({ message: '載入歷史紀錄失敗', type: 'error' });
        } finally {
            setIsHistoryLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadChatHistory();
    }, [loadChatHistory]);

    useEffect(() => {
        const timer = setTimeout(() => {
            scrollToBottom();
        }, 100);
        return () => clearTimeout(timer);
    }, [messages, isHistoryLoading, scrollToBottom]);

    const handleSubmit = async (inputValue) => {
        const messageText = inputValue.trim();
        if (!messageText || isLoading) return;

        const newUserMessage = { role: 'user', content: messageText, timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, newUserMessage]);
        setIsLoading(true);

        try {
            const historyForAPI = [...messages].map(msg => ({
                role: msg.role,
                message_content: msg.content
            }));

            const response = await authFetch('/api/chat', {
                method: 'POST',
                body: JSON.stringify({ message: messageText, history: historyForAPI })
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'AI 回應時發生錯誤');
            }

            setMessages(prev => [...prev, { role: 'model', content: data.response, timestamp: new Date().toISOString() }]);

        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', content: '抱歉，發生錯誤，請稍後再試。', timestamp: new Date().toISOString() }]);
            setToast({ message: error.message, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRequestHumanSupport = async () => {
        if (isLoading) return;

        if (messages.length === 0) {
            alert("請先開始對話，才能尋求支援喔！");
            return;
        }

        if (window.confirm('您確定要將目前的對話紀錄傳送給獎學金承辦人員嗎？')) {
            setIsLoading(true);
            try {
                const response = await authFetch('/api/send-support-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: messages }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || '請求傳送失敗');
                }

                setToast({ message: data.message, type: 'success' });

            } catch (error) {
                setToast({ message: `錯誤：${error.message}`, type: 'error' });
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleClearHistory = async () => {
        if (isLoading) return;
        if (window.confirm('您確定要清除所有對話紀錄嗎？此操作無法復原。')) {
            setIsLoading(true);
            try {
                const response = await authFetch('/api/chat-history', {
                    method: 'DELETE',
                });
                const data = await response.json();

                if (!response.ok) throw new Error(data.error || '清除失敗');

                setMessages([]);
                setToast({ message: '對話紀錄已清除', type: 'success' });
            } catch (error) {
                setToast({ message: error.message, type: 'error' });
            } finally {
                setIsLoading(false);
            }
        }
    };

    const WelcomeMessage = () => (
        <div className="flex flex-col justify-center items-center h-full text-center p-4 sm:p-8 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl mb-5 flex items-center justify-center">
                <MessageSquare size={32} className="text-indigo-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
                彰師 AI 獎學金助理
            </h2>
            <p className="text-gray-500 mt-2 text-sm">
                Powered by Gemini 2.5 Flash
            </p>

            <div className="text-left space-y-8 mt-8 text-gray-700">
                <div>
                    <h3 className="font-semibold text-gray-800 mb-4 text-base">為您精準查找獎學金資訊的智慧流程</h3>
                    <div className="space-y-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 mt-1 mr-4 w-8 h-8 flex items-center justify-center bg-indigo-100 rounded-full">
                                <Database size={18} className="text-indigo-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-800">內部知識庫優先</h4>
                                <p className="text-sm text-gray-600">優先於校內獎學金資料庫進行語意搜尋，透過 AI 評分，提供最直接相關的公告資訊。</p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <div className="flex-shrink-0 mt-1 mr-4 w-8 h-8 flex items-center justify-center bg-green-100 rounded-full">
                                <Globe size={18} className="text-green-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-800">外部網路檢索</h4>
                                <p className="text-sm text-gray-600">若內部資料不足或相關性低，系統將自動擴大搜尋範圍至外部網路，整合可信的公開資訊。</p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <div className="flex-shrink-0 mt-1 mr-4 w-8 h-8 flex items-center justify-center bg-amber-100 rounded-full">
                                <Sparkles size={18} className="text-amber-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-800">AI 統整生成</h4>
                                <p className="text-sm text-gray-600">彙整所有檢索資訊作為上下文，最終生成一段條理分明、引述來源的客觀答覆。</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-10 text-xs text-gray-500 border-t border-gray-200 pt-6 w-full text-center">
                <p className="font-semibold text-red-600 flex items-center justify-center">
                    <AlertTriangle size={14} className="mr-1.5" />
                    AI 生成內容免責聲明
                </p>
                <p className="mt-2 leading-relaxed">
                    AI 生成內容僅供參考，不構成任何形式的建議、保證或法律意見。
                    <br className="hidden md:block" />
                    <span className="inline-block mt-1 md:mt-0">
                        您有最終責任詳閱原始公告內容，並自行核實所有資訊的正確性。
                    </span>
                    <br className="hidden md:block" />
                    <span className="inline-block mt-1 md:mt-0">
                        開始使用本服務即代表您已詳閱並同意我們的
                        <Link href="/terms-and-privacy" target='_blank' className="text-indigo-600 font-semibold hover:underline mx-1">
                            服務條款
                        </Link>
                        。
                    </span>
                </p>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col flex-1 bg-white overflow-hidden">
            <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 md:p-6 chat-scroll-fade">
                <div className="space-y-6 max-w-4xl mx-auto">
                    {isHistoryLoading ? (
                        <div className="flex justify-center items-center h-full pt-20">
                            <Loader2 className="animate-spin text-indigo-500" size={32} />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <WelcomeMessage />
                        </div>
                    ) : (
                        messages.map((msg, index) => (
                            <MessageBubble key={index} message={msg} user={user} />
                        ))
                    )}

                    {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                        <MessageBubble 
                            isLoading={true} 
                            message={{ 
                                role: 'model', 
                                content: '', 
                                timestamp: new Date().toISOString() 
                            }} 
                            user={user} 
                        />
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="p-4 bg-white flex-shrink-0">
                <div className="max-w-4xl mx-auto">
                    <ChatInput
                        onSubmit={handleSubmit}
                        onClear={handleClearHistory}
                        isLoading={isLoading}
                        onSupportRequest={handleRequestHumanSupport}
                        hasStarted={hasStartedConversation}
                    />
                </div>
            </div>

            {toast && <Toast show={!!toast} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default ChatInterface;