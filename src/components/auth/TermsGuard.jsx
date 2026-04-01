"use client";

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePathname, useRouter } from 'next/navigation';

export default function TermsGuard({ children }) {
    const { isAuthenticated, hasAgreedToTerms, loading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (!loading && isAuthenticated && !hasAgreedToTerms && pathname !== '/terms-and-privacy') {
            router.push('/terms-and-privacy');
        }
    }, [isAuthenticated, hasAgreedToTerms, loading, pathname, router]);

    // 如果已登入但未同意條款，且不在條款頁面，隱藏內容以防止存取
    if (isAuthenticated && !hasAgreedToTerms && pathname !== '/terms-and-privacy') {
        return (
            <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-600 font-medium">正在載入條款同意頁面...</p>
                </div>
            </div>
        );
    }

    return children;
}
