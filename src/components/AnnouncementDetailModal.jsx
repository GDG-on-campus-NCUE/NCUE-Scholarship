'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Paperclip, Link as LinkIcon, Calendar, Users, Send as SendIcon, Download, Info, ExternalLink, Eye } from 'lucide-react';
import DownloadPDFButton from '@/components/admin/DownloadPDFButton';

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
    // Use regex to find table tags and wrap them
    // Note: This matches the opening <table...> up to the closing </table>
    return htmlContent.replace(
        /(<table[^>]*>[\s\S]*?<\/table>)/gi, 
        '<div class="table-scroll-wrapper">$1</div>'
    );
};

export default function AnnouncementDetailModal({ isOpen, onClose, announcement }) {
    const [viewCount, setViewCount] = useState(null);

    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('modal-open');
            
            // Fetch and increment view count
            if (announcement?.id) {
                // Initialize with existing count if available (optional)
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

        } else {
            document.body.classList.remove('modal-open');
            setViewCount(null);
        }
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [isOpen, announcement]);

    const parsedUrls = useMemo(() => {
        if (!announcement?.external_urls) return [];
        try {
            const parsed = JSON.parse(announcement.external_urls);
            if (Array.isArray(parsed)) {
                return parsed.filter(item => item.url && typeof item.url === 'string');
            }
        } catch (e) {
            if (typeof announcement.external_urls === 'string' && announcement.external_urls.startsWith('http')) {
                return [{ url: announcement.external_urls }];
            }
        }
        return [];
    }, [announcement]);

    const dateInfo = useMemo(() => {
        if (!announcement) return { displayString: '未指定', colorClass: 'text-gray-600' };

        // Logic from AnnouncementList.jsx for consistent date status coloring
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = announcement.application_end_date ? new Date(announcement.application_end_date) : null;
        const startDate = announcement.application_start_date ? new Date(announcement.application_start_date) : null;

        let colorClass = 'text-green-600';
        if (endDate === null) {
            colorClass = 'text-green-600';
        } else if (endDate < today) {
            colorClass = 'text-red-600';
        } else if (startDate && startDate > today) {
            colorClass = 'text-red-600';
        }

        const formattedStartDate = announcement.application_start_date 
            ? new Date(announcement.application_start_date).toLocaleDateString('en-CA') 
            : null;
        const formattedEndDate = announcement.application_end_date 
            ? new Date(announcement.application_end_date).toLocaleDateString('en-CA') 
            : '無期限';

        const displayString = formattedStartDate
            ? `${formattedStartDate} ~ ${formattedEndDate}`
            : formattedEndDate || '未指定';

        return { displayString, colorClass };
    }, [announcement]);

    const targetAudienceHtml = useMemo(() => {
        if (!announcement?.target_audience) return '未指定';
        return wrapTables(announcement.target_audience);
    }, [announcement]);

    const finalContent = useMemo(() => {
        if (!announcement) return '無詳細內容';
        return wrapTables(announcement.summary || '無詳細內容');
    }, [announcement]);

    const sortedAttachments = useMemo(() => {
        if (!announcement?.attachments) return [];
        return [...announcement.attachments].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }, [announcement]);

    if (!isOpen || !announcement) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-start sm:items-center overflow-y-auto p-0 sm:p-4"
                    onClick={onClose}
                >
                    <style>{`
                        /* This rule hides the site header and prevents background scroll when the modal is open */
                        body.modal-open {
                            overflow: hidden;
                        }
                        body.modal-open .header-fixed {
                            display: none;
                        }
                        .rich-text-content {
                            overflow-x: hidden; /* Prevent horizontal scroll on container */
                        }
                        /* Scroll wrapper for tables */
                        .table-scroll-wrapper {
                            width: 100%;
                            overflow-x: auto;
                            -webkit-overflow-scrolling: touch;
                            margin-bottom: 1rem;
                            border: 1px solid #e5e7eb;
                            border-radius: 0.5rem;
                        }
                        .table-scroll-wrapper table {
                            width: 100% !important; /* Force full width within wrapper */
                            border-collapse: collapse;
                            margin: 0; /* Remove margin as wrapper handles it */
                        }
                        .table-scroll-wrapper th, 
                        .table-scroll-wrapper td {
                            padding: 0.75rem 1rem;
                            white-space: normal; /* Allow text wrapping */
                            min-width: 120px; /* Ensure columns don't collapse too much on mobile */
                        }
                        .rich-text-content img {
                            max-width: 100%;
                            height: auto;
                        }
                        /* Hide scrollbar */
                        .hide-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                        .hide-scrollbar {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                    `}</style>
                    <motion.div
                        initial={{ scale: 0.95, y: -20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: 20, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="bg-white/85 backdrop-blur-lg w-full h-full sm:h-auto sm:max-h-[calc(100vh-4rem)] sm:w-full sm:max-w-4xl sm:rounded-2xl sm:shadow-2xl flex flex-col relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-5 border-b border-black/10 flex justify-between items-center gap-4 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <span className={`flex-shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-lg text-sm font-bold ${getCategoryStyle(announcement.category).bg} ${getCategoryStyle(announcement.category).text}`}>
                                    {announcement.category}
                                </span>
                                <h2 className="text-base md:text-xl font-bold text-gray-800">{announcement.title}</h2>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 rounded-full transition-colors"><X size={20} /></button>
                            </div>
                        </div>

                        <div className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto hide-scrollbar">
                            <div className="grid grid-cols-1 sm:grid-cols-10 gap-x-8 gap-y-6 text-sm">
                                <div className="sm:col-span-3 flex flex-col gap-y-6">
                                    <div className="flex items-start gap-3">
                                        <Calendar className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-gray-500">申請期間</p>
                                            <p className={`font-bold text-sm ${dateInfo.colorClass}`}>
                                                {dateInfo.displayString}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <SendIcon className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-gray-500">送件方式</p>
                                            <p className="text-gray-800">{announcement.submission_method || '未指定'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="sm:col-span-7 flex items-start gap-3">
                                    <Users className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-gray-500">適用對象</p>
                                        <div
                                            className="text-gray-800 rich-text-content"
                                            dangerouslySetInnerHTML={{ __html: announcement.target_audience || '未指定' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-200" />

                            <div>
                                <h3 className="text-base font-semibold text-indigo-700 border-l-4 border-indigo-500 pl-3 mb-3">詳細內容</h3>
                                <div className="rich-text-content"
                                    dangerouslySetInnerHTML={{ __html: finalContent }} />
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
                                                className="group flex items-center gap-3 bg-slate-100 hover:bg-indigo-100 hover:border-indigo-300 border border-transparent p-3 rounded-lg text-indigo-800 font-medium transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg">
                                                <Paperclip className="h-5 w-5 flex-shrink-0 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
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
                                                className="group flex items-center gap-3 text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                                                <LinkIcon className="h-4 w-4 transform group-hover:rotate-[-45deg] transition-transform flex-shrink-0" />
                                                <span className="break-all group-hover:underline">{item.url}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer - Synchronized with Header style */}
                        <div className="p-5 border-t border-black/10 flex justify-between items-center gap-4 flex-shrink-0">
                            <div className="flex items-center text-slate-500 text-sm font-medium gap-1.5 px-3">
                                <Eye className="w-4 h-4 text-slate-400" />
                                <span className="tabular-nums">瀏覽數：{viewCount !== null ? viewCount : '...'} 次</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <DownloadPDFButton
                                    announcement={announcement}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition-all duration-200 border border-violet-100"
                                />
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
