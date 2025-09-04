'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import CreateAnnouncementModal from '@/components/CreateAnnouncementModal';
import UpdateAnnouncementModal from '@/components/UpdateAnnouncementModal';
import DeleteAnnouncementModal from '@/components/DeleteAnnouncementModal';
import AnnouncementPreviewModal from '@/components/AnnouncementPreviewModal';
import Toast from '@/components/ui/Toast';
import { Plus, Search, ChevronsUpDown, ArrowDown, ArrowUp, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, ChevronDown, Link } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import { motion, AnimatePresence } from 'framer-motion';
import DownloadPDFButton from './DownloadPDFButton';

const LineIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="16" height="16" viewBox="0 0 50 50" className="inline-block">
        <path fill="#00c300" d="M12.5,42h23c3.59,0,6.5-2.91,6.5-6.5v-23C42,8.91,39.09,6,35.5,6h-23C8.91,6,6,8.91,6,12.5v23C6,39.09,8.91,42,12.5,42z"></path><path fill="#fff" d="M37.113,22.417c0-5.865-5.88-10.637-13.107-10.637s-13.108,4.772-13.108,10.637c0,5.258,4.663,9.662,10.962,10.495c0.427,0.092,1.008,0.282,1.155,0.646c0.132,0.331,0.086,0.85,0.042,1.185c0,0-0.153,0.925-0.187,1.122c-0.057,0.331-0.263,1.296,1.135,0.707c1.399-0.589,7.548-4.445,10.298-7.611h-0.001C36.203,26.879,37.113,24.764,37.113,22.417z M18.875,25.907h-2.604c-0.379,0-0.687-0.308-0.687-0.688V20.01c0-0.379,0.308-0.687,0.687-0.687c0.379,0,0.687,0.308,0.687,0.687v4.521h1.917c0.379,0,0.687,0.308,0.687,0.687C19.562,25.598,19.254,25.907,18.875,25.907z M21.568,25.219c0,0.379-0.308,0.688-0.687,0.688s-0.687-0.308-0.687-0.688V20.01c0-0.379,0.308-0.687,0.687-0.687s0.687,0.308,0.687,0.687V25.219z M27.838,25.219c0,0.297-0.188,0.559-0.47,0.652c-0.071,0.024-0.145,0.036-0.218,0.036c-0.215,0-0.42-0.103-0.549-0.275l-2.669-3.635v3.222c0,0.379-0.308,0.688-0.688,0.688c-0.379,0-0.688-0.308-0.688-0.688V20.01c0-0.296,0.189-0.558,0.47-0.652c0.071-0.024,0.144-0.035,0.218-0.035c0.214,0,0.42,0.103,0.549,0.275l2.67,3.635V20.01c0-0.379,0.309-0.687,0.688-0.687c0.379,0,0.687,0.308,0.687,0.687V25.219z M32.052,21.927c0.379,0,0.688,0.308,0.688,0.688c0,0.379-0.308,0.687-0.688,0.687h-1.917v1.23h1.917c0.379,0,0.688,0.308,0.688,0.687c0,0.379-0.309,0.688-0.688,0.688h-2.604c-0.378,0-0.687-0.308-0.687-0.688v-2.603c0-0.001,0-0.001,0-0.001c0,0,0-0.001,0-0.001v-2.601c0-0.001,0-0.001,0-0.002c0-0.379,0.308-0.687,0.687-0.687h2.604c0.379,0,0.688,0.308,0.688,0.687s-0.308,0.687-0.688,0.687h-1.917v1.23H32.052z"></path>
    </svg>
);
const GmailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="16" height="16" viewBox="0 0 50 50" className="inline-block">
        <path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z"></path><path fill="#1e88e5" d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343-3-3V16.2z"></path><polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17"></polygon><path fill="#c62828" d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z"></path><path fill="#fbc02d" d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0 C43.076,8,45,9.924,45,12.298z"></path>
    </svg>
);

// --- Helper Functions for Notifications ---
const sendEmailAnnouncement = async (id, showToast) => {
    try {
        showToast('正在透過 mail 發送公告...', 'info');
        const res = await authFetch('/api/send-announcement', { method: 'POST', body: JSON.stringify({ announcementId: id }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'mail 寄送失敗');
        showToast(data.message || '公告已成功透過 mail 寄送！', 'success');
    } catch (err) { showToast(err.message || 'mail 寄送失敗，請稍後再試', 'error'); }
};

const sendLineBroadcast = async (id, showToast) => {
    try {
        showToast('正在透過 LINE 發送公告...', 'info');
        const res = await authFetch('/api/broadcast-line-announcement', { method: 'POST', body: JSON.stringify({ announcementId: id }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'LINE 發送失敗');
        showToast(data.message || '公告已成功透過 LINE 發送！', 'success');
    } catch (err) { showToast(err.message || 'LINE 發送失敗，請稍後再試', 'error'); }
};

export default function AnnouncementsTab() {
    const [expandedId, setExpandedId] = useState(null);
    const [allAnnouncements, setAllAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [preview, setPreview] = useState({ open: false, type: '', html: '', text: '', id: null });

    const [searchTerm, setSearchTerm] = useState('');
    const [sort, setSort] = useState({ column: 'application_end_date', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const showToast = (message, type = 'success') => setToast({ show: true, message, type });
    const hideToast = () => setToast(prev => ({ ...prev, show: false }));

    const fetchAnnouncements = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            setAllAnnouncements(data || []);
        } catch (error) { showToast('無法載入公告列表，請稍後再試', 'error'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

    const processedAnnouncements = useMemo(() => {
        let filtered = [...allAnnouncements];
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(ann => ann.title.toLowerCase().includes(lowercasedTerm) || (ann.category && ann.category.toLowerCase().includes(lowercasedTerm)));
        }
        if (sort.column) {
            filtered.sort((a, b) => {
                const aValue = a[sort.column]; const bValue = b[sort.column];
                if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [allAnnouncements, searchTerm, sort]);

    const paginatedAnnouncements = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return processedAnnouncements.slice(startIndex, startIndex + rowsPerPage);
    }, [processedAnnouncements, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(processedAnnouncements.length / rowsPerPage);

    const handleSort = (column) => {
        setSort(prev => ({ column, direction: prev.column === column && prev.direction === 'desc' ? 'asc' : 'desc' }));
        setCurrentPage(1);
    };

    const renderSortIcon = (column) => {
        if (sort.column !== column) return <ChevronsUpDown className="h-4 w-4 ml-1 text-gray-400" />;
        return sort.direction === 'asc' ? <ArrowUp className="h-4 w-4 ml-1 text-indigo-600" /> : <ArrowDown className="h-4 w-4 ml-1 text-indigo-600" />;
    };

    // --- 開啟預覽視窗 ---
    const openPreview = (type, ann) => {
        setPreview({
            open: true,
            type: type,
            announcement: ann,
            id: ann.id
        });
    };

    const handlePreviewConfirm = async () => {
        if (preview.type === 'email') await sendEmailAnnouncement(preview.id, showToast);
        else if (preview.type === 'line') await sendLineBroadcast(preview.id, showToast);
        setPreview(prev => ({ ...prev, open: false }));
    };

    const handleCopyLink = async (announcementId) => {
        const siteUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        const link = `${siteUrl}/?announcement_id=${announcementId}`;
        try {
            await navigator.clipboard.writeText(link);
            showToast('公告連結已成功複製！', 'success');
        } catch (err) {
            showToast('複製連結失敗', 'error');
        }
    };

    const ghostButtonBase = "flex items-center justify-center gap-1.5 rounded-lg border transition-all duration-300 ease-in-out transform disabled:transform-none disabled:shadow-none";
    const buttonStyles = {
        add: `${ghostButtonBase} px-4 py-2 text-sm font-semibold border-indigo-200 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/40`,
        edit: `${ghostButtonBase} px-3 py-1.5 text-xs font-semibold border-indigo-200 bg-transparent text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20`,
        delete: `${ghostButtonBase} px-3 py-1.5 text-xs font-semibold border-rose-200 bg-transparent text-rose-600 hover:bg-rose-100 hover:text-rose-700 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:shadow-rose-500/20`,
        send: `${ghostButtonBase} px-3 py-1.5 text-xs font-semibold border-sky-200 bg-transparent text-sky-600 hover:bg-sky-100 hover:text-sky-700 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:shadow-sky-500/20`,
        line: `${ghostButtonBase} px-3 py-1.5 text-xs font-semibold border-green-200 bg-transparent text-green-600 hover:bg-green-100 hover:text-green-700 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20`,
        link: `${ghostButtonBase} px-3 py-1.5 text-xs font-semibold border-amber-200 bg-transparent text-amber-600 hover:bg-amber-100 hover:text-amber-700 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/20`,
        download: `${ghostButtonBase} px-3 py-1.5 text-xs font-semibold border-stone-300 bg-transparent text-stone-700 hover:bg-stone-200 hover:text-stone-800 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:shadow-stone-500/20`,
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full flex-grow">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" placeholder="搜尋標題、分類..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm transition-all duration-300
                            focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/30"
                    />
                </div>
                <button onClick={() => setIsModalOpen(true)} className={`${buttonStyles.add} w-full sm:w-auto whitespace-nowrap`}>
                    <Plus size={16} /> 新增公告
                </button>
            </div>

            <div className="rounded-xl w-full bg-white shadow-lg overflow-hidden border border-gray-200/80">
                {/* --- DESKTOP TABLE VIEW --- */}
                <div className="hidden md:block">
                    <table className="w-full text-sm table-layout-fixed">
                        <thead className="bg-gray-50/70 text-left">
                            <tr>
                                <th className="p-4 px-6 font-semibold text-gray-500">標題</th>
                                <th className="p-4 px-6 font-semibold text-gray-500 w-24">分類</th>
                                <th className="p-4 px-6 font-semibold text-gray-500 cursor-pointer w-36" onClick={() => handleSort('application_end_date')}>
                                    <div className="flex items-center">申請截止日 {renderSortIcon('application_end_date')}</div>
                                </th>
                                <th className="p-4 px-6 font-semibold text-gray-500 w-28">狀態</th>
                                <th className="p-4 px-6 font-semibold text-gray-500 cursor-pointer w-36" onClick={() => handleSort('updated_at')}>
                                    <div className="flex items-center">最後更新 {renderSortIcon('updated_at')}</div>
                                </th>
                                <th className="p-4 px-6 font-semibold text-gray-500 text-center w-48">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center p-12 text-gray-500">載入中...</td></tr>
                            ) : paginatedAnnouncements.length === 0 ? (
                                <tr><td colSpan="6" className="text-center p-12 text-gray-500">找不到符合條件的公告。</td></tr>
                            ) : (
                                paginatedAnnouncements.map((ann) => (
                                    <tr key={ann.id} className="transform transition-all duration-300 hover:bg-violet-100/50 hover:shadow-xl z-0 hover:z-10 hover:scale-[1.02]">
                                        <td className="p-4 px-6 font-medium text-gray-800 break-words">{ann.title}</td>
                                        <td className="p-4 px-6 text-gray-600">{ann.category}</td>
                                        <td className="p-4 px-6 text-gray-600 font-medium">{ann.application_end_date ? new Date(ann.application_end_date).toLocaleDateString('en-CA') : '無期限'}</td>
                                        <td className="p-4 px-6">
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${ann.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{ann.is_active ? '上架' : '下架'}</span>
                                        </td>
                                        <td className="p-4 px-6 text-gray-600">{new Date(ann.updated_at).toLocaleDateString()}</td>
                                        <td className="p-4 px-6">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button onClick={() => setEditing(ann)} className={`${buttonStyles.edit} whitespace-nowrap`}>編輯</button>
                                                <button onClick={() => setDeletingId(ann.id)} className={`${buttonStyles.delete} whitespace-nowrap`}>刪除</button>
                                                <button onClick={() => handleCopyLink(ann.id)} className={`${buttonStyles.link} whitespace-nowrap`}>連結</button>
                                                <DownloadPDFButton announcement={ann} className={buttonStyles.download} />
                                                <button onClick={() => openPreview('line', ann)} className={buttonStyles.line}><LineIcon /></button>
                                                <button onClick={() => openPreview('email', ann)} className={buttonStyles.send}><GmailIcon /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* --- MOBILE VIEW --- */}
                <div className="md:hidden px-2 py-4 flex flex-col gap-3">
                    {loading ? (
                        <div className="text-center p-8 text-gray-500">載入中...</div>
                    ) : paginatedAnnouncements.length === 0 ? (
                        <div className="text-center p-8 text-gray-500">找不到符合條件的公告。</div>
                    ) : (
                        paginatedAnnouncements.map(ann => {
                            const isExpanded = expandedId === ann.id;
                            return (
                                <div key={ann.id}
                                    className={`bg-white rounded-lg transition-all duration-300
                                        ${isExpanded ? 'shadow-lg ring-2 ring-indigo-500 ring-offset-2' : 'shadow-md border border-gray-200/80'}
                                    `}
                                >
                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : ann.id)}
                                        className="w-full flex items-center justify-between text-left p-4"
                                    >
                                        <div className="flex-1 pr-4">
                                            <h3 className="font-bold text-base text-gray-900">{ann.title}</h3>
                                        </div>
                                        <div className="flex items-center gap-x-3 flex-shrink-0">
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${ann.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {ann.is_active ? '上架' : '下架'}
                                            </span>
                                            <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                    </button>

                                    {/* --- Collapsible Content --- */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                key="content"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                className="overflow-hidden"
                                            >
                                                <div className="border-t border-gray-200 p-4 pt-3">
                                                    {/* Details Grid */}
                                                    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm mb-4">
                                                        <div className="font-semibold text-gray-500">分類</div>
                                                        <div className="text-gray-700">{ann.category || '-'}</div>

                                                        <div className="font-semibold text-gray-500">申請截止</div>
                                                        <div className="text-gray-700">{ann.application_end_date ? new Date(ann.application_end_date).toLocaleDateString('en-CA') : '無期限'}</div>

                                                        <div className="font-semibold text-gray-500">最後更新</div>
                                                        <div className="text-gray-700">{new Date(ann.updated_at).toLocaleDateString()}</div>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-gray-200">
                                                        <button onClick={() => setEditing(ann)} className={`${buttonStyles.edit} whitespace-nowrap`}>編輯</button>
                                                        <button onClick={() => setDeletingId(ann.id)} className={`${buttonStyles.delete} whitespace-nowrap`}>刪除</button>
                                                        <button onClick={() => handleCopyLink(ann.id)} className={`${buttonStyles.link} whitespace-nowrap`}>連結</button>
                                                        <DownloadPDFButton announcement={ann} className={buttonStyles.download} />
                                                        <button onClick={() => openPreview('line', ann)} className={buttonStyles.line}><LineIcon /></button>
                                                        <button onClick={() => openPreview('email', ann)} className={buttonStyles.send}><GmailIcon /></button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600">共 {processedAnnouncements.length} 筆資料，第 {currentPage} / {totalPages || 1} 頁</div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <select
                            value={rowsPerPage}
                            onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                            className="appearance-none w-full bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-sm shadow-sm
                                transition-all duration-300
                                focus:outline-none focus:border-indigo-500
                                focus:ring-4 focus:ring-indigo-500/30"
                        >
                            {[10, 25, 50].map(v => <option key={v} value={v}>{v} 筆 / 頁</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"><ChevronsLeft className="h-5 w-5" /></button>
                        <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"><ChevronLeft className="h-5 w-5" /></button>
                        <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages || totalPages === 0} className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"><ChevronRight className="h-5 w-5" /></button>
                        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0} className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"><ChevronsRight className="h-5 w-5" /></button>
                    </nav>
                </div>
            </div>

            <CreateAnnouncementModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} refreshAnnouncements={fetchAnnouncements} />
            <UpdateAnnouncementModal isOpen={!!editing} onClose={() => setEditing(null)} announcement={editing} refreshAnnouncements={fetchAnnouncements} />
            <DeleteAnnouncementModal isOpen={!!deletingId} onClose={() => setDeletingId(null)} announcementId={deletingId} refreshAnnouncements={fetchAnnouncements} />
            <AnnouncementPreviewModal
                isOpen={preview.open}
                type={preview.type}
                announcement={preview.announcement}
                onConfirm={handlePreviewConfirm}
                onClose={() => setPreview(prev => ({ ...prev, open: false }))}
            />
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
        </div>
    );
}