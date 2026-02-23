'use client';

import { useState, useEffect, useRef, useContext, useCallback, Suspense } from "react";
import { HeaderContext } from '@/components/Header';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { authFetch } from '@/lib/authFetch';
import SettingsTab from '@/components/admin/SettingsTab';
import AnnouncementsTab from '@/components/admin/AnnouncementsTab';
import UsersTab from '@/components/admin/UsersTab';
import ExportAndStatisticsTab from '@/components/admin/ExportAndStatisticsTab';
import Toast from '@/components/ui/Toast';
import SystemUpdateModal from '@/components/admin/SystemUpdateModal';
import { Users, FileText, Settings, Loader2, Shield, BarChart, Sparkles, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const ADMIN_NOTICES_CONFIG = [
    {
        id: 'updates',
        title: '近期更新公告',
        titleColor: 'text-red-600',
        contentColor: 'text-red-700',
        dotColor: 'bg-red-600',
        pingColor: 'bg-red-400',
        showPing: true,
        icon: Info,
        items: [
            "已修復「複製公告」功能附件無法穩定複製的問題，煩請確認 2/23 透過該功能上傳之公告的附檔能正確顯示。"
        ]
    },
    {
        id: 'suggestions',
        title: '系統管理公告',
        titleColor: 'text-purple-700',
        contentColor: 'text-purple-800/70',
        dotColor: 'bg-purple-400',
        showPing: false,
        icon: Sparkles,
        items: [
            "請務必在上傳附件前先「修改檔名」，以利學生辨識內容。",
            "系統偵測過期公告（超過 2 年）時會跳出提示，請務必定期清理。"
        ]
    }
];

// 管理員公告區塊組件
const AdminNotice = () => {
    return (
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col sm:flex-row gap-6 md:gap-12"
        >
            {ADMIN_NOTICES_CONFIG.map((section) => (
                <div key={section.id} className="space-y-2">
                    {/* 標題列 */}
                    <div className={`flex items-center gap-1.5 ${section.titleColor} font-bold text-[10px] uppercase tracking-[0.2em]`}>
                        {section.showPing ? (
                            <span className="relative flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${section.pingColor} opacity-75`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${section.dotColor}`}></span>
                            </span>
                        ) : (
                            <section.icon className="h-3.5 w-3.5" />
                        )}
                        {section.title}
                    </div>

                    {/* 內容列表 */}
                    <ul className="space-y-1.5">
                        {section.items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 group">
                                <span className={`mt-1.5 w-1 h-1 rounded-full ${section.dotColor} opacity-40 shrink-0`} />
                                <p className={`text-sm ${section.contentColor} font-medium leading-relaxed max-w-xs`}>
                                    {item}
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </motion.div>
    );
};

const tabs = [
    { id: 'announcements', label: '公告管理', icon: FileText, component: <AnnouncementsTab /> },
    { id: 'users', label: '使用者管理', icon: Users, component: <UsersTab /> },
    { id: 'export-stats', label: '匯出與統計', icon: BarChart, component: <ExportAndStatisticsTab /> },
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
                        font-medium text-sm transition-colors duration-300 rounded-full select-none
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
    
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
    const showToast = (message, type) => setToast({ show: true, message, type });
    const hideToast = () => setToast(prev => ({ ...prev, show: false }));

    const [showUpdateModal, setShowUpdateModal] = useState(false);

    useEffect(() => {
        const hasSeenUpdate = localStorage.getItem('system_update_v2_0_1_read');
        if (!hasSeenUpdate) {
            setShowUpdateModal(true);
        }
    }, []);

    useEffect(() => {
        const checkOverdue = async () => {
             if (isAuthenticated && isAdmin) {
                 try {
                     const res = await authFetch('/api/admin/announcements/stats');
                     const data = await res.json();
                     if (data.overdueCount > 0) {
                         showToast(`系統偵測到有 ${data.overdueCount} 筆公告已過期 (超過 2 年)，建議前往「匯出與統計」進行匯出並刪除。`, 'error');
                     }
                 } catch (e) { console.error('Failed to check overdue', e); }
             }
        };
        checkOverdue();
    }, [isAuthenticated, isAdmin]);

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
                <header className="pt-16 pb-12 select-none">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div>
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-2 mb-2"
                            >
                                <div className="h-1 w-8 bg-purple-600 rounded-full" />
                                <span className="text-sm font-bold text-purple-600 uppercase tracking-widest">Admin Dashboard</span>
                            </motion.div>
                            <h1 className="text-5xl font-black tracking-tight text-gray-900">管理後台</h1>
                        </div>
                        
                        <div className="w-full md:w-auto">
                            <AdminNotice />
                        </div>
                    </div>
                    <div className="h-px w-full bg-linear-to-r from-transparent via-gray-200 to-transparent" />
                </header>

                <div ref={triggerRef} className="flex justify-center mb-10 w-full max-w-md mx-auto sm:max-w-none">
                    <TabComponent activeTab={activeTab} onTabClick={handleTabClick} isOverDark={false} />
                </div>

                <main className="pb-12">
                    {ActiveComponent}
                </main>
            </div>
            <SystemUpdateModal isOpen={showUpdateModal} onClose={() => setShowUpdateModal(false)} />
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
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
