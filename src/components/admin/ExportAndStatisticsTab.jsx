'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { authFetch } from '@/lib/authFetch';
import {
    Download, Trash2, AlertTriangle, Activity, LayoutList,
    FileDown, Search, ArrowUp, ArrowDown, ChevronsUpDown,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2,
    Calendar, TrendingUp, Eye, CheckSquare
} from 'lucide-react';
import Toast from '@/components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, color = "indigo", subtext }) => {
    const colorStyles = {
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-200",
        rose: "bg-rose-50 text-rose-600 border-rose-200",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
        amber: "bg-amber-50 text-amber-600 border-amber-200",
    };
    const style = colorStyles[color] || colorStyles.indigo;

    return (
        <div className="bg-white rounded-xl p-6 border border-gray-200/80 shadow-sm flex items-start gap-4 transition-all duration-300 hover:shadow-md h-full select-none">
            <div className={`p-3 rounded-lg ${style} bg-opacity-50`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
                {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
            </div>
        </div>
    );
};

// Simple SVG Line Chart Component
const SimpleLineChart = ({ data, granularity }) => {
    const [hoveredPoint, setHoveredPoint] = useState(null);

    if (!data || data.length === 0) {
        return <div className="h-64 flex items-center justify-center text-gray-400 select-none">無圖表資料</div>;
    }

    const padding = 40;
    const width = 800;
    const height = 300;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const maxCount = Math.max(...data.map(d => d.count), 5); // Ensure at least 5 for scale
    const points = data.map((d, i) => {
        const x = padding + (i / (data.length - 1 || 1)) * chartWidth;
        const y = height - padding - (d.count / maxCount) * chartHeight;
        return { x, y, ...d };
    });

    const pathD = points.length > 1
        ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
        : points.length === 1 ? `M ${points[0].x} ${points[0].y} Z` : '';

    return (
        <div className="w-full overflow-x-auto select-none">
            <div className="min-w-[600px] relative group">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto bg-white rounded-xl border border-gray-200/80 shadow-sm cursor-crosshair">
                    {/* Grid Lines (Horizontal) */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                        const y = height - padding - ratio * chartHeight;
                        return (
                            <g key={i}>
                                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4 4" />
                                <text x={padding - 10} y={y + 4} textAnchor="end" className="text-[10px] fill-gray-400 font-sans font-medium">
                                    {Math.round(ratio * maxCount)}
                                </text>
                            </g>
                        );
                    })}

                    {/* Chart Line */}
                    <path 
                        d={pathD} 
                        fill="none" 
                        stroke="#8b5cf6" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="transition-all duration-300 group-hover:stroke-[3.5px] group-hover:drop-shadow-md" 
                    />

                    {/* Area under line */}
                    {points.length > 1 && (
                        <path
                            d={`${pathD} L ${points[points.length-1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
                            fill="url(#purple-gradient)" 
                            opacity="0.15" 
                        />
                    )}

                    <defs>
                        <linearGradient id="purple-gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Cursor Line */}
                    {hoveredPoint && (
                        <line
                            x1={hoveredPoint.x} y1={padding}
                            x2={hoveredPoint.x} y2={height - padding}
                            stroke="#d8b4fe" strokeWidth="1" strokeDasharray="4 4"
                            className="transition-all duration-75"
                        />
                    )}

                    {/* X Axis Labels */}
                    {points.map((p, i) => {
                        // Adaptive label skipping based on data density
                        const labelCount = 10;
                        const skip = Math.ceil(data.length / labelCount);
                        const showLabel = i % skip === 0 || i === data.length - 1;

                        return showLabel ? (
                            <text key={i} x={p.x} y={height - padding + 20} textAnchor="middle" className="text-[10px] fill-gray-500 font-sans font-medium">
                                {p.date}
                            </text>
                        ) : null;
                    })}

                    {/* Visible Nodes (Points) */}
                    {points.map((p, i) => (
                        <circle
                            key={`node-${i}`}
                            cx={p.x}
                            cy={p.y}
                            r="3.5"
                            className="fill-white stroke-purple-500 stroke-[2px] transition-all duration-300 group-hover:stroke-purple-600"
                        />
                    ))}

                    {/* Interactive Points & Overlay */}
                    {points.map((p, i) => (
                        <g key={i} onMouseEnter={() => setHoveredPoint(p)} onMouseLeave={() => setHoveredPoint(null)}>
                            {/* Hover Highlight Point */}
                            <circle
                                cx={p.x} cy={p.y} r={hoveredPoint === p ? 6 : 0}
                                className="fill-white stroke-purple-600 stroke-[3px] transition-all duration-200 shadow-md z-10"
                            />
                            {/* Hit Area */}
                            <rect
                                x={p.x - (chartWidth / points.length) / 2}
                                y={padding}
                                width={chartWidth / points.length}
                                height={chartHeight}
                                fill="transparent"
                                className="cursor-crosshair"
                            />
                        </g>
                    ))}
                </svg>

                {/* Hover Tooltip */}
                {hoveredPoint && (
                    <div
                        className="absolute bg-white/90 backdrop-blur-sm border border-purple-100 text-gray-800 text-xs rounded-xl px-3 py-2 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)] z-20 whitespace-nowrap"
                        style={{ left: `${(hoveredPoint.x / width) * 100}%`, top: `${(hoveredPoint.y / height) * 100}%` }}
                    >
                        <div className="font-bold text-purple-700 mb-0.5">{hoveredPoint.date}</div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                            瀏覽數: <span className="font-mono font-semibold text-gray-900">{hoveredPoint.count}</span>
                        </div>
                        {/* Triangle arrow */}
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-[4px] border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white/90"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function ExportAndStatisticsTab() {
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [stats, setStats] = useState({ totalAnnouncements: 0, totalViews: 0, overdueCount: 0, chartData: [] });
    const [announcements, setAnnouncements] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // all, overdue
    const [chartGranularity, setChartGranularity] = useState('day'); // day, week, month

    // Sorting & Pagination
    const [sort, setSort] = useState({ column: 'created_at', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const showToast = (message, type = 'success') => setToast({ show: true, message, type });
    const hideToast = () => setToast(prev => ({ ...prev, show: false }));

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const statsRes = await authFetch('/api/admin/announcements/stats');
            const statsData = await statsRes.json();
            if (statsRes.ok) {
                setStats(statsData);
            }

            const { data, error } = await supabase
                .from('announcements')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const twoYearsAgo = new Date();
            twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

            const processed = data.map(item => {
                const endDate = item.application_end_date ? new Date(item.application_end_date) : null;
                const createdDate = new Date(item.created_at);
                const isOverdue = endDate ? endDate < twoYearsAgo : createdDate < twoYearsAgo;
                return { ...item, isOverdue };
            });

            setAnnouncements(processed);

        } catch (error) {
            console.error(error);
            showToast('無法載入資料', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filter]);

    // Chart Data Aggregation
    const aggregatedChartData = useMemo(() => {
        const rawData = stats.chartData || [];
        if (rawData.length === 0) return [];

        if (chartGranularity === 'day') {
            return rawData;
        }

        const aggregated = {};

        rawData.forEach(({ date, count }) => {
            const d = new Date(date);
            let key;

            if (chartGranularity === 'month') {
                key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            } else if (chartGranularity === 'week') {
                // Get Start of Week (Sunday)
                const day = d.getDay();
                const diff = d.getDate() - day; // adjust when day is sunday
                const weekStart = new Date(d.setDate(diff));
                key = weekStart.toISOString().split('T')[0]; // Use start date as key
            }

            aggregated[key] = (aggregated[key] || 0) + count;
        });

        return Object.entries(aggregated)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));

    }, [stats.chartData, chartGranularity]);


    const handleSort = (column) => {
        setSort(prev => ({
            column,
            direction: prev.column === column && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
        setCurrentPage(1);
    };

    const renderSortIcon = (column) => {
        if (sort.column !== column) return <ChevronsUpDown className="h-4 w-4 ml-1 text-gray-400" />;
        return sort.direction === 'asc' ? <ArrowUp className="h-4 w-4 ml-1 text-indigo-600" /> : <ArrowDown className="h-4 w-4 ml-1 text-indigo-600" />;
    };

    const processedAnnouncements = useMemo(() => {
        let result = [...announcements];

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(a => a.title.toLowerCase().includes(lower) || (a.category && a.category.toLowerCase().includes(lower)));
        }
        if (filter === 'overdue') {
            result = result.filter(a => a.isOverdue);
        }

        result.sort((a, b) => {
            // 1. Primary Sort: Overdue always on top
            if (a.isOverdue !== b.isOverdue) {
                return a.isOverdue ? -1 : 1;
            }

            // 2. Secondary Sort: User Selection
            const aVal = a[sort.column];
            const bVal = b[sort.column];

            if (aVal === bVal) return 0;
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;

            if (sort.column === 'view_count') {
                return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
            }

            if (sort.column === 'application_end_date' || sort.column === 'created_at') {
                return sort.direction === 'asc'
                    ? new Date(aVal) - new Date(bVal)
                    : new Date(bVal) - new Date(aVal);
            }

            return sort.direction === 'asc'
                ? String(aVal).localeCompare(String(bVal))
                : String(bVal).localeCompare(String(aVal));
        });

        return result;
    }, [announcements, searchTerm, filter, sort]);

    const paginatedAnnouncements = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return processedAnnouncements.slice(startIndex, startIndex + rowsPerPage);
    }, [processedAnnouncements, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(processedAnnouncements.length / rowsPerPage);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(new Set(processedAnnouncements.map(a => a.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleExport = (idsToExport = null) => {
        const targetIds = idsToExport ? (Array.isArray(idsToExport) ? idsToExport : [idsToExport]) : Array.from(selectedIds);
        if (targetIds.length === 0) return showToast('請先選擇要匯出的公告', 'info');

        const items = announcements.filter(a => targetIds.includes(a.id));

        const headers = [
            'Title', 'Summary', 'Target Audience', 'Category',
            'Application Start Date', 'Application End Date',
            'Application Limitations', 'Submission Method',
            'External URLs', 'Created At', 'View Count'
        ];

        const csvContent = [
            headers.join(','),
            ...items.map(item => [
                `"${(item.title || '').replace(/"/g, '""')}"`, 
                `"${(item.summary || '').replace(/"/g, '""')}"`, 
                `"${(item.target_audience || '').replace(/"/g, '""')}"`,
                `"${(item.category || '').replace(/"/g, '""')}"`, 
                item.application_start_date || '',
                item.application_end_date || '',
                `"${(item.application_limitations || '').replace(/"/g, '""')}"`,
                `"${(item.submission_method || '').replace(/"/g, '""')}"`,
                `"${(item.external_urls || '').replace(/"/g, '""')}"`,
                item.created_at || '',
                item.view_count || 0
            ].join(','))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `announcements_export_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(`已匯出 ${targetIds.length} 筆公告`, 'success');
    };

    const handleDelete = async (idsToDelete = null) => {
        const targetIds = idsToDelete ? (Array.isArray(idsToDelete) ? idsToDelete : [idsToDelete]) : Array.from(selectedIds);
        if (targetIds.length === 0) return showToast('請先選擇要刪除的公告', 'info');

        if (!confirm(`確定要刪除這 ${targetIds.length} 筆公告嗎？此操作無法復原，並將一併刪除相關附件與瀏覽紀錄。`)) return;

        setProcessing(true);
        try {
            const res = await authFetch('/api/admin/announcements/batch-delete', {
                method: 'POST',
                body: JSON.stringify({ ids: targetIds })
            });

            if (res.ok) {
                showToast(`成功刪除 ${targetIds.length} 筆公告`, 'success');
                setSelectedIds(new Set());
                fetchData();
            } else {
                throw new Error('刪除失敗');
            }
        } catch (err) {
            showToast('刪除失敗，請稍後再試', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleExportAndDelete = async () => {
        if (selectedIds.size === 0) return showToast('請先選擇公告', 'info');
        handleExport();
        setTimeout(() => {
            handleDelete();
        }, 1000);
    };

    return (
        <div className="space-y-8">
            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="總公告數"
                    value={stats.totalAnnouncements}
                    icon={LayoutList}
                    color="indigo"
                />
                <StatCard
                    title="總瀏覽次數"
                    value={stats.totalViews.toLocaleString()}
                    icon={Activity}
                    color="emerald"
                />
                <StatCard
                    title="逾期公告 (>2年)"
                    value={stats.overdueCount}
                    icon={AlertTriangle}
                    color="rose"
                    subtext="建議匯出並刪除"
                />
            </div>

            {/* Chart Section */}
            <div className="bg-white rounded-xl p-6 border border-gray-200/80 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex items-center gap-2 select-none">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">瀏覽數趨勢</h3>
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-lg select-none">
                        <button
                            onClick={() => setChartGranularity('day')}
                            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${chartGranularity === 'day' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            日
                        </button>
                        <button
                            onClick={() => setChartGranularity('week')}
                            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${chartGranularity === 'week' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            週
                        </button>
                        <button
                            onClick={() => setChartGranularity('month')}
                            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${chartGranularity === 'month' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            月
                        </button>
                    </div>
                </div>
                <SimpleLineChart data={aggregatedChartData} granularity={chartGranularity} />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-grow sm:flex-grow-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="搜尋公告..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg w-full sm:w-64 transition-all duration-200
                                focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20"
                        />
                    </div>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="py-2 pl-3 pr-8 text-sm border border-gray-300 rounded-lg transition-all duration-200
                            focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20"
                    >
                        <option value="all">所有公告</option>
                        <option value="overdue">僅顯示逾期</option>
                    </select>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                    {selectedIds.size > 0 && (
                        <>
                            <button
                                onClick={() => handleExport()}
                                disabled={processing}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                匯出 ({selectedIds.size})
                            </button>
                            <button
                                onClick={() => handleDelete()}
                                disabled={processing}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                刪除 ({selectedIds.size})
                            </button>
                            <button
                                onClick={handleExportAndDelete}
                                disabled={processing}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                            >
                                <FileDown className="w-4 h-4" />
                                匯出並刪除
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/70 text-gray-500 font-medium">
                            <tr>
                                <th className="p-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        checked={paginatedAnnouncements.length > 0 && Array.from(selectedIds).filter(id => paginatedAnnouncements.some(a => a.id === id)).length === paginatedAnnouncements.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                const newSet = new Set(selectedIds);
                                                paginatedAnnouncements.forEach(a => newSet.add(a.id));
                                                setSelectedIds(newSet);
                                            } else {
                                                const newSet = new Set(selectedIds);
                                                paginatedAnnouncements.forEach(a => newSet.delete(a.id));
                                                setSelectedIds(newSet);
                                            }
                                        }}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                </th>
                                <th className="p-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('title')}> 
                                    <div className="flex items-center">標題 {renderSortIcon('title')}</div>
                                </th>
                                <th className="p-4 w-36 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('application_end_date')}> 
                                    <div className="flex items-center">截止日期 {renderSortIcon('application_end_date')}</div>
                                </th>
                                <th className="p-4 w-28 text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('view_count')}> 
                                    <div className="flex items-center justify-center">瀏覽數 {renderSortIcon('view_count')}</div>
                                </th>
                                <th className="p-4 w-28 text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('is_active')}> 
                                    <div className="flex items-center justify-center">狀態 {renderSortIcon('is_active')}</div>
                                </th>
                                <th className="p-4 w-32 text-center">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="6" className="p-12 text-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2"/>載入中...</td></tr>
                            ) : paginatedAnnouncements.length === 0 ? (
                                <tr><td colSpan="6" className="p-12 text-center text-gray-500">無資料</td></tr>
                            ) : (
                                paginatedAnnouncements.map(ann => (
                                    <tr 
                                        key={ann.id} 
                                        className={`
                                            group transition-all duration-300 ease-out border-b border-gray-50 last:border-0 relative
                                            ${ann.isOverdue 
                                                ? 'bg-rose-50/30 hover:bg-rose-100/80 hover:shadow-[0_8px_30px_rgb(244,63,94,0.12)] hover:-translate-y-1 hover:z-10' 
                                                : 'hover:bg-gradient-to-r hover:from-indigo-50/80 hover:to-purple-50/80 hover:shadow-[0_8px_30px_rgb(99,102,241,0.12)] hover:-translate-y-1 hover:z-10'
                                            }
                                        `}
                                    >
                                        <td className="p-4 text-center">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedIds.has(ann.id)}
                                                onChange={() => handleSelectOne(ann.id)}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-transform duration-200 group-hover:scale-110 cursor-pointer"
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900 line-clamp-1 transition-colors group-hover:text-indigo-700" title={ann.title}>{ann.title}</div>
                                            {ann.isOverdue && <span className="inline-flex items-center text-xs font-semibold text-rose-600 mt-1"><AlertTriangle className="w-3 h-3 mr-1 animate-pulse"/>已逾期 &gt; 2年</span>}
                                        </td>
                                        <td className="p-4 text-gray-600 whitespace-nowrap">
                                            {ann.application_end_date ? new Date(ann.application_end_date).toLocaleDateString('en-CA') : <span className="text-amber-500">未設定</span>}
                                        </td>
                                        <td className="p-4 text-center font-mono text-gray-600 group-hover:text-indigo-600 transition-colors font-bold">{ann.view_count}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 ${ann.is_active ? 'bg-green-100 text-green-700 group-hover:bg-green-200' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'}`}>
                                                {ann.is_active ? '上架' : '下架'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-3 opacity-60 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                                <button 
                                                    onClick={() => handleExport(ann.id)}
                                                    className="p-2 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-600 hover:text-white rounded-xl transition-all duration-300 hover:shadow-indigo-300 hover:shadow-md hover:scale-110 active:scale-95"
                                                    title="單筆匯出"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(ann.id)}
                                                    className="p-2 text-rose-600 bg-rose-50/50 hover:bg-rose-600 hover:text-white rounded-xl transition-all duration-300 hover:shadow-rose-300 hover:shadow-md hover:scale-110 active:scale-95"
                                                    title="刪除"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden px-2 py-4 flex flex-col gap-3">
                    {loading ? (
                        <div className="text-center p-8 text-gray-500">載入中...</div>
                    ) : paginatedAnnouncements.length === 0 ? (
                        <div className="text-center p-8 text-gray-500">無資料</div>
                    ) : (
                        paginatedAnnouncements.map(ann => (
                            <div 
                                key={ann.id}
                                className={`bg-white rounded-lg shadow-md border p-4 space-y-3 transition-all duration-300 relative overflow-hidden
                                    ${ann.isOverdue 
                                        ? 'border-rose-200 bg-rose-50/30 hover:bg-rose-100/80 hover:shadow-[0_8px_30px_rgb(244,63,94,0.12)]' 
                                        : 'border-gray-200/80 hover:bg-gradient-to-r hover:from-indigo-50/80 hover:to-purple-50/80 hover:shadow-[0_8px_30px_rgb(99,102,241,0.12)]'
                                    } hover:-translate-y-1 hover:z-10 group
                                `}
                            >
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedIds.has(ann.id)}
                                                onChange={() => handleSelectOne(ann.id)}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4 flex-shrink-0"
                                            />
                                            <h3 className="font-bold text-gray-900 truncate group-hover:text-indigo-700 transition-colors">{ann.title}</h3>
                                        </div>
                                        {ann.isOverdue && <div className="flex items-center text-xs font-semibold text-rose-600 ml-6"><AlertTriangle className="w-3 h-3 mr-1 animate-pulse"/>已逾期 &gt; 2年</div>}
                                    </div>
                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${ann.is_active ? 'bg-green-100 text-green-800 group-hover:bg-green-200' : 'bg-gray-100 text-gray-800 group-hover:bg-gray-200'}`}>
                                        {ann.is_active ? '上架' : '下架'}
                                    </span>
                                </div>

                                <div className="ml-6 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600">
                                    <div><span className="font-medium text-gray-500">分類:</span> {ann.category}</div>
                                    <div className="flex items-center gap-1"><Eye className="w-3 h-3" /> <span className="font-mono font-bold group-hover:text-indigo-700">{ann.view_count}</span></div>
                                    <div className="col-span-2"><span className="font-medium text-gray-500">截止:</span> {ann.application_end_date ? new Date(ann.application_end_date).toLocaleDateString('en-CA') : <span className="text-amber-500">未設定</span>}</div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 mt-2">
                                    <button 
                                        onClick={() => handleExport(ann.id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50/50 hover:bg-indigo-600 hover:text-white rounded-lg transition-all duration-300 hover:shadow-indigo-300 hover:shadow-md hover:scale-105 active:scale-95"
                                    >
                                        <Download className="w-3.5 h-3.5" /> 匯出
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(ann.id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50/50 hover:bg-rose-600 hover:text-white rounded-lg transition-all duration-300 hover:shadow-rose-300 hover:shadow-md hover:scale-105 active:scale-95"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> 刪除
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600">共 {processedAnnouncements.length} 筆資料，第 {currentPage} / {totalPages || 1} 頁</div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <select
                            value={rowsPerPage}
                            onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                            className="appearance-none w-full bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-sm shadow-sm
                                transition-all duration-300
                                focus:outline-none focus:border-purple-500
                                focus:ring-4 focus:ring-purple-500/20"
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

            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
        </div>
    );
}
