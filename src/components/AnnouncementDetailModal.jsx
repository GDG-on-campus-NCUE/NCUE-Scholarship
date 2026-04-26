'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Paperclip, Link as LinkIcon, Calendar, Users, Send as SendIcon, Download, Info, ExternalLink, Eye, Mail, Loader2 } from 'lucide-react';
import DownloadPDFButton from '@/components/admin/DownloadPDFButton';
import { useAuth } from '@/hooks/useAuth';
import { authFetch } from '@/lib/authFetch';
import { supabase } from '@/lib/supabase/client';
import Toast from '@/components/ui/Toast';

const categoryStyles = {
    A: { bg: 'bg-red-100', text: 'text-red-800' },
    B: { bg: 'bg-orange-100', text: 'text-orange-800' },
    C: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    D: { bg: 'bg-green-100', text: 'text-green-800' },
    E: { bg: 'bg-blue-100', text: 'text-blue-800' },
    F: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    G: { bg: 'bg-violet-100', text: 'text-violet-800' },
    default: { bg: 'bg-gray-100', text: 'text-gray-800' },
};
const getCategoryStyle = (cat) => categoryStyles[cat] || categoryStyles.default;

const getPublicAttachmentUrl = (filePath) => {
    if (!filePath) return '#';
    const parts = filePath.split('/');
    const fileName = parts[parts.length - 1];
    return `/api/attachments/${fileName}`;
};

// Helper to wrap tables in a scrollable container
const wrapTables = (htmlContent) => {
    if (!htmlContent) return '';
    return htmlContent.replace(
        /(<table[^>]*>[\s\S]*?<\/table>)/gi, 
        '<div class="table-scroll-wrapper">$1</div>'
    );
};

export default function AnnouncementDetailModal({ isOpen, onClose, announcement }) {
    const [viewCount, setViewCount] = useState(null);
    const { user } = useAuth();
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [fullAnnouncement, setFullAnnouncement] = useState(announcement);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const modalRef = useRef(null);

    const showToast = (message, type = 'success') => setToast({ show: true, message, type });

    useEffect(() => {
        if (isOpen && announcement) {
            setFullAnnouncement(announcement);
            
            if (!announcement.attachments) {
                setIsLoadingDetails(true);
                const fetchDetails = async () => {
                    const { data, error } = await supabase
                        .from('announcements')
                        .select('*, attachments(*)')
                        .eq('id', announcement.id)
                        .single();
                    
                    if (!error && data) {
                         setFullAnnouncement(prev => ({ ...prev, ...data }));
                    } else {
                        console.error("Error fetching announcement details:", error);
                        showToast("無法載入詳細內容", "error");
                    }
                    setIsLoadingDetails(false);
                };
                fetchDetails();
            }

            document.body.classList.add('modal-open');
            
            if (announcement?.id) {
                setViewCount(announcement.view_count || 0);
                fetch('/api/announcements/view', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ announcementId: announcement.id })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.view_count !== undefined) {
                        setViewCount(data.view_count);
                    }
                })
                .catch(console.error);
            }

            // Q19 & Q8: Modal 焦點捕捉 (Focus Trap)
            const handleFocusTrap = (e) => {
                if (!modalRef.current) return;
                
                // 獲取所有可獲取焦點的元素
                const focusableElements = modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (focusableElements.length === 0) return;
                
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.key === 'Tab') {
                    if (e.shiftKey) { // Shift + Tab: 往前循環
                        if (document.activeElement === firstElement) {
                            e.preventDefault();
                            lastElement.focus();
                        }
                    } else { // Tab: 往後循環
                        if (document.activeElement === lastElement) {
                            e.preventDefault();
                            firstElement.focus();
                        }
                    }
                }
                
                // 支援 ESC 鍵關閉
                if (e.key === 'Escape') onClose();
            };

            window.addEventListener('keydown', handleFocusTrap);

            // 自動聚焦到標題區
            setTimeout(() => {
                const titleElement = document.getElementById('modal-title');
                titleElement?.focus();
            }, 100);

            return () => window.removeEventListener('keydown', handleFocusTrap);

        } else {
            document.body.classList.remove('modal-open');
            setViewCount(null);
        }
    }, [isOpen, announcement]);

    const handleSendToEmail = async () => {
        if (!user) return;
        setIsSendingEmail(true);
        try {
            const response = await authFetch('/api/announcements/send-to-email', {
                method: 'POST',
                body: JSON.stringify({ announcement: fullAnnouncement })
            });
            const data = await response.json();
            if (response.ok) {
                showToast(data.message || '公告已成功寄送至您的信箱', 'success');
            } else {
                showToast(data.error || '寄送失敗，請稍後再試', 'error');
            }
        } catch (error) {
            showToast('寄送時發生錯誤', 'error');
        } finally {
            setIsSendingEmail(false);
        }
    };

    const parsedUrls = useMemo(() => {
        if (!fullAnnouncement?.external_urls) return [];
        try {
            const parsed = JSON.parse(fullAnnouncement.external_urls);
            if (Array.isArray(parsed)) {
                return parsed.filter(item => item.url && typeof item.url === 'string');
            }
        } catch (e) {
            if (typeof fullAnnouncement.external_urls === 'string' && fullAnnouncement.external_urls.startsWith('http')) {
                return [{ url: fullAnnouncement.external_urls }];
            }
        }
        return [];
    }, [fullAnnouncement]);

    const dateInfo = useMemo(() => {
        if (!fullAnnouncement) return { displayString: '未指定', colorClass: 'text-gray-600' };

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = fullAnnouncement.application_end_date ? new Date(fullAnnouncement.application_end_date) : null;
        const startDate = fullAnnouncement.application_start_date ? new Date(fullAnnouncement.application_start_date) : null;

        let colorClass = 'text-green-700';
        if (endDate === null) {
            colorClass = 'text-green-700';
        } else if (endDate < today) {
            colorClass = 'text-red-600';
        } else if (startDate && startDate > today) {
            colorClass = 'text-red-600';
        }

        const formattedStartDate = fullAnnouncement.application_start_date 
            ? new Date(fullAnnouncement.application_start_date).toLocaleDateString('en-CA') 
            : null;
        const formattedEndDate = fullAnnouncement.application_end_date 
            ? new Date(fullAnnouncement.application_end_date).toLocaleDateString('en-CA') 
            : '無期限';

        const displayString = formattedStartDate
            ? `${formattedStartDate} ~ ${formattedEndDate}`
            : formattedEndDate || '未指定';

        return { displayString, colorClass };
    }, [fullAnnouncement]);

    const targetAudienceHtml = useMemo(() => {
        if (!fullAnnouncement?.target_audience) return '未指定';
        return wrapTables(fullAnnouncement.target_audience);
    }, [fullAnnouncement]);

    const finalContent = useMemo(() => {
        if (!fullAnnouncement) return '無詳細內容';
        return wrapTables(fullAnnouncement.summary || '無詳細內容');
    }, [fullAnnouncement]);

    const sortedAttachments = useMemo(() => {
        if (!fullAnnouncement?.attachments) return [];
        return [...fullAnnouncement.attachments].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }, [fullAnnouncement]);

    if (!isOpen || !fullAnnouncement) return null;

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="modal-container"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-start sm:items-center overflow-y-auto p-0 sm:p-4"
                        onClick={onClose}
                    >
                        <style>{`
                            .rich-text-content {
                                overflow-x: hidden;
                            }
                            .rich-text-content p {
                                margin-bottom: 1rem;
                            }
                            .rich-text-content h1, .rich-text-content h2, .rich-text-content h3 {
                                font-weight: 700;
                                margin-top: 1.5rem;
                                margin-bottom: 0.75rem;
                                color: #1f2937;
                            }
                            .rich-text-content ul {
                                list-style-type: disc;
                                padding-left: 1.5rem;
                                margin-top: 0.5rem;
                                margin-bottom: 1rem;
                            }
                            .table-scroll-wrapper {
                                width: 100%;
                                overflow-x: auto;
                                -webkit-overflow-scrolling: touch;
                                margin-bottom: 1rem;
                                border: 1px solid #e5e7eb;
                                border-radius: 0.5rem;
                            }
                            .table-scroll-wrapper table {
                                width: 100% !important;
                                border-collapse: collapse;
                            }
                            .table-scroll-wrapper th, 
                            .table-scroll-wrapper td {
                                border: 1px solid #e5e7eb;
                                padding: 0.75rem 1rem;
                                white-space: normal;
                                min-width: 120px;
                            }
                            .hide-scrollbar::-webkit-scrollbar {
                                display: none;
                            }
                            .hide-scrollbar {
                                -ms-overflow-style: none;
                                scrollbar-width: none;
                            }
                        `}</style>
                        <motion.div
                            ref={modalRef}
                            initial={{ scale: 0.95, y: -20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 20, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="bg-white/85 backdrop-blur-lg w-full h-full sm:h-auto sm:max-h-[calc(100vh-4rem)] sm:w-full sm:max-w-4xl sm:rounded-2xl sm:shadow-2xl flex flex-col relative select-none outline-none overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-5 border-b border-black/10 flex justify-between items-center gap-4 flex-shrink-0">
                                <div className="flex items-center gap-3 outline-none" id="modal-title" tabIndex="-1">
                                    <span className={`flex-shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-lg text-sm font-bold ${getCategoryStyle(fullAnnouncement.category).bg} ${getCategoryStyle(fullAnnouncement.category).text}`}>
                                        {fullAnnouncement.category}
                                    </span>
                                    <h2 className="text-base md:text-xl font-bold text-gray-800">{fullAnnouncement.title}</h2>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button onClick={onClose} aria-label="關閉視窗" className="text-gray-500 hover:text-gray-700 p-2 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"><X size={20} /></button>
                                </div>
                            </div>

                            <div className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto hide-scrollbar">
                                <div className="grid grid-cols-1 sm:grid-cols-10 gap-x-8 gap-y-6 text-sm">
                                    <div className="sm:col-span-3 flex flex-col gap-y-6">
                                        <div className="flex items-start gap-3">
                                            <Calendar className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
                                            <div>
                                                <p className="font-semibold text-gray-500">申請期間</p>
                                                <p className={`font-bold text-sm ${dateInfo.colorClass}`}>
                                                    {dateInfo.displayString}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <SendIcon className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
                                            <div>
                                                <p className="font-semibold text-gray-500">送件方式</p>
                                                <p className="text-gray-800">{fullAnnouncement.submission_method || '未指定'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="sm:col-span-7 flex items-start gap-3">
                                        <Users className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
                                        <div>
                                            <p className="font-semibold text-gray-500">適用對象</p>
                                            <div
                                                className="text-gray-800 rich-text-content"
                                                dangerouslySetInnerHTML={{ __html: targetAudienceHtml }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-gray-200" />

                                <div>
                                    <h3 className="text-base font-semibold text-indigo-700 border-l-4 border-indigo-500 pl-3 mb-3">詳細內容</h3>
                                    {isLoadingDetails ? (
                                        <div className="flex items-center gap-2 text-slate-500 py-4">
                                            <Loader2 className="animate-spin h-5 w-5" aria-label="載入詳細內容中" />
                                            載入詳細內容中...
                                        </div>
                                    ) : (
                                        <div className="rich-text-content"
                                            dangerouslySetInnerHTML={{ __html: finalContent }} />
                                    )}
                                </div>

                                {sortedAttachments.length > 0 && (
                                    <div>
                                        <h3 className="text-base font-semibold text-indigo-700 border-l-4 border-indigo-500 pl-3 mb-3">相關附件</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {sortedAttachments.map((att, index) => (
                                                <a key={att.id}
                                                    href={getPublicAttachmentUrl(att.stored_file_path)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group flex items-center gap-3 bg-slate-100 hover:bg-indigo-100 hover:border-indigo-300 border border-transparent p-3 rounded-lg text-indigo-800 font-medium transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none">
                                                    <Paperclip className="h-5 w-5 flex-shrink-0 text-indigo-500 group-hover:text-indigo-600 transition-colors" aria-hidden="true" />
                                                    <span className="truncate flex-1">{index + 1}. {att.file_name}</span>
                                                    <span className="text-xs text-indigo-500/80 opacity-0 group-hover:opacity-100 transition-opacity">點擊下載</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {parsedUrls.length > 0 && (
                                    <div>
                                        <h3 className="text-base font-semibold text-indigo-700 border-l-4 border-indigo-500 pl-3 mb-3">外部連結</h3>
                                        <div className="space-y-2">
                                            {parsedUrls.map((item, index) => (
                                                <a key={index} href={item.url} target="_blank" rel="noopener noreferrer"
                                                    className="group flex items-center gap-3 text-blue-600 hover:text-blue-800 font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 outline-none p-1 rounded">
                                                    <LinkIcon className="h-4 w-4 transform group-hover:rotate-[-45deg] transition-transform flex-shrink-0" aria-hidden="true" />
                                                    <span className="break-all group-hover:underline">{item.url}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-5 border-t border-black/10 flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0 bg-gray-50/50">
                                <div className="flex items-center text-slate-500 text-sm font-medium gap-1.5 px-3">
                                    <Eye className="w-4 h-4 text-slate-400" aria-hidden="true" />
                                    <span className="tabular-nums">瀏覽數：{viewCount !== null ? viewCount : '...'} 次</span>
                                </div>
                                <div className="flex items-center justify-center sm:justify-end gap-3 flex-wrap w-full sm:w-auto">
                                    <DownloadPDFButton
                                        announcement={fullAnnouncement}
                                        className="flex items-center justify-center min-w-[80px] px-4 py-2 text-sm font-bold text-violet-700 bg-white hover:bg-violet-50 rounded-lg transition-all duration-200 border border-violet-200 shadow-sm hover:shadow-md active:scale-95 focus-visible:ring-2 focus-visible:ring-violet-500 outline-none"
                                    />
                                    {user && (
                                        <button
                                            onClick={handleSendToEmail}
                                            disabled={isSendingEmail || isLoadingDetails}
                                            aria-label="寄送公告詳情至我的電子信箱"
                                            className="flex items-center justify-center min-w-[80px] px-4 py-2 text-sm font-bold text-indigo-700 bg-white hover:bg-indigo-50 rounded-lg transition-all duration-200 border border-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-95 focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                                            title="傳送公告詳情至我的電子信箱"
                                        >
                                            <span>{isSendingEmail ? "傳送中..." : "寄送至信箱"}</span>
                                        </button>
                                    )}
                                    {fullAnnouncement.internal_id && (
                                        <a
                                            href={`https://docs.google.com/forms/d/e/1FAIpQLSct6GjpISj20foOtBK4TVcMCpSfULcagZTTN4_YkFTNK1DQbQ/viewform?usp=pp_url&entry.40872308=${fullAnnouncement.internal_id}${user ? `&entry.146368827=${encodeURIComponent(user.profile?.name || user.profile?.username || user.user_metadata?.name || '')}&entry.609200579=${encodeURIComponent((user.profile?.student_id || user.user_metadata?.student_id || '').toUpperCase())}` : ''}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center min-w-[80px] px-4 py-2 text-sm font-bold text-emerald-700 bg-white hover:bg-emerald-50 rounded-lg transition-all duration-200 border border-emerald-200 shadow-sm hover:shadow-md active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                                            title="前往 Google 表單進行現場交件資料登記"
                                        >
                                            <span>現場交件登記</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(prev => ({ ...prev, show: false }))} />
        </>
    );
}
