'use client';

import { useState, useEffect, useRef, useContext, useCallback, Suspense } from "react";
import { HeaderContext } from '@/components/Header';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import SettingsTab from '@/components/admin/SettingsTab';
import AnnouncementsTab from '@/components/admin/AnnouncementsTab';
import UsersTab from '@/components/admin/UsersTab';
import UsageTab from '@/components/admin/UsageTab';
import { Users, FileText, Settings, Loader2, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const tabs = [
    { id: 'announcements', label: '公告管理', icon: FileText, component: <AnnouncementsTab /> },
    { id: 'users', label: '使用者管理', icon: Users, component: <UsersTab /> },
    { id: 'usage', label: '相關連結', icon: Settings, component: <UsageTab /> },
    { id: 'settings', label: '系統設定', icon: Shield, component: <SettingsTab /> },
];

const TabComponent = ({ activeTab, onTabClick, isOverDark = false, isFloating = false }) => {
    const tabsRef = useRef([]);
    const activeTabRef = tabsRef.current[tabs.findIndex(tab => tab.id === activeTab)];

    return (
        <nav className={`relative grid grid-cols-4 items-center p-1 gap-1 rounded-full shadow-inner transition-colors duration-300 backdrop-blur-xl overflow-hidden
            ${isOverDark
                ? 'bg-white/15'
                : 'bg-black/[0.04]'
            }
        `}>
            <motion.span
                className="absolute top-1 bottom-1 rounded-full bg-purple-300/20"
                layoutId="bubble"
                initial={false}
                animate={{ x: activeTabRef?.offsetLeft, width: activeTabRef?.offsetWidth }}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
            {tabs.map((tab, index) => (
                <button
                    key={tab.id}
                    ref={el => tabsRef.current[index] = el}
                    onClick={() => onTabClick(tab.id)}
                    className={`
                        relative z-10 flex items-center justify-center gap-2 whitespace-nowrap
                        h-10 py-2.5 px-3 sm:px-4
                        font-medium text-sm transition-colors duration-300 rounded-full
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500
                        ${activeTab === tab.id
                            ? (isOverDark ? 'text-purple-300 font-semibold' : 'text-purple-700 font-semibold')
                            : (isOverDark ? 'text-white hover:text-gray-200' : 'text-gray-800 hover:text-black')
                        }
                    `}
                >
                    <tab.icon className={`h-5 w-5 ${isFloating ? 'hidden' : 'hidden md:block'}`} />
                    <span>{tab.label}</span>
                </button>
            ))}
        </nav>
    );
};

function isColorDark(color) {
    if (!color || color === 'transparent' || color.startsWith('rgba(') && color.endsWith(', 0)')) return false;
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return false;
    const luminance = (0.299 * match[1] + 0.587 * match[2] + 0.114 * match[3]) / 255;
    return luminance < 0.5;
}

function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

function ManagePageContent() {
    const { isAuthenticated, isAdmin, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'announcements');
    const { ref: triggerRef, inView: isContentTabsInView } = useInView({ threshold: 0.5 });

    const headerContext = useContext(HeaderContext);
    const isHeaderVisible = headerContext?.isHeaderVisible ?? true;

    const [isOverDarkBg, setIsOverDarkBg] = useState(false);
    const stickyTabRef = useRef(null);

    const checkBackgroundColor = useCallback(() => {
        if (!stickyTabRef.current || isContentTabsInView) return;

        const tabRect = stickyTabRef.current.getBoundingClientRect();

        const samplePoints = [
            { x: tabRect.left + 1, y: tabRect.top + 1 },
            { x: tabRect.left + tabRect.width / 2, y: tabRect.top + tabRect.height / 2 },
            { x: tabRect.right - 1, y: tabRect.bottom - 1 }
        ];

        let darkCount = 0;

        for (const point of samplePoints) {
            const elements = document.elementsFromPoint(point.x, point.y);
            for (const element of elements) {
                if (!stickyTabRef.current.contains(element)) {
                    const bgColor = window.getComputedStyle(element).backgroundColor;
                    if (isColorDark(bgColor)) {
                        darkCount++;
                    }
                    break;
                }
            }
        }

        setIsOverDarkBg(darkCount >= 2);

    }, [isContentTabsInView]);

    useEffect(() => {
        const throttledCheck = throttle(checkBackgroundColor, 100);
        throttledCheck();
        window.addEventListener('scroll', throttledCheck, { passive: true });
        return () => window.removeEventListener('scroll', throttledCheck);
    }, [checkBackgroundColor]);

    const handleTabClick = (tabId) => {
        setActiveTab(tabId);
        router.push(`/manage?tab=${tabId}`, { scroll: false });
    };

    if (loading || !isAuthenticated || !isAdmin) {
        return <div className="w-full flex items-center justify-center py-24"><Loader2 className="h-12 w-12 text-indigo-600 animate-spin" /></div>;
    }

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || null;

    return (
        <div className="w-full bg-white min-h-screen">
            <motion.div
                ref={stickyTabRef}
                className="fixed top-0 left-0 w-full z-40 px-4 pointer-events-none"
                initial={{ y: '-150%', opacity: 0 }}
                animate={{
                    y: isContentTabsInView ? '-150%' : (isHeaderVisible ? '88px' : '20px'),
                    opacity: isContentTabsInView ? 0 : 1
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                <div className="max-w-sm sm:max-w-md mx-auto pointer-events-auto">
                    <TabComponent activeTab={activeTab} onTabClick={handleTabClick} isOverDark={isOverDarkBg} isFloating={true} />
                </div>
            </motion.div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <header className="py-12 text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900">管理後台</h1>
                    <p className="mt-3 text-lg text-gray-500">在這裡你可以針對 彰師生輔組 —— 校外獎助學金資訊平台的所有公告、使用者進行相關操作。</p>
                </header>

                <div ref={triggerRef} className="flex justify-center mb-10 w-full max-w-md mx-auto sm:max-w-none">
                    <TabComponent activeTab={activeTab} onTabClick={handleTabClick} isOverDark={false} />
                </div>

                <main className="pb-12">
                    {ActiveComponent}
                </main>
            </div>
        </div>
    );
}

export default function ManagePage() {
    return (
        <Suspense fallback={
            <div className="w-full flex items-center justify-center py-24">
                <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
            </div>
        }>
            <ManagePageContent />
        </Suspense>
    );
}
