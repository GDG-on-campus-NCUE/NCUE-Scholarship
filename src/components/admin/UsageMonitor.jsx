'use client';

import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/lib/authFetch';
import { TrendingUp, DollarSign, Activity, RefreshCw, AlertCircle, Info, Calendar } from 'lucide-react';
import SimpleLineChart from '@/components/ui/SimpleLineChart';

const StatCard = ({ title, value, icon: Icon, color = "indigo", subtext, loading }) => {
    const colorStyles = {
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-200",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
        amber: "bg-amber-50 text-amber-600 border-amber-200",
        rose: "bg-rose-50 text-rose-600 border-rose-200",
    };
    const style = colorStyles[color] || colorStyles.indigo;

    return (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex items-start gap-4 transition-all duration-300 hover:shadow-md h-full">
            <div className={`p-3 rounded-lg ${style} bg-opacity-50 flex-shrink-0`}>
                {Icon && <Icon className="w-6 h-6" />}
            </div>
            <div className="min-w-0 flex-grow">
                <p className="text-sm font-bold text-gray-500 truncate">{title}</p>
                {loading ? (
                    <div className="h-8 w-24 bg-gray-100 animate-pulse rounded-md mt-1"></div>
                ) : (
                    <h3 className="text-2xl font-black text-gray-900 mt-1 truncate">{value}</h3>
                )}
                {subtext && <p className="text-[10px] text-gray-400 mt-1 truncate font-medium uppercase tracking-tight">{subtext}</p>}
            </div>
        </div>
    );
};

export default function UsageMonitor() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

    const fetchUsage = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await authFetch(`/api/admin/system/usage?month=${selectedMonth}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err.message || '數據同步失敗');
        } finally {
            setLoading(false);
        }
    }, [selectedMonth]);

    useEffect(() => {
        fetchUsage();
    }, [fetchUsage]);

    const chartData = data?.usage?.chartData || [];

    return (
        <div className="space-y-6 mb-10 select-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-gray-900">AI 用量與計費</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Generative Language API</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input 
                            type="month" 
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            max={new Date().toISOString().slice(0, 7)}
                            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm cursor-pointer"
                        />
                    </div>
                    <button onClick={fetchUsage} disabled={loading} className="p-2.5 text-gray-400 hover:text-indigo-600 bg-white border border-gray-200 rounded-xl transition-all active:scale-95 shadow-sm">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard 
                    title={`${selectedMonth} 總請求數`} 
                    value={data?.usage?.total?.toLocaleString() ?? 0} 
                    icon={Activity} 
                    color="indigo" 
                    loading={loading} 
                    subtext="Monthly Total Requests" 
                />
                <StatCard 
                    title={`${selectedMonth} 費用`} 
                    value={`${data?.billing?.currency || 'TWD'} $${data?.billing?.estimatedCost ?? '0.00'}`} 
                    icon={DollarSign} 
                    color="amber" 
                    loading={loading} 
                    subtext={data?.billing?.isEstimated ? "Estimated by usage" : "Synced from BigQuery"} 
                />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3">
                    <h4 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                        <TrendingUp size={18} className="text-indigo-500" />
                        {selectedMonth} 流量與支出趨勢
                    </h4>
                    <div className="px-3 py-1 bg-slate-50 text-[10px] text-slate-500 rounded-full border border-slate-100 font-bold flex items-center gap-1.5 w-full sm:w-auto">
                        <Info size={12} className="text-indigo-400" /> 指標存在數小時延遲
                    </div>
                </div>

                <div className="bg-slate-50/30 rounded-xl p-2 sm:p-4 min-h-[220px] flex items-center justify-center border border-slate-100 relative">
                    {loading ? (
                        <div className="flex flex-col items-center gap-3 py-12">
                            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                            <span className="text-xs text-indigo-500 font-bold tracking-widest uppercase">Fetching Records...</span>
                        </div>
                    ) : (
                        <div className="w-full overflow-hidden">
                            <SimpleLineChart data={chartData} color="indigo" height={220} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
