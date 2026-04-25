'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import TinyMCE from './TinyMCE';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import { authFetch } from '@/lib/authFetch';
import { X, Loader2, Save, Trash2, UploadCloud, Link as LinkIcon, PlusCircle, File as FileIcon, GripVertical, ArrowLeft, Info, FileText, Paperclip, ChevronRight, Sparkles, Copy } from 'lucide-react';

const buttonStyles = {
    primary: "flex items-center justify-center gap-1.5 px-5 h-[42px] text-sm font-semibold rounded-lg border border-indigo-200 bg-transparent text-indigo-600 transition-all duration-300 ease-in-out whitespace-nowrap hover:bg-indigo-100 hover:text-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:shadow-none",
    secondary: "flex items-center justify-center gap-1.5 px-5 h-[42px] text-sm font-semibold rounded-lg border border-stone-300 bg-transparent text-stone-700 transition-all duration-300 ease-in-out whitespace-nowrap hover:bg-stone-200 hover:text-stone-800 active:scale-95 disabled:opacity-50 disabled:shadow-none",
    duplicate: "flex items-center justify-center gap-1.5 px-4 h-[42px] text-sm font-semibold rounded-lg border border-amber-200 bg-transparent text-amber-600 transition-all duration-300 ease-in-out hover:bg-amber-50 hover:text-amber-700 hover:border-amber-400 active:scale-95 disabled:opacity-50 disabled:shadow-none",
    ai: "flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl border border-purple-200 bg-purple-50 text-purple-700 transition-all duration-300 ease-in-out hover:bg-purple-100 hover:text-purple-800 hover:border-purple-400 active:scale-95 disabled:opacity-50"
};

const CATEGORY_OPTIONS = [
    { value: 'A', label: 'A：各縣市政府獎助學金' },
    { value: 'B', label: 'B：縣市政府以外之各級公家機關及公營單位獎助學金' },
    { value: 'C', label: 'C：宗教及民間各項指定身分獎助學金' },
    { value: 'D', label: 'D：非公家機關或其他無法歸類的獎助學金' },
    { value: 'E', label: 'E：本校獲配推薦名額獎助學金' },
    { value: 'F', label: 'F：校外獎助學金得獎公告' },
    { value: 'G', label: 'G：校內獎助學金' },
];

const Edit3Icon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;

const InputModeSelector = ({ inputMode, setInputMode, disabled }) => (
    <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 select-none">選擇輸入模式</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={"relative border-2 rounded-xl p-5 cursor-pointer transition-all " + (inputMode === 'ai' ? 'border-indigo-500 bg-indigo-500/5 ring-4 ring-indigo-500/10' : 'border-gray-200 hover:border-gray-300 bg-white')} onClick={() => !disabled && setInputMode('ai')}> 
                <h4 className="font-bold text-gray-900 select-none flex items-center gap-2"><UploadCloud size={18} className="text-indigo-500" />AI 智慧分析</h4>
                <p className="text-sm text-gray-500 mt-1.5 select-none leading-relaxed">上傳公告 PDF、圖片或網址，由 AI 自動提取內容。</p>
            </div>
            <div className={"relative border-2 rounded-xl p-5 cursor-pointer transition-all " + (inputMode === 'manual' ? 'border-indigo-500 bg-indigo-500/5 ring-4 ring-indigo-500/10' : 'border-gray-200 hover:border-gray-300 bg-white')} onClick={() => !disabled && setInputMode('manual')}> 
                <h4 className="font-bold text-gray-900 select-none flex items-center gap-2"><Edit3Icon />手動輸入</h4>
                <p className="text-sm text-gray-500 mt-1.5 select-none leading-relaxed">自行填寫所有公告欄位，不使用 AI 輔助。</p>
            </div>
        </div>
    </div>
);

const DraggableFileItem = ({ file, onRemove, formatFileSize, constraintsRef }) => {
    const dragControls = useDragControls();
    const handleFileClick = (e) => {
        e.preventDefault();
        if (file instanceof File) {
            const url = URL.createObjectURL(file);
            window.open(url, '_blank');
        }
    };
    return (
        <Reorder.Item value={file} dragControls={dragControls} dragListener={false} dragConstraints={constraintsRef} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="relative flex items-center justify-between p-3 rounded-xl bg-white border border-gray-100 hover:shadow-md transition-shadow group touch-none">
            <div className="flex items-center space-x-3 overflow-hidden flex-grow">
                <div onPointerDown={(e) => dragControls.start(e)} className="cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 rounded-lg touch-none"><GripVertical size={18} /></div>
                <div className={"w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-500"}><FileIcon size={18} /></div>
                <div className="overflow-hidden">
                    <a href="#" onClick={handleFileClick} className="text-sm font-semibold text-gray-800 truncate hover:text-indigo-600 block transition-colors select-none">{file.name}</a>
                    <p className="text-[10px] text-gray-400 font-medium select-none uppercase tracking-tight">{ (file.type ? file.type.split('/')[1] : 'FILE') + ' • ' + formatFileSize(file.size) }</p>
                </div>
            </div>
            <button onClick={() => onRemove(file)} className="p-2 rounded-lg transition-colors text-gray-400 hover:text-red-500 hover:bg-red-50 ml-2 sm:opacity-100" title="移除"><Trash2 size={16} /></button>
        </Reorder.Item>
    );
};

const FileUploadArea = ({ selectedFiles, setSelectedFiles, disabled, showToast }) => {
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
            const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
            const isTypeSupported = Object.keys(supportedTypes).includes(file.type) || Object.values(supportedTypes).flat().includes(fileExtension);
            if (!isTypeSupported) { showToast('不支援: ' + file.name, 'warning'); continue; }
            if (selectedFiles.some(f => f.name === file.name)) { showToast('重複: ' + file.name, 'warning'); continue; }
            if (file.size > maxFileSize) { showToast('太大: ' + file.name, 'warning'); continue; }
            if (selectedFiles.length + newFiles.length >= maxFiles) { showToast('上限 ' + maxFiles + ' 個', 'warning'); break; }
            file.isNewFile = true; file.id = file.id || crypto.randomUUID();
            newFiles.push(file);
        }
        if (newFiles.length > 0) setSelectedFiles(prev => [...prev, ...newFiles]);
    };
    const handleFileChange = (e) => { handleFiles(Array.from(e.target.files)); e.target.value = ''; };
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => { e.preventDefault(); if (!disabled) handleFiles(Array.from(e.dataTransfer.files)); };
    const formatFileSize = (size) => {
        if (!size) return '0 B';
        if (size < 1024) return size + ' B';
        if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
        return (size / (1024 * 1024)).toFixed(1) + ' MB';
    };
    return (
        <div className="space-y-4">
            <div className={"relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 " + (!disabled ? 'border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/10 cursor-pointer shadow-sm hover:shadow-md' : 'bg-gray-50 opacity-60')} onClick={() => !disabled && fileInputRef.current?.click()} onDragOver={handleDragOver} onDrop={handleDrop}> 
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept={acceptString} disabled={disabled} multiple />
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-3 text-indigo-500"><UploadCloud size={24} /></div>
                <p className="text-sm font-semibold text-gray-700">拖曳檔案或 <span className="text-indigo-600">點擊上傳</span></p>
                <p className="mt-1 text-xs text-gray-400 tracking-tight">已選 {selectedFiles.length} / {maxFiles} 個附件</p>
            </div>
            {selectedFiles.length > 0 && (
                <div ref={constraintsRef} className="relative">
                    <Reorder.Group axis="y" values={selectedFiles} onReorder={setSelectedFiles} className="space-y-2.5 rounded-xl p-1 bg-transparent">
                        {selectedFiles.map((file) => (<DraggableFileItem key={file.id} file={file} onRemove={(f) => setSelectedFiles(prev => prev.filter(x => x.id !== f.id))} formatFileSize={formatFileSize} constraintsRef={constraintsRef} />))}
                    </Reorder.Group>
                </div>
            )}
        </div>
    );
};

const UrlInputArea = ({ urls, setUrls, disabled, showToast }) => {
    const [urlInput, setUrlInput] = useState('');
    const inputStyles = "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium text-sm text-gray-900";
    const handleAddUrl = () => {
        const trimmedUrl = urlInput.trim();
        if (!trimmedUrl) return;
        try { new URL(trimmedUrl); } catch { showToast('無效網址', 'warning'); return; }
        if (urls.some(url => url === trimmedUrl)) return;
        setUrls(prev => [...prev, trimmedUrl]); setUrlInput('');
    };
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="relative flex-grow">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddUrl()} placeholder="貼上公告連結..." className={inputStyles + " pl-11"} disabled={disabled} />
                </div>
                <button type="button" onClick={handleAddUrl} disabled={disabled || !urlInput.trim()} className={buttonStyles.primary + " h-[46px] px-6"}>添加</button>
            </div>
            {urls.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                    {urls.map((url, index) => (
                        <div key={index} className="flex items-center justify-between p-3.5 bg-white border border-gray-100 rounded-xl shadow-sm group">
                            <div className="flex items-center space-x-3 overflow-hidden">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 flex-shrink-0"><LinkIcon size={14} /></div>
                                <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-indigo-600 hover:underline truncate">{url}</a>
                            </div>
                            {!disabled && (<button onClick={() => setUrls(prev => prev.filter((_, i) => i !== index))} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 ml-2 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function CreateAnnouncementModal({ isOpen, onClose, refreshAnnouncements }) {
    const [inputMode, setInputMode] = useState('ai');
    const [currentStep, setCurrentStep] = useState(0);
    const [activeTab, setActiveTab] = useState('basic');
    const [isLoading, setIsLoading] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isDuplicating, setIsDuplicating] = useState(false);
    const [loadingText, setLoadingText] = useState("處理中...");
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [urls, setUrls] = useState([]);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const initialFormData = {
        title: '', summary: '', category: '', application_start_date: '', application_end_date: '', 
        target_audience: '', application_limitations: '', submission_method: '', external_urls: [{ url: '' }],
        is_active: true, internal_id: '',
    };
    const [formData, setFormData] = useState(initialFormData);
    const inputStyles = "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium text-sm text-gray-900";
    const showToast = (message, type = 'success') => setToast({ show: true, message, type });
    const hideToast = () => setToast(prev => ({ ...prev, show: false }));

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('modal-open');
            setInputMode('ai'); setCurrentStep(0); setActiveTab('basic');
            setSelectedFiles([]); setUrls([]); setFormData(initialFormData);
        } else { document.body.classList.remove('modal-open'); }
        return () => { document.body.classList.remove('modal-open'); };
    }, [isOpen]);

    const isFormValid = formData.title.trim() !== '' && formData.summary.replace(/<[^>]*>?/gm, '').trim() !== '' && formData.application_end_date && formData.category;

    const handleAiAnalyze = async () => {
        if (selectedFiles.length === 0 && urls.length === 0) { showToast("請提供資料來源", "warning"); return; }
        setIsLoading(true); setCurrentStep(1);
        try {
            const aiSupportedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            const filesForAI = selectedFiles.filter(file => aiSupportedTypes.includes(file.type));
            const scrapedContentsForAI = [];
            const sourceUrlsForAI = [];

            if (urls.length > 0) {
                const results = await Promise.all(urls.map(async (url) => {
                    const res = await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
                    if (!res.ok) return { url, success: false };
                    const data = await res.json();
                    if (data.error || !data.scrapedText) return { url, success: false };
                    return { url, text: data.scrapedText, success: true };
                }));
                results.forEach(({ url, text, success }) => {
                    if (success) scrapedContentsForAI.push('--- 網址 (' + url + ') ---\n' + text);
                    else sourceUrlsForAI.push(url);
                });
            }

            const fd = new FormData();
            if (scrapedContentsForAI.length > 0) fd.append('scrapedContents', scrapedContentsForAI.join('\n\n'));
            if (sourceUrlsForAI.length > 0) fd.append('sourceUrls', sourceUrlsForAI.join('\n'));
            filesForAI.forEach(f => fd.append('files', f));

            const response = await authFetch('/api/ai/generate-announcement', { method: 'POST', body: fd });
            if (!response.ok) throw new Error("AI 分析失敗");
            const result = await response.json();
            const aiData = JSON.parse(result.text);
            setFormData(prev => ({ ...prev, ...aiData, is_active: true, external_urls: aiData.external_urls?.length ? aiData.external_urls : [{ url: '' }] }));
            setCurrentStep(2);
        } catch (error) { showToast(error.message, "error"); setCurrentStep(0); }
        finally { setIsLoading(false); }
    };

    const handleAiOptimize = async () => {
        if (isOptimizing) return;
        const combinedText = "\n公告內容摘要：\n" + formData.summary + "\n\n適用對象詳細說明：\n" + formData.target_audience + "\n";
        if (combinedText.trim().length < 10) { showToast("公告內容篇幅過短，無法進行 AI 分析", "warning"); return; }
        
        setIsOptimizing(true);
        try {
            const fd = new FormData();
            fd.append('scrapedContents', combinedText);
            fd.append('prompt', "請優化這段內容，整理成結構化內容，擅用顏色、表格排版，讓樣式專業且易讀。請注意：公告內文摘要以及適用對象說明欄位的內容都非常重要，請務必保留並整理所有關鍵資訊，不要忽略或過度簡化內容。");

            const response = await authFetch('/api/ai/generate-announcement', { method: 'POST', body: fd });
            if (!response.ok) throw new Error("AI 公告優化失敗");
            const result = await response.json();
            const aiData = JSON.parse(result.text);
            
            setFormData(prev => ({ 
                ...prev, 
                summary: aiData.summary || prev.summary,
                target_audience: aiData.target_audience || prev.target_audience
            }));
            showToast("AI 公告優化完成", "success");
        } catch (error) {
            showToast("AI 公告優化失敗，請稍後再試", "error");
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleNextStep = () => {
        if (inputMode === 'ai') {
            handleAiAnalyze();
        } else {
            setCurrentStep(2);
        }
    };

    const performSave = async () => {
        setIsLoading(true); setLoadingText("儲存中...");
        try {
            let uploadedFilesData = [];
            const filesToUpload = selectedFiles.filter(f => f.isNewFile);
            if (filesToUpload.length > 0) {
                const fd = new FormData();
                filesToUpload.forEach(f => fd.append('files', f));
                const res = await authFetch('/api/upload-files', { method: 'POST', body: fd });
                const result = await res.json();
                uploadedFilesData = result.data.uploaded || [];
            }
            const dataToInsert = { ...formData, external_urls: JSON.stringify(formData.external_urls.filter(u => u.url?.trim())), application_start_date: formData.application_start_date || null, application_end_date: formData.application_end_date || null };
            const { data: ann, error } = await supabase.from('announcements').insert(dataToInsert).select().single();
            if (error) throw error;
            if (uploadedFilesData.length > 0) {
                const atts = selectedFiles.map((f, i) => {
                    const up = uploadedFilesData.find(u => u.originalName === f.name && u.size === f.size);
                    return up ? { announcement_id: ann.id, file_name: up.originalName, stored_file_path: up.path, file_size: up.size, mime_type: up.mimeType, display_order: i } : null;
                }).filter(Boolean);
                if (atts.length) await supabase.from('attachments').insert(atts);
            }
            return ann;
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const ann = await performSave();
            showToast("公告發布成功", "success"); 
            
            // --- 自動發送推播通知 (修正：加上 await 並處理結果) ---
            try {
                const notifyRes = await authFetch('/api/admin/notifications/broadcast', {
                    method: 'POST',
                    body: JSON.stringify({
                        title: `【新公告】${ann.title}`,
                        body: '點擊查看最新獎助學金資訊',
                        url: `${window.location.origin}/?announcement_id=${ann.id}`, 
                        announcementId: ann.id
                    })
                });
                
                const notifyData = await notifyRes.json();
                if (notifyRes.ok) {
                    console.log('Push broadcast successful:', notifyData);
                } else {
                    console.error('Push broadcast failed:', notifyData);
                }
            } catch (notifyErr) {
                console.error('Failed to send broadcast:', notifyErr);
            }
            // -----------------------

            if (refreshAnnouncements) refreshAnnouncements(); 
            onClose();
        } catch (error) {
            showToast(error.message, "error");
        }
    };

    const handleDuplicate = async () => {
        if (!window.confirm('確定要儲存並複製此公告嗎？')) return;
        setIsDuplicating(true);
        try {
            const ann = await performSave();
            const res = await authFetch('/api/admin/announcements/duplicate', { method: 'POST', body: JSON.stringify({ announcementId: ann.id }) });
            const d = await res.json(); if (!res.ok) throw new Error(d.error || '複製失敗');
            showToast('儲存並複製成功', 'success');
            if (refreshAnnouncements) await refreshAnnouncements();
            onClose();
        } catch (e) {
            showToast(e.message, 'error');
        } finally {
            setIsDuplicating(false);
        }
    };

    return (
        <>
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex flex-col cursor-pointer" onClick={() => !isLoading && onClose()}>
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="relative bg-white shadow-2xl w-full flex-1 flex flex-col overflow-hidden ml-auto max-w-full cursor-default" onClick={(e) => e.stopPropagation()}>
                            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10 flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => { if (!isLoading && window.confirm('確定關閉公告編輯模組？未儲存的資訊將遺失。')) onClose(); }} className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-50 transition-all"><ArrowLeft size={22} /></button>
                                    <h2 className="text-lg font-bold text-gray-800 tracking-tight">新增公告</h2>
                                </div>
                                <button onClick={onClose} className="hidden sm:block text-gray-400 hover:text-gray-600 p-2"><X size={20} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white hide-scrollbar">
                                {currentStep === 0 && (<div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4"><InputModeSelector inputMode={inputMode} setInputMode={setInputMode} disabled={isLoading} />{inputMode === 'ai' && (<div className="space-y-8"><FileUploadArea selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} disabled={isLoading} showToast={showToast} /><UrlInputArea urls={urls} setUrls={setUrls} disabled={isLoading} showToast={showToast} /></div>)}</div>)}
                                {currentStep === 1 && (<div className="flex flex-col items-center justify-center min-h-[400px] text-center animate-in zoom-in"><div className="relative mb-8"><div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 rounded-full animate-pulse"></div><Loader2 className="animate-spin h-16 w-12 text-indigo-600 relative z-10 mx-auto" /></div><p className="text-xl font-bold text-gray-900">{loadingText}</p><p className="text-gray-500 mt-3 max-w-xs mx-auto">AI 正在深度解析公告內容...</p></div>)}
                                {currentStep === 2 && (
                                    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 h-full animate-in fade-in">
                                        <div className="lg:hidden flex bg-gray-50/80 rounded-xl p-1.5 gap-1.5 border border-gray-100 flex-shrink-0">
                                            <button onClick={() => setActiveTab('basic')} className={"flex-1 py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all " + (activeTab === 'basic' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500')}><Info size={14} /> 資訊</button>
                                            <button onClick={() => setActiveTab('content')} className={"flex-1 py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all " + (activeTab === 'content' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500')}><FileText size={14} /> 內文</button>
                                            <button onClick={() => setActiveTab('attachments')} className={"flex-1 py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all " + (activeTab === 'attachments' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-gray-500')}><Paperclip size={14} /> 附件</button>
                                        </div>
                                        <div className={"lg:col-span-4 space-y-5 overflow-y-auto custom-scrollbar " + (activeTab === 'basic' ? 'block' : 'hidden lg:block')}>
                                            <div className="space-y-1.5"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">標題 <span className="text-red-600 font-bold ml-1">*</span></label><input type="text" name="title" className={inputStyles} value={formData.title} onChange={handleChange} placeholder="公告標題..." /></div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">內部辨識名 (選填)</label><input type="text" name="internal_id" className={inputStyles} value={formData.internal_id} onChange={handleChange} maxLength={20} placeholder="選填內部代碼" /></div>
                                                <div className="space-y-1.5"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">分類 <span className="text-red-600 font-bold ml-1">*</span></label>
                                                    <select name="category" className={inputStyles} value={formData.category} onChange={handleChange}>
                                                        <option value="">請選擇</option>
                                                        {CATEGORY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">開始日期</label><input type="date" name="application_start_date" className={inputStyles} value={formData.application_start_date} onChange={handleChange} /></div>
                                                <div className="space-y-1.5"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">結束日期 <span className="text-red-600 font-bold ml-1">*</span></label><input type="date" name="application_end_date" className={inputStyles} value={formData.application_end_date} onChange={handleChange} /></div>
                                            </div>
                                            <div className="space-y-1.5"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">送件方式</label><input type="text" name="submission_method" className={inputStyles} value={formData.submission_method} onChange={handleChange} /></div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">兼領限制</label><select name="application_limitations" className={inputStyles} value={formData.application_limitations} onChange={handleChange}><option value="">未指定</option><option value="Y">可兼領</option><option value="N">不可兼領</option></select></div>
                                                <div className="space-y-1.5"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">狀態</label><select name="is_active" className={inputStyles} value={formData.is_active} onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}><option value={true}>上架</option><option value={false}>下架</option></select></div>
                                            </div>
                                        </div>
                                        <div className={"lg:col-span-8 space-y-6 overflow-y-auto custom-scrollbar flex flex-col h-full " + (activeTab === 'basic' ? 'hidden lg:flex' : 'flex')}>
                                            <div className={(activeTab === 'content' || !activeTab ? 'flex' : 'hidden lg:flex') + " flex-col space-y-8 flex-grow"}>
                                                <div className="flex flex-col flex-grow">
                                                    <div className="flex items-center justify-between mb-2 ml-1">
                                                        <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">適用對象</label>
                                                        <button type="button" onClick={handleAiOptimize} disabled={isOptimizing || (!formData.summary?.replace(/<[^>]*>?/gm, '').trim() && !formData.target_audience?.replace(/<[^>]*>?/gm, '').trim())} className={buttonStyles.ai}>
                                                            {isOptimizing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                                            AI 智慧排版優化
                                                        </button>
                                                    </div>
                                                    <div className="flex-grow min-h-[200px]"><TinyMCE value={formData.target_audience} onChange={(c) => setFormData(p => ({ ...p, target_audience: c }))} disabled={isLoading || isOptimizing} init={{ height: '100%' }} /></div>
                                                </div>
                                                <div className="flex flex-col flex-grow pt-2">
                                                    <div className="mb-3 ml-1">
                                                        <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">公告內文 <span className="text-red-600 font-bold ml-1">*</span></label>
                                                    </div>
                                                    <div className="flex-grow min-h-[350px]"><TinyMCE value={formData.summary} onChange={(c) => setFormData(p => ({ ...p, summary: c }))} disabled={isLoading || isOptimizing} init={{ height: '100%' }} /></div>
                                                </div>
                                            </div>
                                            <div className={(activeTab === 'attachments' ? 'block' : 'hidden lg:block') + " space-y-6"}>
                                                <div className="p-5 bg-slate-50 border border-gray-100 rounded-2xl"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 block ml-1">附件管理 (拖曳可排序)</label><FileUploadArea selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} disabled={isLoading} showToast={showToast} /></div>
                                                <div className="p-5 bg-white border border-gray-100 rounded-2xl"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 block ml-1 flex items-center gap-2"><LinkIcon size={14} /> 外部連結</label><div className="space-y-3">{formData.external_urls.map((u, i) => (<div key={i} className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-300"><input type="url" className={inputStyles} value={u.url} onChange={(e) => { const n = [...formData.external_urls]; n[i].url = e.target.value; setFormData(p => ({ ...p, external_urls: n })); }} placeholder="https://..." />{formData.external_urls.length > 1 && (<button type="button" onClick={() => setFormData(p => ({ ...p, external_urls: p.external_urls.filter((_, x) => x !== i) }))} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl"><Trash2 size={18} /></button>)}</div>))}<button type="button" onClick={() => setFormData(p => ({ ...p, external_urls: [...p.external_urls, { url: '' }] }))} className="w-full py-2.5 border border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"><PlusCircle size={14} /> 新增連結</button></div></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="px-5 py-4 bg-gray-50/80 backdrop-blur-md border-t border-gray-100 flex items-center justify-between gap-4 z-10 flex-shrink-0">
                                <div className="overflow-hidden">
                                    {currentStep === 2 && (
                                        <button type="button" onClick={() => setCurrentStep(0)} disabled={isLoading} className={buttonStyles.secondary}>上一步</button>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 overflow-hidden">
                                    {/* Only show Cancel button on mobile when NOT in Step 2 to avoid overflow with "Back" button */}
                                    {currentStep !== 2 && (
                                        <button onClick={onClose} className="sm:hidden px-5 h-[42px] text-sm font-bold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">取消</button>
                                    )}
                                    {currentStep === 0 && (<button type="button" onClick={handleNextStep} disabled={isLoading || (inputMode === 'ai' && selectedFiles.length === 0 && urls.length === 0)} className={buttonStyles.primary + " px-8"}>{inputMode === 'ai' ? '開始 AI 智慧分析' : '下一步：填寫內容'}</button>)}
                                    {currentStep === 2 && (
                                        <>
                                            <button type="button" onClick={handleDuplicate} disabled={isLoading || isDuplicating || !isFormValid} className={buttonStyles.duplicate}>
                                                {isDuplicating ? <Loader2 size={16} className="animate-spin" /> : <Copy size={16} />}
                                                <span className="hidden sm:inline">複製此公告</span>
                                            </button>
                                            <button type="button" onClick={handleSave} disabled={isLoading || !isFormValid} className={buttonStyles.primary + " px-10"}>{isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}儲存</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
