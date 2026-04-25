'use client';

import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/lib/authFetch';
import Toast from '@/components/ui/Toast';
import { Shield, Save, RefreshCw, Key, AlertCircle, Database, Server, X, MessageSquare, ToggleLeft, ToggleRight } from 'lucide-react';
import { motion } from 'framer-motion';
import UsageMonitor from './UsageMonitor';

const SETTING_LABELS = {
    'GEMINI_API_KEY': 'Google Gemini API Key (Server-side)',
    'SERP_API_KEY': 'SerpApi Key (Server-side)',
    'NEXT_PUBLIC_TINYMCE_API_KEY': 'TinyMCE API Key (Client-side)',
    'GCP_SERVICE_ACCOUNT_JSON': 'GCP Service Account JSON (Server-side)',
    'AI_ASSISTANT_ENABLED': 'AI 獎助學金助理'
};

const SETTING_DESCRIPTIONS = {
    'GEMINI_API_KEY': '用於驅動 AI 聊天機器人與公告摘要生成功能。此金鑰僅存於伺服器端。',
    'SERP_API_KEY': '用於 Google 搜尋增強功能，讓 AI 能檢索外部獎學金資訊。',
    'NEXT_PUBLIC_TINYMCE_API_KEY': '用於富文字編輯器 (TinyMCE) 的授權驗證。',
    'GCP_SERVICE_ACCOUNT_JSON': '用於監控 GCP Gemini API 使用量與金額。請貼上完整的 Service Account Key JSON 內容。',
    'AI_ASSISTANT_ENABLED': '控制平台上「AI 獎助學金助理」功能是否對使用者開放。關閉後將停止所有相關 API 請求。'
};

const StatusBadge = ({ isSet, source }) => {
    if (!isSet) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 select-none border border-red-200">
                <AlertCircle size={12} />
                未設定
            </span>
        );
    }
    if (source === 'database') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 select-none border border-emerald-200">
                <Database size={12} />
                使用資料庫設定
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 select-none border border-amber-200">
            <Server size={12} />
            使用環境變數
        </span>
    );
};

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function SettingsTab() {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [editingKey, setEditingKey] = useState(null); // Key being edited
    const [editValue, setEditValue] = useState('');
    const [saving, setSaving] = useState(false);

    const showToast = (message, type = 'success') => setToast({ show: true, message, type });
    const hideToast = () => setToast(prev => ({ ...prev, show: false }));

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        try {
            const response = await authFetch('/api/admin/settings');
            const data = await response.json();
            if (response.ok) {
                setSettings(data.settings);
            } else {
                showToast(data.error || '無法載入設定', 'error');
            }
        } catch (error) {
            showToast('載入設定時發生錯誤', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleEdit = (key) => {
        const setting = settings.find(s => s.key === key);
        setEditingKey(key);
        // For AI_ASSISTANT_ENABLED, we don't need editValue as we toggle immediately or use a different UI
        setEditValue(''); 
    };

    const handleCancel = () => {
        setEditingKey(null);
        setEditValue('');
    };

    const handleSave = async (key, value) => {
        const valToSave = value !== undefined ? value : editValue.trim();
        
        if (key !== 'AI_ASSISTANT_ENABLED' && !valToSave) {
            showToast('請輸入有效的內容', 'warning');
            return;
        }

        setSaving(true);
        try {
            const response = await authFetch('/api/admin/settings', {
                method: 'POST',
                body: JSON.stringify({ key, value: String(valToSave) }),
            });
            const data = await response.json();

            if (response.ok) {
                showToast('設定更新成功', 'success');
                setEditingKey(null);
                setEditValue('');
                fetchSettings(); // Refresh list
            } else {
                showToast(data.error || '更新失敗', 'error');
            }
        } catch (error) {
            showToast('更新時發生錯誤', 'error');
        } finally {
            setSaving(false);
        }
    };

    const isGcpConfigured = settings.find(s => s.key === 'GCP_SERVICE_ACCOUNT_JSON')?.isSet;

    return (
        <div className="space-y-6 max-w-5xl mx-auto py-4">
            {isGcpConfigured && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-700">
                    <UsageMonitor />
                </div>
            )}

            <motion.div 
                variants={itemVariants}
                initial="hidden"
                animate="show"
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm select-none hover:shadow-md transition-all duration-300"
            >
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Shield className="text-indigo-600" />
                        系統功能與金鑰管理
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        管理系統運作所需的 API 金鑰與功能開關。資料庫設定的優先級高於環境變數。
                    </p>
                </div>
                <button 
                    onClick={fetchSettings} 
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-sm"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    重新整理
                </button>
            </motion.div>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center p-12 bg-white rounded-xl border border-gray-200 min-h-[400px] flex flex-col items-center justify-center">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-indigo-500" />
                        <p className="mt-3 text-gray-500 select-none">載入設定中...</p>
                    </div>
                ) : (
                    settings.map((setting) => (
                        <div 
                            key={setting.key} 
                            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-indigo-300 hover:-translate-y-1 group"
                        >
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4 select-none">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 group-hover:text-indigo-700 transition-colors">
                                            {setting.key === 'AI_ASSISTANT_ENABLED' ? <MessageSquare size={18} className="text-indigo-500" /> : <Key size={18} className="text-indigo-500" />}
                                            {SETTING_LABELS[setting.key] || setting.key}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {SETTING_DESCRIPTIONS[setting.key]}
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <StatusBadge isSet={setting.isSet} source={setting.source} />
                                    </div>
                                </div>

                                <div className="bg-gray-50/50 rounded-xl p-1 border border-gray-100">
                                    {setting.key === 'AI_ASSISTANT_ENABLED' ? (
                                        <div className="flex items-center justify-between p-2 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${setting.value === 'true' || (setting.source === 'environment' && process.env.AI_ASSISTANT_ENABLED === 'true') ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                                <span className="text-sm font-medium text-gray-700">
                                                    當前狀態: {(setting.value === 'true' || (setting.source === 'none' && !setting.isSet)) ? '啟用中' : '已停用'}
                                                </span>
                                            </div>
                                            <button 
                                                onClick={() => handleSave(setting.key, setting.value === 'true' ? 'false' : 'true')}
                                                disabled={saving}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${setting.value === 'true' ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'}`}
                                            >
                                                {saving ? <RefreshCw size={16} className="animate-spin" /> : (setting.value === 'true' ? <ToggleRight size={20} /> : <ToggleLeft size={20} />)}
                                                {setting.value === 'true' ? '點擊停用' : '點擊啟用'}
                                            </button>
                                        </div>
                                    ) : (
                                        editingKey === setting.key ? (
                                            <div className="flex flex-col sm:flex-row gap-2 items-center animate-in fade-in slide-in-from-top-2 duration-200 p-1">
                                                <div className="flex-grow w-full relative">
                                                    <input 
                                                        type="text" 
                                                        value={editValue} 
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        placeholder="輸入新的內容..."
                                                        className="w-full pl-4 pr-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none text-sm"
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
                                                    <button 
                                                        onClick={() => handleSave(setting.key)} 
                                                        disabled={saving}
                                                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-all duration-200 hover:shadow-md active:scale-95"
                                                    >
                                                        {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                                        儲存
                                                    </button>
                                                    <button 
                                                        onClick={handleCancel}
                                                        disabled={saving}
                                                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-white text-gray-700 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 hover:shadow-md active:scale-95"
                                                    >
                                                        <X size={14} />
                                                        取消
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 p-1">
                                                <div className="font-mono text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border border-gray-200 w-full sm:w-auto flex-grow truncate select-none shadow-sm">
                                                    {setting.value || '尚未設定'}
                                                </div>
                                                <button 
                                                    onClick={() => handleEdit(setting.key)}
                                                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 rounded-lg border border-indigo-200 transition-all duration-200 hover:shadow-md active:scale-95 whitespace-nowrap"
                                                >
                                                    更新內容
                                                </button>
                                            </div>
                                        )
                                    )}
                                </div>
                                {setting.updatedAt && (
                                    <p className="text-xs text-gray-400 mt-3 text-right select-none">
                                        最後更新: {new Date(setting.updatedAt).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
        </div>
    );
}
