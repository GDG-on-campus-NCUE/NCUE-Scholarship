"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronsUpDown, ArrowUp, ArrowDown, Award, Loader2, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, ChevronDown } from 'lucide-react';
import Button from '@/components/ui/Button';
import AnnouncementDetailModal from './AnnouncementDetailModal';

// --- Helper Functions & Components ---
const categoryStyles = {
    A: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
    B: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
    C: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    D: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    E: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    F: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' },
    G: { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-300' },
    default: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
};
const getCategoryStyle = (cat) => categoryStyles[cat] || categoryStyles.default;

const calculateSemester = (endDateStr) => {
    if (!endDateStr) return '長期';
    const endDate = new Date(endDateStr);
    const year = endDate.getFullYear();
    const month = endDate.getMonth() + 1;
    const academicYear = month >= 8 ? year - 1911 : year - 1912;
    const semester = month >= 2 && month <= 7 ? 2 : 1;
    return `${academicYear}-${semester}`;
};

const ApplicationLimitations = ({ limitations }) => {
    if (!limitations) {
        return <span className="text-gray-500">未指定</span>;
    }
    if (limitations === 'Y') {
        return <span className="text-green-600">可兼領</span>;
    }
    return <span className="text-red-600">不可兼領</span>;
};

const DateDisplay = ({ item, className }) => {
    const startDate = item.application_start_date;
    const endDate = item.application_end_date;
    const endDateFormatted = endDate ? new Date(endDate).toLocaleDateString('en-CA') : '無期限';

    const dateString = startDate
        ? `${new Date(startDate).toLocaleDateString('en-CA')} ~ ${endDateFormatted}`
        : endDateFormatted;

    return <div className={className}>{dateString}</div>;
};


// --- Main Component ---
function AnnouncementListContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortLoading, setSortLoading] = useState(false);
    const [filter, setFilter] = useState('open');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [sort, setSort] = useState({ column: 'application_end_date', ascending: true });
    const [categoryFilter, setCategoryFilter] = useState('all');

    const [expandedId, setExpandedId] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const announcementRefs = useRef({});
    const isInitialLoad = useRef(true);

    const [readIds, setReadIds] = useState(new Set());

    const handleCategoryChange = (newCategory) => {
        setCategoryFilter(newCategory);
        setPage(1); // 重設頁碼
    };

    const fetchAnnouncementsList = useCallback(async () => {
        setSortLoading(true);
        // Optimization: Select only necessary columns for the list view.
        // We exclude 'attachments', 'summary', 'external_urls' to reduce payload size.
        // These will be fetched on demand when the detail modal is opened.
        let query = supabase.from('announcements')
            .select('id, title, category, application_start_date, application_end_date, target_audience, application_limitations, submission_method, is_active', { count: 'exact' })
            .eq('is_active', true);

        if (search) {
            query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%,target_audience.ilike.%${search}%`);
        }

        const today = new Date().toISOString().slice(0, 10);

        if (filter === 'open') {
            query = query.or(`application_end_date.gte.${today},application_end_date.is.null`);
        } else if (filter === 'expired') {
            query = query.lt('application_end_date', today);
        }

        if (categoryFilter !== 'all') {
            query = query.eq('category', categoryFilter);
        }

        const orderColumn = sort.column === 'semester' ? 'application_end_date' : sort.column;
        const sortOptions = { ascending: sort.ascending, nullsFirst: false };
        query = query.order(orderColumn, sortOptions);

        const from = (page - 1) * rowsPerPage;
        const to = from + rowsPerPage - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;
        if (!error) {
            const dataWithSemester = (data || []).map(item => ({
                ...item,
                semester: calculateSemester(item?.application_end_date)
            }));
            setAnnouncements(dataWithSemester);
            setTotalCount(count || 0);
        } else {
            console.error("Error fetching announcements:", error);
            setAnnouncements([]);
            setTotalCount(0);
        }

        setSortLoading(false);
    }, [search, filter, page, rowsPerPage, sort, categoryFilter]);

    useEffect(() => {
        if (isInitialLoad.current) return;
        fetchAnnouncementsList();
    }, [page, rowsPerPage, sort, filter, search, fetchAnnouncementsList]);

    useEffect(() => {
        const initialFetch = async () => {
            setLoading(true);
            const announcementIdFromUrl = searchParams.get('announcement_id');

            if (announcementIdFromUrl) {
                setFilter('all');
                setExpandedId(announcementIdFromUrl);

                const { data: targetAnnouncement, error } = await supabase
                    .from('announcements')
                    .select('*, attachments(*)')
                    .eq('id', announcementIdFromUrl)
                    .single();

                if (targetAnnouncement && !error) {
                    // Open the modal immediately.
                    handleOpenDetailModal(targetAnnouncement);
                } else {
                    console.error("Could not fetch announcement from URL parameter:", error);
                }
            }
            await fetchAnnouncementsList();
            setLoading(false);
            isInitialLoad.current = false;
        };
        initialFetch();
    }, []);

    useEffect(() => {
        const announcementIdFromUrl = searchParams.get('announcement_id');
        if (announcementIdFromUrl && !isInitialLoad.current && announcements.length > 0) {
            const targetElement = announcementRefs.current[announcementIdFromUrl];
            if (targetElement) {
                setTimeout(() => {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    router.replace('/', { shallow: true });
                }, 300); // 300ms delay to accommodate rendering and animation.
            }
        }
    }, [announcements]);

    const handleSort = (field) => {
        setSort(prev => ({ column: field, ascending: prev.column === field ? !prev.ascending : true }));
        setPage(1);
    };

    const handleOpenDetailModal = (announcement) => {
        setReadIds(prev => new Set(prev).add(announcement.id));
        const announcementWithSemester = { ...announcement, semester: calculateSemester(announcement.application_end_date) };
        setSelectedAnnouncement(announcementWithSemester);
        setIsDetailModalOpen(true);
    };

    const handleModalClose = () => {
        setIsDetailModalOpen(false);
        const announcementIdFromUrl = searchParams.get('announcement_id');
        if (announcementIdFromUrl) {
            router.replace('/', { shallow: true });
        }
    };

    const renderSortIcon = (column) => {
        if (sort.column !== column) return <ChevronsUpDown className="h-4 w-4 ml-1 text-gray-400" />;
        return sort.ascending ? <ArrowUp className="h-4 w-4 ml-1 text-indigo-600" /> : <ArrowDown className="h-4 w-4 ml-1 text-indigo-600" />;
    };

    const getDateColorClass = (item) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = item.application_end_date ? new Date(item.application_end_date) : null;
        const startDate = item.application_start_date ? new Date(item.application_start_date) : null;

        if (endDate === null) return 'text-green-600';
        if (endDate < today) return 'text-red-600';
        if (startDate && startDate > today) return 'text-red-600';

        return 'text-green-600';
    };

    const totalPages = Math.ceil(totalCount / rowsPerPage);

    return (
        <div className="w-full sm:p-2 lg:p-4">
            <div className="bg-white/80 backdrop-blur-lg border border-slate-200/80 rounded-2xl p-4 sm:p-6 mb-6 shadow-sm">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Award size={22} className="text-indigo-500" />獎助學金分類代碼定義
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm sm:text-base text-slate-600">
                    <p><strong className="font-semibold text-red-600">A：</strong>各縣市政府獎助學金</p>
                    <p><strong className="font-semibold text-orange-500">B：</strong>縣市政府以外之各級公家機關及公營單位獎助學金</p>
                    <p><strong className="font-semibold text-yellow-500">C：</strong>宗教及民間各項指定身分獎助學金</p>
                    <p><strong className="font-semibold text-green-600">D：</strong>非公家機關或其他無法歸類的獎助學金</p>
                    <p><strong className="font-semibold text-blue-600">E：</strong>本校獲配推薦名額獎助學金</p>
                    <p><strong className="font-semibold text-indigo-600">F：</strong>校外獎助學金得獎公告</p>
                    <p><strong className="font-semibold text-purple-600">G：</strong>校內獎助學金</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="relative w-full md:w-auto md:flex-1 md:max-w-md">
                    <Search className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="搜尋公告標題、摘要、適用對象..." value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm transition-all duration-300
                            focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/30"
                    />
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                    {/* 分類篩選下拉選單 */}
                    <div className="relative">
                        <select
                            value={categoryFilter}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="appearance-none w-full bg-slate-100 border border-transparent rounded-lg py-2 pl-4 pr-10 text-sm font-medium text-slate-700 shadow-sm transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/30"
                        >
                            <option value="all">全部分類</option>
                            {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(cat => (
                                <option key={cat} value={cat}>分類 {cat}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                            <ChevronsUpDown className="h-4 w-4" />
                        </div>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                        <Button variant={filter === 'open' ? 'primary' : 'ghost'} size="sm" onClick={() => { setFilter('open'); setPage(1); }}>未逾期</Button>
                        <Button variant={filter === 'all' ? 'primary' : 'ghost'} size="sm" onClick={() => { setFilter('all'); setPage(1); }}>全部公告</Button>
                        <Button variant={filter === 'expired' ? 'primary' : 'ghost'} size="sm" onClick={() => { setFilter('expired'); setPage(1); }}>已逾期</Button>
                    </div>
                </div>
            </div>

            <div className="rounded-xl w-full bg-white shadow-lg overflow-hidden border border-gray-200/80">
                <div className="hidden md:block relative">
                    {sortLoading && (<div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex items-center justify-center"><div className="flex items-center gap-2 text-slate-600 font-semibold"><Loader2 className="animate-spin h-5 w-5" />處理中...</div></div>)}
                    <table className="w-full text-sm table-fixed">
                        <thead className="bg-gray-50/70 text-left">
                            <tr>
                                <th className="p-4 px-6 font-semibold text-gray-500 cursor-pointer w-[10%]" onClick={() => handleSort('semester')}><div className="flex items-center">學期 {renderSortIcon('semester')}</div></th>
                                <th className="p-4 px-6 font-semibold text-gray-500 w-[25%]">獎助學金資料</th>
                                <th className="p-4 px-6 font-semibold text-gray-500 w-[35%]">適用對象</th>
                                <th className="p-4 px-6 font-semibold text-gray-500 w-[10%]">兼領限制</th>
                                <th className="p-4 px-6 font-semibold text-gray-500 cursor-pointer w-[20%]" onClick={() => handleSort('application_end_date')}><div className="flex items-center">申請期限 / 送件方式 {renderSortIcon('application_end_date')}</div></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (<tr><td colSpan="5" className="text-center p-16 text-gray-500"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />載入中...</td></tr>) : (announcements || []).filter(item => item && item.id).map(item => {
                                const isRead = readIds.has(item.id);
                                return (
                                    <tr key={item.id} ref={el => (announcementRefs.current[item.id] = el)} onClick={() => handleOpenDetailModal(item)} className={`transform transition-all duration-300 hover:bg-violet-100/50 hover:shadow-2xl z-0 hover:z-10 hover:scale-[1.01] cursor-pointer ${isRead ? 'bg-gray-100 text-gray-500' : ''}`}>
                                        <td className="p-4 px-6 font-medium align-top">{item.semester}</td>
                                        <td className="p-4 px-6 align-top">
                                            <div className="flex items-start gap-3">
                                                <span className={`flex-shrink-0 mt-1 inline-flex items-center justify-center h-8 w-8 rounded-lg text-sm font-bold ${getCategoryStyle(item.category).bg} ${isRead ? 'opacity-60' : ''} ${getCategoryStyle(item.category).text} border ${getCategoryStyle(item.category).border}`}>{item.category}</span>
                                                <p className={`font-semibold ${isRead ? '' : 'text-gray-900'}`}>{item.title}</p>
                                            </div>
                                        </td>
                                        <td className="p-4 px-6 text-sm align-top"><div className="line-clamp-3" dangerouslySetInnerHTML={{ __html: item.target_audience }} /></td>
                                        <td className="p-4 px-6 text-sm font-bold align-top">
                                            <ApplicationLimitations limitations={item.application_limitations} />
                                        </td>
                                        <td className="p-4 px-6 text-sm align-top">
                                            <DateDisplay item={item} className={`font-bold ${getDateColorClass(item)}`} />
                                            <div className={`mt-1 ${isRead ? '' : 'text-slate-500'}`}>{item.submission_method}</div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="md:hidden flex flex-col gap-3 p-3">
                    {loading ? (<div className="p-10 text-center text-gray-500"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />載入中...</div>) : (announcements || []).filter(item => item && item.id).map(item => {
                        const isExpanded = expandedId === item.id;
                        const isRead = readIds.has(item.id);
                        const style = getCategoryStyle(item.category);
                        return (
                            <motion.div key={item.id} layout ref={el => (announcementRefs.current[item.id] = el)} className={`rounded-lg transition-all duration-300 border ${isExpanded ? 'shadow-xl ring-2 ring-indigo-400' : 'shadow-md border-gray-200/60'} ${isRead ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}>
                                <button onClick={() => setExpandedId(isExpanded ? null : item.id)} className="w-full text-left p-4">
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className={`inline-flex items-center justify-center h-7 w-7 rounded-md text-xs font-bold ${style.bg} ${style.text} ${isRead ? 'opacity-60' : ''}`}>{item.category}</span>
                                                <span className="text-xs font-medium">{`學期 ${item.semester}`}</span>
                                            </div>
                                            <h3 className={`font-bold text-base ${isRead ? '' : 'text-gray-800'} mb-1.5`}>{item.title}</h3>
                                            <div className={`text-xs font-bold flex items-center gap-1 ${getDateColorClass(item)}`}>
                                                <span>期限:</span>
                                                <DateDisplay item={item} className="" />
                                            </div>
                                        </div>
                                        <ChevronDown className={`h-5 w-5 text-gray-400 mt-1 flex-shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>
                                <AnimatePresence>{isExpanded && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden">
                                        <div className="pt-2 pb-4 px-4 border-t border-gray-200 space-y-3 text-sm">
                                            <div><div className="font-semibold text-gray-500 mb-1">適用對象</div><div className="line-clamp-3 text-gray-700" dangerouslySetInnerHTML={{ __html: item.target_audience }} /></div>
                                            <div>
                                                <div className="font-semibold text-gray-500 mb-1">兼領限制</div>
                                                <div className="font-bold"><ApplicationLimitations limitations={item.application_limitations} /></div>
                                            </div>
                                            <div className="pt-2 flex justify-end"><Button size="sm" onClick={() => handleOpenDetailModal(item)}>查看詳細內容</Button></div>
                                        </div>
                                    </motion.div>
                                )}</AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>

                {announcements.length === 0 && !loading && (<div className="p-16 text-center text-gray-500">無符合條件的公告。</div>)}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                <div className="text-sm text-gray-600">共 {totalCount} 筆資料，第 {page} / {totalPages || 1} 頁</div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }} className="appearance-none w-full bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-sm shadow-sm transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/30">
                            {[10, 25, 50].map(v => <option key={v} value={v}>{v} 筆 / 頁</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400"><ChevronsUpDown className="h-4 w-4" /></div>
                    </div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button onClick={() => setPage(1)} disabled={page === 1} className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"><ChevronsLeft className="h-5 w-5" /></button>
                        <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"><ChevronLeft className="h-5 w-5" /></button>
                        <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"><ChevronRight className="h-5 w-5" /></button>
                        <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"><ChevronsRight className="h-5 w-5" /></button>
                    </nav>
                </div>
            </div>

            <AnnouncementDetailModal isOpen={isDetailModalOpen} onClose={handleModalClose} announcement={selectedAnnouncement} />
        </div>
    );
}

export default function AnnouncementList() {
    return (
        <Suspense fallback={
            <div className="w-full flex items-center justify-center py-24">
                <div className="h-12 w-12 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        }>
            <AnnouncementListContent />
        </Suspense>
    );
}