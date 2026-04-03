'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import TinyMCE from './TinyMCE';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import { authFetch } from '@/lib/authFetch';
import { X, Loader2, Save, Trash2, Undo, UploadCloud, File as FileIcon, Link as LinkIcon, PlusCircle, Copy, GripVertical, ArrowLeft, Info, FileText, Paperclip, Sparkles } from 'lucide-react';

// --- Shared Constants ---
const CATEGORY_OPTIONS = [
    { value: 'A', label: 'A：各縣市政府獎助學金' },
    { value: 'B', label: 'B：縣市政府以外之各級公家機關及公營單位獎助學金' },
    { value: 'C', label: 'C：宗教及民間各項指定身分獎助學金' },
    { value: 'D', label: 'D：非公家機關或其他無法歸類的獎助學金' },
    { value: 'E', label: 'E：本校獲配推薦名額獎助學金' },
    { value: 'F', label: 'F：校外獎助學金得獎公告' },
    { value: 'G', label: 'G：校內獎助學金' },
];

const formatFileSize = (size) => {
    if (!size) return '0 B';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getPublicAttachmentUrl = (filePath) => {
    if (!filePath) return '';
    const parts = filePath.split('/');
    const fileName = parts[parts.length - 1];
    return `/api/attachments/${fileName}`;
};

const buttonStyles = {
    primary: "flex items-center justify-center gap-1.5 px-5 h-[42px] text-sm font-semibold rounded-lg border border-indigo-200 bg-transparent text-indigo-600 transition-all duration-300 ease-in-out whitespace-nowrap hover:bg-indigo-100 hover:text-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:shadow-none",
    secondary: "flex items-center justify-center gap-1.5 px-5 h-[42px] text-sm font-semibold rounded-lg border border-stone-300 bg-transparent text-stone-700 transition-all duration-300 ease-in-out whitespace-nowrap hover:bg-stone-200 hover:text-stone-800 active:scale-95 disabled:opacity-50 disabled:shadow-none",
    duplicate: "flex items-center justify-center gap-1.5 px-4 h-[42px] text-sm font-semibold rounded-lg border border-amber-200 bg-transparent text-amber-600 transition-all duration-300 ease-in-out hover:bg-amber-50 hover:text-amber-700 hover:border-amber-400 active:scale-95 disabled:opacity-50 disabled:shadow-none",
    ai: "flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl border border-purple-200 bg-purple-50 text-purple-700 transition-all duration-300 ease-in-out hover:bg-purple-100 hover:text-purple-800 hover:border-purple-400 active:scale-95 disabled:opacity-50"
};

const DraggableFileItem = ({ file, onRemove, onUndelete, isMarkedForDeletion, formatFileSize, constraintsRef }) => {
    const dragControls = useDragControls();
    const handleFileClick = (e) => {
        e.preventDefault();
        if (isMarkedForDeletion) return;
        let url = file.isExisting ? getPublicAttachmentUrl(file.path) : (file instanceof File ? URL.createObjectURL(file) : '');
        if (url) window.open(url, '_blank');
    };
    const content = (
        <>
            <div className="flex items-center space-x-3 overflow-hidden flex-grow">
                {!isMarkedForDeletion && (<div onPointerDown={(e) => dragControls.start(e)} className="cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 rounded-lg touch-none"><GripVertical size={18} /></div>)}
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isMarkedForDeletion ? 'bg-gray-100 text-gray-400' : (file.isExisting ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500')}`}><FileIcon size={18} /></div>
                <div className="overflow-hidden">
                    <a href="#" onClick={handleFileClick} className={`text-sm font-semibold truncate block transition-colors select-none ${isMarkedForDeletion ? 'text-gray-400 line-through cursor-default' : 'text-gray-800 hover:text-indigo-600'}`}>{file.name}</a>
                    <p className={`text-[10px] font-medium uppercase tracking-tight ${isMarkedForDeletion ? 'text-gray-300' : 'text-gray-400'}`}>{file.type?.split('/')[1] || 'FILE'} • {formatFileSize(file.size)}</p>
                </div>
            </div>
            <button onClick={isMarkedForDeletion ? () => onUndelete(file) : () => onRemove(file)} className={`p-2 rounded-lg transition-colors ${isMarkedForDeletion ? 'text-violet-600 hover:bg-violet-100' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}>{isMarkedForDeletion ? <Undo size={16} /> : <Trash2 size={16} />}</button>
        </>
    );
    return isMarkedForDeletion ? (<div className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 border border-red-100 transition-all">{content}</div>) : (<Reorder.Item value={file} dragControls={dragControls} dragListener={false} dragConstraints={constraintsRef} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="relative flex items-center justify-between p-3 rounded-xl bg-white border border-gray-100 hover:shadow-md transition-shadow group touch-none">{content}</Reorder.Item>);
};

const MultipleFilesUploadArea = ({ selectedFiles, setSelectedFiles, filesToRemove, setFilesToRemove, disabled, showToast }) => {
    const fileInputRef = useRef(null);
    const maxFiles = 8;
    const maxFileSize = 15 * 1024 * 1024;
    const constraintsRef = useRef(null);
    const supportedTypes = {
        'application/pdf': ['pdf'], 'image/jpeg': ['jpeg', 'jpg'], 'image/png': ['png'], 'image/webp': ['webp'],
        'application/msword': ['doc'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
        'application/vnd.oasis.opendocument.text': ['odt'], 'application/vnd.ms-excel': ['xls'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
        'application/vnd.oasis.opendocument.spreadsheet': ['ods'], 'application/vnd.ms-powerpoint': ['ppt'],
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['pptx'],
        'application/vnd.oasis.opendocument.presentation': ['odp'],
    };
    const acceptString = Object.values(supportedTypes).flat().map(ext => '.' + ext).join(',');
    const handleFiles = (files) => {
        let newFiles = [];
        for (const file of files) {
            const ext = file.name.split('.').pop()?.toLowerCase() || '';
            const isSupported = Object.keys(supportedTypes).includes(file.type) || Object.values(supportedTypes).flat().includes(ext);
            if (!isSupported) { showToast('不支援: ' + file.name, 'warning'); continue; }
            if (selectedFiles.some(f => f.name === file.name)) { showToast('重複: ' + file.name, 'warning'); continue; }
            if (file.size > maxFileSize) { showToast('太大: ' + file.name, 'warning'); continue; }
            if (selectedFiles.length - filesToRemove.length + newFiles.length >= maxFiles) { showToast('上限 ' + maxFiles + ' 個', 'warning'); break; }
            file.id = file.id || crypto.randomUUID(); newFiles.push(file);
        }
        if (newFiles.length > 0) setSelectedFiles(prev => [...prev, ...newFiles]);
    };
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => { e.preventDefault(); if (!disabled) handleFiles(Array.from(e.dataTransfer.files)); };
    const visibleFiles = selectedFiles.filter(f => !filesToRemove.some(r => r.id === f.id));
    const deletedFiles = selectedFiles.filter(f => filesToRemove.some(r => r.id === f.id));
    return (
        <div className="space-y-4">
            <div className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${!disabled ? 'border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/10 cursor-pointer shadow-sm hover:shadow-md' : 'bg-gray-50 opacity-60'}`} onClick={() => !disabled && fileInputRef.current?.click()} onDragOver={handleDragOver} onDrop={handleDrop}>
                <input type="file" ref={fileInputRef} onChange={(e) => handleFiles(Array.from(e.target.files))} className="hidden" accept={acceptString} disabled={disabled} multiple />
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-3 text-indigo-500"><UploadCloud size={24} /></div>
                <p className="text-sm font-semibold text-gray-700">拖曳檔案或 <span className="text-indigo-600">點擊上傳</span></p>
                <p className="mt-1 text-xs text-gray-400 tracking-tight">已選 {selectedFiles.length - filesToRemove.length} / {maxFiles} 個附件</p>
            </div>
            {visibleFiles.length > 0 && (<div ref={constraintsRef} className="relative"><Reorder.Group axis="y" values={visibleFiles} onReorder={(newOrder) => setSelectedFiles([...newOrder, ...deletedFiles])} className="space-y-2.5 rounded-xl p-1 bg-transparent">{visibleFiles.map((file) => (<DraggableFileItem key={file.id} file={file} onRemove={(f) => f.isExisting ? setFilesToRemove(p => [...p, f]) : setSelectedFiles(p => p.filter(x => x.id !== f.id))} onUndelete={(f) => setFilesToRemove(p => p.filter(x => x.id !== f.id))} isMarkedForDeletion={false} formatFileSize={formatFileSize} constraintsRef={constraintsRef} />))}</Reorder.Group></div>)}
            {deletedFiles.length > 0 && (<div className="space-y-2 rounded-xl p-2 bg-red-50/30 border border-red-100/50"><p className="text-[10px] font-bold text-red-400 uppercase tracking-widest px-2 mb-1">標記刪除</p>{deletedFiles.map((file) => (<DraggableFileItem key={file.id} file={file} onUndelete={(f) => setFilesToRemove(p => p.filter(x => x.id !== f.id))} isMarkedForDeletion={true} formatFileSize={formatFileSize} constraintsRef={constraintsRef} />))}</div>)}
        </div>
    );
};

export default function UpdateAnnouncementModal({ isOpen, onClose, announcement, refreshAnnouncements, onSwitchTo }) {
    const [isSaving, setIsSaving] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isDuplicating, setIsDuplicating] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [filesToRemove, setFilesToRemove] = useState([]);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [formData, setFormData] = useState({ title: '', summary: '', is_active: false, category: '', application_start_date: '', application_end_date: '', target_audience: '', application_limitations: '', submission_method: '', external_urls: [{ url: '' }], internal_id: '' });

    const inputStyles = "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium text-sm text-gray-900";
    const showToast = (message, type = 'success') => setToast({ show: true, message, type });
    const hideToast = () => setToast(prev => ({ ...prev, show: false }));

    useEffect(() => {
        if (isOpen && announcement) {
            document.body.classList.add('modal-open'); setActiveTab('basic');
            let urls = [{ url: '' }];
            try { const p = JSON.parse(announcement.external_urls); if (Array.isArray(p) && p.length > 0) urls = p; } catch (e) { if (typeof announcement.external_urls === 'string' && announcement.external_urls.startsWith('http')) urls = [{ url: announcement.external_urls }]; }
            setFormData({ title: announcement.title || '', summary: announcement.summary || '', is_active: announcement.is_active, category: announcement.category || '', application_start_date: announcement.application_start_date || '', application_end_date: announcement.application_end_date || '', target_audience: announcement.target_audience || '', application_limitations: announcement.application_limitations || '', submission_method: announcement.submission_method || '', external_urls: urls, internal_id: announcement.internal_id || '' });
            loadExistingAttachments(announcement.id); setFilesToRemove([]);
        } else { document.body.classList.remove('modal-open'); }
        return () => { document.body.classList.remove('modal-open'); };
    }, [isOpen, announcement]);

    const loadExistingAttachments = async (annId) => {
        const { data, error } = await supabase.from('attachments').select('*').eq('announcement_id', annId);
        if (!error && data) setSelectedFiles(data.map(a => ({ id: a.id, name: a.file_name, size: a.file_size, type: a.mime_type, path: a.stored_file_path, isExisting: true, display_order: a.display_order })).sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
    };

    const handleDuplicate = async () => {
        if (!window.confirm('確定要複製此公告嗎？')) return; setIsDuplicating(true);
        try {
            const res = await authFetch('/api/admin/announcements/duplicate', { method: 'POST', body: JSON.stringify({ announcementId: announcement.id }) });
            const d = await res.json(); if (!res.ok) throw new Error(d.error || '失敗');
            showToast('公告複製成功', 'success'); if (refreshAnnouncements) await refreshAnnouncements(); onClose();
            if (onSwitchTo && d.newAnnouncement) setTimeout(() => onSwitchTo(d.newAnnouncement), 100);
        } catch (e) { showToast(e.message, 'error'); } finally { setIsDuplicating(false); }
    };

    const handleAiOptimize = async () => {
        if (isOptimizing) return;
        const combinedText = `
公告內容摘要：
${formData.summary}

適用對象詳細說明：
${formData.target_audience}
`;
        if (combinedText.trim().length < 10) { showToast("內容太短，無法優化", "warning"); return; }
        
        setIsOptimizing(true);
        try {
            const fd = new FormData();
            fd.append('scrapedContents', combinedText);
            fd.append('prompt', "請優化這段內容，整理成結構化內容，擅用顏色、表格排版，讓樣式專業且易讀。請注意：公告內文摘要以及適用對象說明欄位的內容都非常重要，請務必保留並整理所有關鍵資訊，不要忽略或過度簡化內容。");

            const response = await authFetch('/api/ai/generate-announcement', { method: 'POST', body: fd });
            if (!response.ok) throw new Error("AI 優化失敗");
            const result = await response.json();
            const aiData = JSON.parse(result.text);
            
            setFormData(prev => ({ 
                ...prev, 
                summary: aiData.summary || prev.summary,
                target_audience: aiData.target_audience || prev.target_audience
            }));
            showToast("AI 優化完成", "success");
        } catch (error) {
            console.error(error);
            showToast("優化失敗，請稍後再試", "error");
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleSave = async () => {
        if (!formData.title.trim() || !formData.summary.replace(/<[^>]*>?/gm, '').trim() || !formData.application_end_date) { showToast('請填寫必填欄位', 'warning'); return; }
        setIsSaving(true);
        try {
            const urlsFiltered = formData.external_urls.filter(u => u.url?.trim());
            const { error: updErr } = await supabase.from('announcements').update({ ...formData, external_urls: JSON.stringify(urlsFiltered), application_start_date: formData.application_start_date || null, application_end_date: formData.application_end_date || null, updated_at: new Date().toISOString() }).eq('id', announcement.id);
            if (updErr) throw updErr;

            if (filesToRemove.length > 0) {
                await authFetch('/api/delete-files', { method: 'POST', body: JSON.stringify({ filePaths: filesToRemove.map(f => f.path) }) });
                await supabase.from('attachments').delete().in('id', filesToRemove.map(f => f.id));
            }

            const newFiles = selectedFiles.filter(f => !f.isExisting);
            let uploaded = [];
            if (newFiles.length > 0) {
                const fd = new FormData(); newFiles.forEach(f => fd.append('files', f));
                const res = await authFetch('/api/upload-files', { method: 'POST', body: fd });
                const d = await res.json(); uploaded = d.data.uploaded || [];
            }

            const finalFiles = selectedFiles.filter(f => !filesToRemove.some(r => r.id === f.id));
            const upserts = finalFiles.map((f, i) => {
                if (f.isExisting) return { id: f.id, announcement_id: announcement.id, file_name: f.name, stored_file_path: f.path, file_size: f.size, mime_type: f.type, display_order: i };
                const up = uploaded.find(u => u.originalName === f.name && u.size === f.size);
                return up ? { announcement_id: announcement.id, file_name: up.originalName, stored_file_path: up.path, file_size: up.size, mime_type: up.mimeType, display_order: i } : null;
            }).filter(Boolean);
            if (upserts.length > 0) await supabase.from('attachments').upsert(upserts);

            showToast('更新成功', 'success'); if (refreshAnnouncements) refreshAnnouncements(); onClose();
        } catch (e) { showToast(e.message, 'error'); } finally { setIsSaving(false); }
    };

    return (
        <>
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
            <AnimatePresence>
                {isOpen && (
                    <motion.div key="update-announcement-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex flex-col cursor-pointer" onClick={() => !isSaving && onClose()}>
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="relative bg-white shadow-2xl w-full flex-1 flex flex-col overflow-hidden ml-auto max-w-full cursor-default" onClick={(e) => e.stopPropagation()}>
                            {/* Header */}
                            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10 flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => { if (!isSaving && window.confirm('確定關閉公告編輯模組？未儲存的資訊將遺失。')) onClose(); }} className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-50 transition-all"><ArrowLeft size={22} /></button>
                                    <h2 className="text-lg font-bold text-gray-800 tracking-tight">編輯公告</h2>
                                </div>
                                <button onClick={onClose} className="hidden sm:block text-gray-400 hover:text-gray-600 p-2"><X size={20} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white hide-scrollbar relative">
                                {isSaving && (<div className="absolute inset-0 bg-white/70 z-20 flex flex-col items-center justify-center backdrop-blur-[2px]"><Loader2 className="animate-spin h-10 w-10 text-indigo-600" /><p className="mt-4 text-indigo-700 font-bold">儲存中...</p></div>)}
                                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 h-full animate-in fade-in duration-500">
                                    <div className="lg:hidden flex bg-gray-50/80 rounded-xl p-1.5 gap-1.5 border border-gray-100 flex-shrink-0">
                                        <button onClick={() => setActiveTab('basic')} className={`flex-1 py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'basic' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500'}`}><Info size={14} /> 資訊</button>
                                        <button onClick={() => setActiveTab('content')} className={`flex-1 py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'content' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500'}`}><FileText size={14} /> 內文</button>
                                        <button onClick={() => setActiveTab('attachments')} className={`flex-1 py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'attachments' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500'}`}><Paperclip size={14} /> 附件</button>
                                    </div>
                                    <div className={`lg:col-span-4 space-y-5 overflow-y-auto custom-scrollbar ${activeTab === 'basic' ? 'block' : 'hidden lg:block'}`}>
                                        <div className="space-y-1.5"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">標題 <span className="text-red-600 font-bold ml-1">*</span></label><input type="text" name="title" className={inputStyles} value={formData.title} onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))} /></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">內部辨識名 (選填)</label><input type="text" name="internal_id" className={inputStyles} value={formData.internal_id} onChange={(e) => setFormData(p => ({ ...p, internal_id: e.target.value }))} maxLength={20} /></div>
                                            <div className="space-y-1.5"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">分類 <span className="text-red-600 font-bold ml-1">*</span></label>
                                                <select name="category" className={inputStyles} value={formData.category} onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}>
                                                    <option value="">請選擇</option>
                                                    {CATEGORY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">開始日期</label><input type="date" name="application_start_date" className={inputStyles} value={formData.application_start_date} onChange={(e) => setFormData(p => ({ ...p, application_start_date: e.target.value }))} /></div>
                                            <div className="space-y-1.5"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">結束日期 <span className="text-red-600 font-bold ml-1">*</span></label><input type="date" name="application_end_date" className={inputStyles} value={formData.application_end_date} onChange={(e) => setFormData(p => ({ ...p, application_end_date: e.target.value }))} /></div>
                                        </div>
                                        <div className="space-y-1.5"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">送件方式</label><input type="text" name="submission_method" className={inputStyles} value={formData.submission_method} onChange={(e) => setFormData(p => ({ ...p, submission_method: e.target.value }))} /></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">兼領限制</label><select name="application_limitations" className={inputStyles} value={formData.application_limitations} onChange={(e) => setFormData(p => ({ ...p, application_limitations: e.target.value }))}><option value="">未指定</option><option value="Y">可兼領</option><option value="N">不可兼領</option></select></div>
                                            <div className="space-y-1.5"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">狀態</label><select name="is_active" className={inputStyles} value={formData.is_active} onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}><option value={true}>上架中</option><option value={false}>已下架</option></select></div>
                                        </div>
                                        <div className="pt-4 border-t border-gray-100">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 block mb-3 flex items-center gap-2"><LinkIcon size={14} /> 外部連結</label>
                                            <div className="space-y-2">{formData.external_urls.map((u, i) => (<div key={i} className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-300"><input type="url" className={inputStyles} value={u.url} onChange={(e) => { const n = [...formData.external_urls]; n[i].url = e.target.value; setFormData(p => ({ ...p, external_urls: n })); }} placeholder="https://..." />{formData.external_urls.length > 1 && (<button type="button" onClick={() => setFormData(p => ({ ...p, external_urls: p.external_urls.filter((_, x) => x !== i) }))} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl"><Trash2 size={18} /></button>)}</div>))}<button type="button" onClick={() => setFormData(p => ({ ...p, external_urls: [...p.external_urls, { url: '' }] }))} className="w-full py-2.5 border border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"><PlusCircle size={14} /> 新增更多連結</button></div>
                                        </div>
                                    </div>
                                    <div className={`lg:col-span-8 space-y-6 overflow-y-auto custom-scrollbar flex flex-col h-full ${activeTab === 'basic' ? 'hidden lg:flex' : 'flex'}`}>
                                        <div className={`${activeTab === 'content' || !activeTab ? 'flex' : 'hidden lg:flex'} flex-col space-y-8 flex-grow`}>
                                            <div className="flex flex-col flex-grow">
                                                <div className="flex items-center justify-between mb-2 ml-1">
                                                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">適用對象</label>
                                                    <button type="button" onClick={handleAiOptimize} disabled={isOptimizing || (!formData.summary?.replace(/<[^>]*>?/gm, '').trim() && !formData.target_audience?.replace(/<[^>]*>?/gm, '').trim())} className={buttonStyles.ai}>
                                                        {isOptimizing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                                        AI 智慧排版優化
                                                    </button>
                                                </div>
                                                <div className="flex-grow min-h-[200px]"><TinyMCE value={formData.target_audience} onChange={(c) => setFormData(p => ({ ...p, target_audience: c }))} disabled={isSaving || isOptimizing} init={{ height: '100%' }} /></div>
                                            </div>
                                            <div className="flex flex-col flex-grow pt-2">
                                                <div className="mb-3 ml-1">
                                                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">公告內文 <span className="text-red-600 font-bold ml-1">*</span></label>
                                                </div>
                                                <div className="flex-grow min-h-[350px]"><TinyMCE value={formData.summary} onChange={(c) => setFormData(p => ({ ...p, summary: c }))} disabled={isSaving || isOptimizing} init={{ height: '100%' }} /></div>
                                            </div>
                                        </div>
                                        <div className={`${activeTab === 'attachments' ? 'block' : 'hidden lg:block'} space-y-6`}><div className="p-5 bg-slate-50 border border-gray-100 rounded-2xl"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 block ml-1">附件管理 (拖曳可排序)</label><MultipleFilesUploadArea selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} filesToRemove={filesToRemove} setFilesToRemove={setFilesToRemove} disabled={isSaving} showToast={showToast} /></div></div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-4 bg-gray-50/80 backdrop-blur-md border-t border-gray-100 flex items-center justify-between gap-4 z-10 flex-shrink-0">
                                <div className="overflow-hidden"></div>
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <button type="button" onClick={handleDuplicate} disabled={isSaving || isDuplicating} className={buttonStyles.duplicate}>{isDuplicating ? <Loader2 size={16} className="animate-spin" /> : <Copy size={16} />}<span className="hidden sm:inline">複製此公告</span></button>
                                    <button onClick={onClose} className="sm:hidden px-5 h-[42px] text-sm font-bold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">取消</button>
                                    <button onClick={handleSave} disabled={isSaving} className={`${buttonStyles.primary} px-10`}>{isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}儲存</button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
