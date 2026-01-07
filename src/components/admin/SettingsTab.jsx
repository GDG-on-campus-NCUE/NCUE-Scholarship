'use client';

import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/lib/authFetch';
import Toast from '@/components/ui/Toast';
import { Shield, Save, RefreshCw, Key, AlertCircle, CheckCircle, Database, Server } from 'lucide-react';

const SETTING_LABELS = {
    'GEMINI_API_KEY': 'Google Gemini API Key (Server-side)',
    'SERP_API_KEY': 'SerpApi Key (Server-side)',
    'NEXT_PUBLIC_TINYMCE_API_KEY': 'TinyMCE API Key (Client-side)'
};

const SETTING_DESCRIPTIONS = {
    'GEMINI_API_KEY': '用於驅動 AI 聊天機器人與公告摘要生成功能。此金鑰僅存於伺服器端。',
    'SERP_API_KEY': '用於 Google 搜尋增強功能，讓 AI 能檢索外部獎學金資訊。',
    'NEXT_PUBLIC_TINYMCE_API_KEY': '用於富文字編輯器 (TinyMCE) 的授權驗證。'
};

const StatusBadge = ({ isSet, source }) => {
    if (!isSet) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <AlertCircle size={12} />
                未設定
            </span>
        );
    }
    if (source === 'database') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <Database size={12} />
                使用資料庫設定
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Server size={12} />
            使用環境變數
        </span>
    );
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
        setEditingKey(key);
        setEditValue(''); // Clear value for security, user enters new key
    };

    const handleCancel = () => {
        setEditingKey(null);
        setEditValue('');
    };

    const handleSave = async (key) => {
        if (!editValue.trim()) {
            showToast('請輸入有效的金鑰', 'warning');
            return;
        }

        setSaving(true);
        try {
            const response = await authFetch('/api/admin/settings', {
                method: 'POST',
                body: JSON.stringify({ key, value: editValue.trim() }),
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

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Shield className="text-indigo-600" />
                        系統金鑰管理
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        管理系統運作所需的 API 金鑰。資料庫設定的優先級高於環境變數。
                    </p>
                </div>
                <button 
                    onClick={fetchSettings} 
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 transition-all disabled:opacity-50"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    重新整理
                </button>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center p-12 bg-white rounded-xl border border-gray-200">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-indigo-500" />
                        <p className="mt-3 text-gray-500">載入設定中...</p>
                    </div>
                ) : (
                    settings.map((setting) => (
                        <div key={setting.key} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                            <Key size={18} className="text-indigo-500" />
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

                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                    {editingKey === setting.key ? (
                                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="flex-grow w-full">
                                                <input 
                                                    type="text" 
                                                    value={editValue} 
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    placeholder="輸入新的 API Key..."
                                                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="flex gap-2 w-full sm:w-auto">
                                                <button 
                                                    onClick={() => handleSave(setting.key)} 
                                                    disabled={saving}
                                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors shadow-sm"
                                                >
                                                    {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                                                    儲存
                                                </button>
                                                <button 
                                                    onClick={handleCancel}
                                                    disabled={saving}
                                                    className="flex-1 sm:flex-none px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    取消
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                                            <div className="font-mono text-sm text-gray-600 bg-white px-3 py-1.5 rounded border border-gray-200 w-full sm:w-auto flex-grow truncate">
                                                {setting.value || '尚未設定'}
                                            </div>
                                            <button 
                                                onClick={() => handleEdit(setting.key)}
                                                className="w-full sm:w-auto px-4 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                                            >
                                                更新金鑰
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {setting.updatedAt && (
                                    <p className="text-xs text-gray-400 mt-3 text-right">
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
