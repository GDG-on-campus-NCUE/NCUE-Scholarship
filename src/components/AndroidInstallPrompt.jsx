'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, MonitorSmartphone } from 'lucide-react';
import IconButton from '@/components/ui/IconButton';

export default function AndroidInstallPrompt() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        // Only run on client side
        if (typeof window === 'undefined') return;

        // 1. Check if Android
        const isAndroid = /Android/i.test(navigator.userAgent);
        if (!isAndroid) return;

        // 2. Check if already PWA (standalone mode)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        if (isStandalone) return;

        // 3. Check if dismissed previously
        const isDismissed = localStorage.getItem('android-install-prompt-dismissed');
        if (isDismissed) {
             return;
        }

        // 4. Listen for beforeinstallprompt
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Fallback: Show prompt after 5 seconds to guide manual installation if beforeinstallprompt doesn't fire
        const timer = setTimeout(() => {
            setShowPrompt(true);
        }, 5000);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            clearTimeout(timer);
        };
    }, []);

    const handleInstallPwa = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                setShowPrompt(false);
            }
        } else {
            alert('請點擊瀏覽器選單 (⋮) 並選擇「安裝應用程式」或「加到主畫面」。');
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('android-install-prompt-dismissed', 'true');
    };

    return (
        <AnimatePresence>
            {showPrompt && (
                <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 pointer-events-none">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleDismiss}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ y: '100%', opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: '100%', opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative bg-white w-full max-w-sm sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 pointer-events-auto overflow-hidden"
                    >
                         {/* Decorative Background Shape */}
                         <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-100 rounded-full blur-2xl opacity-50 pointer-events-none"></div>
                         <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-100 rounded-full blur-2xl opacity-50 pointer-events-none"></div>

                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                    <Smartphone size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 leading-tight">
                                        安裝網頁版 App
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        建議您將本平台加入主畫面以獲得最佳體驗
                                    </p>
                                </div>
                            </div>
                            <IconButton 
                                onClick={handleDismiss} 
                                className="text-gray-400 hover:text-gray-600 -mr-2 -mt-2"
                                aria-label="關閉"
                            >
                                <X size={20} />
                            </IconButton>
                        </div>

                        <div className="space-y-3 relative z-10">
                            <button
                                onClick={handleInstallPwa}
                                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20"
                            >
                                <MonitorSmartphone size={20} />
                                <span>立即安裝</span>
                            </button>

                            {!deferredPrompt && (
                                <p className="text-xs text-center text-gray-400 mt-2">
                                    若「立即安裝」無反應，請使用瀏覽器選單「加到主畫面」
                                </p>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
