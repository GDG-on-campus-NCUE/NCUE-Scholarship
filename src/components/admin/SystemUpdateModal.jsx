'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Rocket, Zap, Shield, Smartphone, Share2, Mail, BarChart, BookOpen, Copy, Layout, Send, SortAsc, Key, CheckCircle, Info } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function SystemUpdateModal({ isOpen, onClose }) {
    const handleClose = () => {
        // Save to localStorage so it doesn't show again
        localStorage.setItem('system_update_v2_0_1_read', 'true');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="system-update-modal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-hidden"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                        className="bg-white w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="relative bg-gradient-to-r from-indigo-600 to-violet-600 p-6 sm:p-8 text-white flex-shrink-0">
                            <div className="absolute top-4 right-4">
                                <button 
                                    onClick={handleClose}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-2.5 py-1 bg-white/20 rounded-full text-xs font-bold tracking-wide backdrop-blur-md">
                                    v2.0.1
                                </span>
                                <span className="flex items-center gap-1.5 text-indigo-100 text-xs font-medium">
                                    <CalendarIcon className="w-3.5 h-3.5" /> 2026 / 1 / 16
                                </span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold mb-2">系統升級公告</h2>
                            <p className="text-indigo-100 text-sm sm:text-base">
                                親愛的系統管理員，平台已完成重大更新，為您帶來更流暢、安全的操作體驗！
                            </p>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar">
                            
                            {/* Section 1 */}
                            <section>
                                <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                                    <Rocket className="text-indigo-500" />
                                    前端體驗與傳播優化
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FeatureItem icon={SearchIcon} title="搜尋引擎檢索優化" desc="導入動態 Meta Tags 與 JSON-LD，大幅提升搜尋引擎索引效率。" />
                                    <FeatureItem icon={Smartphone} title="行動體驗優化" desc="手機版排版全面翻新，支援 Android/Windows PWA 安裝 (手機 APP 檢視體驗更佳)。" />
                                    <FeatureItem icon={Share2} title="社群分享預覽" desc="優化 LINE/FB 分享樣式，連結之預覽可顯示更完整的獎學金資訊。" />
                                    <FeatureItem icon={Mail} title="公告轉寄功能" desc="學生可一鍵寄送公告至個人信箱，重要資訊不漏接。" />
                                    <FeatureItem icon={BarChart} title="精確閱覽統計" desc="導入 IP 過濾機制，提供更真實的點閱數據。" />
                                    <FeatureItem icon={BookOpen} title="完整操作手冊" desc="新增詳細平台使用手冊，詳見「FAQ 與相關資源」。" />
                                </div>
                            </section>

                            {/* Section 2 */}
                            <section>
                                <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                                    <Zap className="text-amber-500" />
                                    管理端效率提升
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FeatureItem icon={Copy} title="快速複寫公告" desc="後台新增「複製公告」功能，可基於舊公告快速發布。" />
                                    <FeatureItem icon={Layout} title="管理介面優化" desc="視覺與操作流程再升級，管理更直覺。" />
                                    <FeatureItem icon={Send} title="精準群發系統" desc="支援分眾郵件推播（管理員/使用者/全體）。" />
                                    <FeatureItem icon={BarChart} title="數據分析中心" desc="新增「匯出與統計」，支援趨勢圖表與 CSV 下載。" />
                                    <FeatureItem icon={SortAsc} title="附檔排序功能" desc="支援自訂首頁公告附檔顯示順序。" />
                                </div>
                            </section>

                            {/* Section 3 */}
                            <section>
                                <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                                    <Shield className="text-emerald-500" />
                                    安全性與系統維護
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FeatureItem icon={Key} title="API 金鑰介面化" desc="可於「系統設定」直接管理 Gemini/TinyMCE 金鑰。" />
                                    <FeatureItem icon={CheckCircle} title="資安加固工程" desc="完成全站弱點掃描與修補，移除潛在威脅。" />
                                    <FeatureItem icon={Zap} title="底層效能優化" desc="提升系統回應速度，高負載下依然穩定。" />
                                </div>
                            </section>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600 flex gap-3 items-start">
                                <Info className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                                <p>
                                    若對本次更新內容有任何疑問或建議，歡迎隨時透過信箱聯繫系統開發者：
                                    <a href="mailto:3526ming@gmail.com" className="text-indigo-600 font-semibold hover:underline">陳泰銘</a>
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end flex-shrink-0">
                            <Button onClick={handleClose} className="w-full sm:w-auto min-w-[120px]">
                                我知道了
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Sub-components for cleaner code
function FeatureItem({ icon: Icon, title, desc }) {
    return (
        <div className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center flex-shrink-0 text-indigo-600">
                <Icon size={18} />
            </div>
            <div>
                <h4 className="font-bold text-gray-800 text-sm mb-1">{title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}

function SearchIcon(props) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
    )
}

function CalendarIcon(props) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
    )
}
