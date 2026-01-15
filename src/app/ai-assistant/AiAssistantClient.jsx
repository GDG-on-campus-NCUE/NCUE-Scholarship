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
        // 容器高度 = 視窗高度(100vh) - Header 高度
        <div className="flex flex-col" style={{ height: 'calc(100vh - var(--header-height, 80px))' }} >
            <ChatInterface />
        </div>
    );
}