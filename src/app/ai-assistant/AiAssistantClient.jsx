'use client'

import { useAuth } from '@/hooks/useAuth'
import ChatInterface from '@/components/ai-assistant/ChatInterface'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AiAssistantPage() {
    const { isAuthenticated, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login?redirect=/ai-assistant')
        }
    }, [isAuthenticated, loading, router])

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
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">載入中...</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
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