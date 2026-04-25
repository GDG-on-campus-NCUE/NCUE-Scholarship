'use client'

import { useAuth } from '@/hooks/useAuth'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import ChatInterface from '@/components/ai-assistant/ChatInterface'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AlertCircle, ShieldAlert } from 'lucide-react'

export default function AiAssistantPage() {
    const { isAuthenticated, loading: authLoading } = useAuth()
    const { settings, loading: settingsLoading } = useSystemSettings()
    const router = useRouter()

    const loading = authLoading || settingsLoading
    const isAiEnabled = settings?.AI_ASSISTANT_ENABLED !== false

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login?redirect=/ai-assistant')
        }
    }, [isAuthenticated, authLoading, router])

    // 在此頁面隱藏全域 Footer，並鎖定 body 捲動
    useEffect(() => {
        const footer = document.querySelector('footer');
        if (footer) footer.style.display = 'none';
          
        document.body.style.overscrollBehavior = 'none';
        document.documentElement.style.overscrollBehavior = 'none';

        return () => {
            if (footer) footer.style.display = '';
            document.body.style.overscrollBehavior = '';
            document.documentElement.style.overscrollBehavior = '';
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium font-sans">系統載入中...</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    // AI Assistant Disabled State
    if (!isAiEnabled) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-[calc(100dvh-72px)] bg-slate-50 px-6">
                <div className="bg-white p-10 rounded-3xl border border-gray-200 shadow-xl max-w-md w-full text-center space-y-6 transform transition-all hover:shadow-2xl">
                    <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <ShieldAlert size={40} strokeWidth={2.5} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-gray-900 font-sans tracking-tight">AI 助理服務維護中</h2>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            抱歉，平台管理員目前已暫時關閉「AI 獎助學金助理」功能。
                        </p>
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                        <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1.5 font-medium uppercase tracking-widest">
                            <AlertCircle size={12} />
                            ADMINISTRATOR_RESTRICTED
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div 
            className="flex flex-col overflow-hidden w-full relative bg-slate-50/50" 
            style={{ 
                height: 'calc(100dvh - var(--header-height, 72px))',
                overscrollBehavior: 'none'
            }} 
        >
            <ChatInterface />
        </div>
    );
}