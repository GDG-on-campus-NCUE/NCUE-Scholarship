'use client'

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { authFetch } from '@/lib/authFetch';
import { supabase } from '@/lib/supabase/client';
import Toast from '@/components/ui/Toast';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { Loader2, MessageSquare, Database, Globe, Sparkles, ShieldCheck } from 'lucide-react';
import { useChat } from '@ai-sdk/react';

const ChatInterface = () => {
    const { user } = useAuth();
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const scrollAreaRef = useRef(null);
    const messagesEndRef = useRef(null);
    const [sessionId, setSessionId] = useState(null);

    // 手動管理 input 狀態
    const [input, setInput] = useState('');

    // useChat 配置
    const { 
        messages, 
        sendMessage, 
        setMessages, 
        isLoading 
    } = useChat({
        api: '/api/chat',
        // 💡 基礎 fetch 攔截器，用於確保 SDK 內部的自動請求也帶有 Token
        fetch: async (url, options) => {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const newHeaders = new Headers(options.headers || {});
            if (token) newHeaders.set('Authorization', `Bearer ${token}`);
            return fetch(url, { ...options, headers: newHeaders });
        },
        body: {
            sessionId: sessionId
        },
        onError: (error) => {
            console.error('AI SDK Error:', error);
            const errorMsg = error.message?.includes('401') ? '登入已過期，請重新登入' : (error.message || 'AI 回應時發生錯誤');
            setToast({ message: errorMsg, type: 'error' });
        }
    });

    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    const onChatSubmit = async (e) => {
        e?.preventDefault();
        const content = input.trim();
        if (!content || isLoading) return;
        
        setInput(''); 

        try {
            // ✅ v5 強化版傳遞方式：在 sendMessage 時顯式提供 headers
            // 這是為了防止 fetch 攔截器在某些 SDK 內部邏輯中被繞過
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            await sendMessage({ text: content }, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
        } catch (error) {
            console.error('Submit error:', error);
            setInput(content); 
        }
    };

    const hasStartedConversation = !isHistoryLoading && messages.length > 0;

    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
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
                if (data.data[0]?.session_id) {
                    setSessionId(data.data[0].session_id);
                }

                setMessages(data.data.map(msg => ({
                    id: msg.id || crypto.randomUUID(),
                    role: msg.role === 'model' ? 'assistant' : 'user',
                    content: msg.message_content,
                    createdAt: new Date(msg.timestamp)
                })));
            }
        } catch (error) {
            setToast({ message: '載入歷史紀錄失敗', type: 'error' });
        } finally {
            setIsHistoryLoading(false);
        }
    }, [user, setMessages]);

    useEffect(() => {
        loadChatHistory();
    }, [loadChatHistory]);

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages, isLoading, scrollToBottom]);

    const handleClearHistory = async () => {
        if (isLoading) return;
        if (window.confirm('您確定要清除所有對話紀錄嗎？此操作無法復原。')) {
            try {
                const response = await authFetch('/api/chat-history', { method: 'DELETE' });
                if (!response.ok) throw new Error('清除失敗');
                setMessages([]);
                setSessionId(null); 
                setToast({ message: '對話紀錄已清除', type: 'success' });
            } catch (error) {
                setToast({ message: error.message, type: 'error' });
            }
        }
    };

    const handleRequestHumanSupport = async () => {
        if (isLoading) return;
        if (messages.length === 0) {
            setToast({ message: "請先開始對話，才能尋求支援喔！", type: 'warning' });
            return;
        }
        if (window.confirm('您確定要將目前的對話紀錄傳送給獎學金承辦人員嗎？')) {
            try {
                const response = await authFetch('/api/send-support-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: messages }),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || '請求傳送失敗');
                setToast({ message: data.message, type: 'success' });
            } catch (error) {
                setToast({ message: `錯誤：${error.message}`, type: 'error' });
            }
        }
    };

    const WelcomeMessage = () => (
        <div className="flex flex-col justify-center items-center h-full text-center px-4 py-8 max-w-3xl mx-auto animate-in fade-in zoom-in duration-500">
            <div className="mb-8 relative">
                <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 rounded-full"></div>
                <div className="w-20 h-20 bg-white border border-indigo-100 shadow-xl rounded-2xl flex items-center justify-center relative z-10">
                    <Sparkles size={40} className="text-indigo-600" />
                </div>
            </div>
            
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">彰師 AI 獎學金助理</h2>
            <p className="text-gray-500 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                我是您的專屬智慧助手，結合校內知識庫與網路搜尋，為您提供精準的獎學金諮詢服務。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left mb-12">
                <div className="p-5 bg-white border border-indigo-50/50 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-3"><Database size={20} className="text-indigo-600" /></div>
                    <h4 className="font-bold text-gray-800 mb-1">精準檢索</h4>
                    <p className="text-sm text-gray-600 leading-snug">優先搜尋校內獎學金資料庫，提供最相關的公告資訊。</p>
                </div>
                <div className="p-5 bg-white border border-green-50/50 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3"><Globe size={20} className="text-green-600" /></div>
                    <h4 className="font-bold text-gray-800 mb-1">廣泛搜尋</h4>
                    <p className="text-sm text-gray-600 leading-snug">若內部資訊不足，自動擴大搜尋網路公開資訊。</p>
                </div>
                <div className="p-5 bg-white border border-amber-50/50 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-3"><MessageSquare size={20} className="text-amber-600" /></div>
                    <h4 className="font-bold text-gray-800 mb-1">智慧摘要</h4>
                    <p className="text-sm text-gray-600 leading-snug">彙整多方資訊，生成條理分明的客觀答覆與建議。</p>
                </div>
            </div>

            <div className="bg-gray-50/80 rounded-lg p-4 w-full text-xs text-gray-500 border border-gray-100">
                <p className="font-semibold text-gray-700 flex items-center justify-center mb-1"><ShieldCheck size={14} className="mr-1.5 text-indigo-600" />使用前請詳閱</p>
                <p>AI 回覆僅供參考，不代表學校官方立場。詳細規定請務必以<span className="font-medium text-gray-700">原始公告</span>為準。</p>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col flex-1 bg-slate-50/50 overflow-hidden font-sans">
            <div ref={scrollAreaRef} className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
                <div className="min-h-full flex flex-col p-4 md:p-6 lg:p-8 max-w-5xl mx-auto w-full">
                    {isHistoryLoading ? (
                        <div className="flex-1 flex flex-col justify-center items-center gap-3">
                            <Loader2 className="animate-spin text-indigo-500" size={36} />
                            <p className="text-sm text-gray-400 font-medium">載入對話紀錄中...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center py-10"><WelcomeMessage /></div>
                    ) : (
                        <div className="space-y-6 md:space-y-8 pb-4">
                            {messages.map((msg, index) => (
                                <MessageBubble 
                                    key={msg.id || index} 
                                    message={{
                                        ...msg,
                                        role: msg.role === 'assistant' ? 'model' : msg.role,
                                        timestamp: msg.createdAt || new Date()
                                    }} 
                                    user={user} 
                                />
                            ))}
                            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                                <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <MessageBubble isLoading={true} />
                                </div>
                            )}
                            <div ref={messagesEndRef} className="h-4" />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-shrink-0 bg-gradient-to-t from-white via-white to-transparent pt-4">
                <div className="max-w-5xl mx-auto w-full">
                    <ChatInput
                        input={input}
                        handleInputChange={handleInputChange}
                        handleSubmit={onChatSubmit}
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
