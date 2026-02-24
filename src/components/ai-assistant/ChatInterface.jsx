'use client'

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { authFetch } from '@/lib/authFetch';
import { supabase } from '@/lib/supabase/client';
import Toast from '@/components/ui/Toast';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { Loader2, MessageSquare, Database, Globe, Sparkles, ShieldCheck } from 'lucide-react';

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
            <div className="p-5 bg-white border border-indigo-50/50 rounded-xl shadow-sm">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-3"><Database size={20} className="text-indigo-600" /></div>
                <h4 className="font-bold text-gray-800 mb-1">精準檢索</h4>
                <p className="text-sm text-gray-600 leading-snug">優先搜尋校內獎學金資料庫，提供最相關的公告資訊。</p>
            </div>
            <div className="p-5 bg-white border border-green-50/50 rounded-xl shadow-sm">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3"><Globe size={20} className="text-green-600" /></div>
                <h4 className="font-bold text-gray-800 mb-1">廣泛搜尋</h4>
                <p className="text-sm text-gray-600 leading-snug">若內部資訊不足，自動擴大搜尋網路公開資訊。</p>
            </div>
            <div className="p-5 bg-white border border-amber-50/50 rounded-xl shadow-sm">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-3"><MessageSquare size={20} className="text-amber-600" /></div>
                <h4 className="font-bold text-gray-800 mb-1">智慧摘要</h4>
                <p className="text-sm text-gray-600 leading-snug">彙整多方資訊，生成條理分明的客觀答覆與建議。</p>
            </div>
        </div>

        <div className="bg-gray-50/80 rounded-lg p-4 w-full text-xs text-gray-500 border border-gray-100">
            <p className="font-semibold text-gray-700 flex items-center justify-center mb-1"><ShieldCheck size={14} className="mr-1.5 text-indigo-600" />使用前請詳閱</p>
            <p>AI 回覆僅供參考，詳細規定請務必以<span className="font-medium text-gray-700">原始公告</span>為準。</p>
        </div>
    </div>
);

const ChatInterface = () => {
    const { user } = useAuth();
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const scrollAreaRef = useRef(null);
    const messagesEndRef = useRef(null);
    
    // ✅ 完全手動原生狀態管理
    const [sessionId, setSessionId] = useState(null);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    // ✅ 自製的串流發送邏輯，保證相容且絕對不會鎖死輸入框
    const onChatSubmit = async (e) => {
        e?.preventDefault();
        const contentToSend = input.trim();
        if (!contentToSend || isLoading) return;
        
        // 1. 清空輸入框並設定狀態
        setInput('');
        setIsLoading(true);
        
        const currentSessionId = sessionId || crypto.randomUUID();
        if (!sessionId) setSessionId(currentSessionId);

        // 2. 將使用者的訊息加入畫面
        const userMessage = { id: crypto.randomUUID(), role: 'user', content: contentToSend, createdAt: new Date() };
        const aiMessageId = crypto.randomUUID();
        setMessages(prev => [...prev, userMessage]);

        try {
            // 抓取最新 Token
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                    sessionId: currentSessionId,
                    text: contentToSend
                })
            });

            if (!response.ok) {
                if (response.status === 401) throw new Error('登入已過期，請重新登入');
                if (response.status === 429) throw new Error('請求太頻繁，請稍候再試');
                throw new Error('伺服器發生錯誤');
            }

            // 3. 處理 SSE 串流
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiFullResponse = '';
            let aiFullReasoning = '';
            let lineBuffer = '';

            // 先在畫面上塞入一個空的 AI 訊息
            setMessages(prev => [
                ...prev, 
                { id: aiMessageId, role: 'model', content: '', reasoning: '', createdAt: new Date() }
            ]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                lineBuffer += decoder.decode(value, { stream: true });
                const lines = lineBuffer.split('\n');
                lineBuffer = lines.pop() || ''; // 留下最後一行（可能不完整）
                
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) continue;
                    
                    const firstColonIndex = trimmedLine.indexOf(':');
                    if (firstColonIndex === -1) continue;

                    const type = trimmedLine.substring(0, firstColonIndex);
                    const data = trimmedLine.substring(firstColonIndex + 1);

                    try {
                        const textValue = JSON.parse(data);

                        if (type === '0') {
                            aiFullResponse += textValue;
                        } else if (type === '8') {
                            aiFullReasoning += textValue;
                        } else {
                            continue; // 忽略其他類型
                        }
                        
                        // 即時更新畫面上的 AI 訊息
                        setMessages(prev => prev.map(msg => 
                            msg.id === aiMessageId ? { ...msg, content: aiFullResponse, reasoning: aiFullReasoning } : msg
                        ));
                    } catch (e) {
                        // parse error, 略過
                    }
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
            setToast({ message: error.message || 'AI 回應時發生錯誤', type: 'error' });
            // 如果失敗，把字還給使用者並移除剛才加進去的訊息
            setInput(contentToSend);
            setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
        } finally {
            setIsLoading(false);
        }
    };

    const hasStartedConversation = !isHistoryLoading && messages.length > 0;

    // 精確控制局部捲動，不再使用會觸發視窗捲動的 scrollIntoView
    const scrollToBottom = useCallback((behavior = 'smooth') => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current;
            scrollContainer.scrollTo({
                top: scrollContainer.scrollHeight,
                behavior
            });
        }
    }, []);

    const loadChatHistory = useCallback(async () => {
        if (!user) {
            setIsHistoryLoading(false);
            return;
        }
        setIsHistoryLoading(true);
        try {
            const response = await authFetch(`/api/chat-history`);
            const data = await response.json();
            if (data.success && data.data.length > 0) {
                if (data.data[0]?.session_id) setSessionId(data.data[0].session_id);

                setMessages(data.data.map(msg => ({
                    id: msg.id || crypto.randomUUID(),
                    role: msg.role === 'model' ? 'model' : 'user', // Ensure role matches our frontend expectation
                    content: msg.message_content,
                    createdAt: new Date(msg.timestamp)
                })));
                
                // 載入完畢後瞬間捲到底部，不使用動畫
                setTimeout(() => scrollToBottom('instant'), 100);
            }
        } catch (error) {
            setToast({ message: '載入歷史紀錄失敗', type: 'error' });
        } finally {
            setIsHistoryLoading(false);
        }
    }, [user, scrollToBottom]);

    useEffect(() => { loadChatHistory(); }, [loadChatHistory]);
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
        if (messages.length === 0) return setToast({ message: "請先開始對話，才能尋求支援喔！", type: 'warning' });
        
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

    return (
        <div className="flex flex-col flex-1 bg-slate-50/50 overflow-hidden font-sans relative">
            {/* 對話顯示區域 - 限制在此內部捲動 */}
            <div 
                ref={scrollAreaRef} 
                className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth"
            >
                <div className="min-h-full flex flex-col p-4 md:p-6 lg:p-8 max-w-5xl mx-auto w-full">
                    {isHistoryLoading ? (
                        <div className="flex-1 flex flex-col justify-center items-center gap-3">
                            <Loader2 className="animate-spin text-indigo-500" size={36} />
                            <p className="text-sm text-gray-400 font-medium">載入對話紀錄中...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center py-10"><WelcomeMessage /></div>
                    ) : (
                        <div className="space-y-6 md:space-y-8 pb-12"> {/* 增加底部間距 */}
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
                            {isLoading && messages[messages.length - 1]?.role !== 'model' && (
                                <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <MessageBubble isLoading={true} />
                                </div>
                            )}
                            {/* 錨點 */}
                            <div className="h-4" />
                        </div>
                    )}
                </div>
            </div>

            {/* 輸入區域 - 固定在容器底部 */}
            <div className="flex-shrink-0 bg-gradient-to-t from-white via-white to-transparent pt-4 pb-2 z-10">
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