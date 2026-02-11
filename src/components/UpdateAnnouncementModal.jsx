'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import TinyMCE from './TinyMCE';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import { authFetch } from '@/lib/authFetch';
import { X, Loader2, Save, Trash2, Undo, UploadCloud, File as FileIcon, Link as LinkIcon, PlusCircle, Copy, GripVertical, ArrowLeft } from 'lucide-react';

// --- Reusable Components for this Modal ---
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

const DraggableFileItem = ({ file, onRemove, onUndelete, isMarkedForDeletion, formatFileSize, constraintsRef }) => {
    const dragControls = useDragControls();

    const handleFileClick = (e) => {
        e.preventDefault();
        if (isMarkedForDeletion) return;

        let url = '';
        if (file.isExisting) {
            url = getPublicAttachmentUrl(file.path);
        } else if (file instanceof File) {
            url = URL.createObjectURL(file);
        }

        if (url) {
            window.open(url, '_blank');
        }
    };

    const content = (
        <>
            <div className="flex items-center space-x-3 overflow-hidden">
                {!isMarkedForDeletion && (
                    <div
                        onPointerDown={(e) => dragControls.start(e)}
                        className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
                    >
                        <GripVertical size={20} />
                    </div>
                )}
                
                <FileIcon className={`h-6 w-6 flex-shrink-0 ${file.isExisting ? 'text-blue-500' : 'text-green-500'} ${isMarkedForDeletion ? 'text-gray-400' : ''}`} />
                
                <div className="overflow-hidden">
                    <a 
                        href="#"
                        onClick={handleFileClick} 
                        className={`text-sm font-medium truncate block transition-colors select-none ${isMarkedForDeletion ? 'text-gray-500 line-through cursor-default' : 'text-gray-800 hover:underline hover:text-indigo-600'}`}
                        title={isMarkedForDeletion ? "已標記刪除" : "點擊預覽"}
                    >
                        {file.name}
                    </a>
                    <p className={`text-xs select-none ${isMarkedForDeletion ? 'text-gray-400' : 'text-gray-500'}`}>{file.type} • {formatFileSize(file.size)}</p>
                </div>
            </div>
            
            <button
                onClick={isMarkedForDeletion ? () => onUndelete(file) : () => onRemove(file)}
                className={`p-1 rounded-full transition-colors ${isMarkedForDeletion ? 'text-yellow-600 hover:bg-yellow-200' : 'text-red-500 hover:bg-red-100'}`}
                title={isMarkedForDeletion ? "取消刪除" : "標記為刪除"}
            >
                {isMarkedForDeletion ? <Undo size={18} /> : <Trash2 size={18} />}
            </button>
        </>
    );

    if (isMarkedForDeletion) {
        return (
            <div className={`relative flex items-center justify-between p-3 rounded-lg transition-colors duration-300 ${isMarkedForDeletion ? 'bg-red-100' : 'bg-white border hover:shadow-md'}`}>
                {content}
            </div>
        );
    }

    return (
        <Reorder.Item
            value={file}
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={constraintsRef}
            className={`relative flex items-center justify-between p-3 rounded-lg transition-colors duration-300 ${isMarkedForDeletion ? 'bg-red-100' : 'bg-white border hover:shadow-md'}`}
        >
            {content}
        </Reorder.Item>
    );
};

const MultipleFilesUploadArea = ({ selectedFiles, setSelectedFiles, filesToRemove, setFilesToRemove, disabled, showToast }) => {
    const fileInputRef = useRef(null);
    const maxFiles = 8;
    const maxFileSize = 15 * 1024 * 1024; // 15MB
    const displayMaxSize = `${maxFileSize / 1024 / 1024} MB`;
    const constraintsRef = useRef(null);

    const supportedTypes = {
        'application/pdf': ['pdf'],
        'image/jpeg': ['jpeg', 'jpg'], 'image/png': ['png'], 'image/webp': ['webp'],
        'application/msword': ['doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
        'application/vnd.oasis.opendocument.text': ['odt'],
        'application/vnd.ms-excel': ['xls'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
        'application/vnd.oasis.opendocument.spreadsheet': ['ods'],
        'application/vnd.ms-powerpoint': ['ppt'],
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['pptx'],
        'application/vnd.oasis.opendocument.presentation': ['odp'],
    };

    const acceptString = Object.values(supportedTypes).flat().map(ext => `.${ext}`).join(',');

    const handleFiles = (files) => {
        let newFiles = [];
        for (const file of files) {
            const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
            const isTypeSupported = Object.keys(supportedTypes).includes(file.type) || Object.values(supportedTypes).flat().includes(fileExtension);

            if (!isTypeSupported) { showToast(`不支援的檔案類型: ${file.name}`, 'warning'); continue; }
            if (selectedFiles.some(f => f.name === file.name)) { showToast(`檔案 "${file.name}" 已存在`, 'warning'); continue; }
            if (file.size > maxFileSize) { showToast(`檔案大小超過 ${displayMaxSize} 限制: ${file.name}`, 'warning'); continue; }
            if (selectedFiles.length + newFiles.length >= maxFiles) { showToast(`最多只能選擇 ${maxFiles} 個檔案`, 'warning'); break; }

            file.id = file.id || crypto.randomUUID(); // Ensure ID
            newFiles.push(file);
        }
        setSelectedFiles(prev => [...prev, ...newFiles]);
    };

    const handleFileChange = (e) => { handleFiles(Array.from(e.target.files)); e.target.value = ''; };
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => { e.preventDefault(); if (!disabled) handleFiles(Array.from(e.dataTransfer.files)); };

    const handleRemoveFile = (fileToRemove) => {
        if (fileToRemove.isExisting) {
            setFilesToRemove(prev => [...prev, fileToRemove]);
        } else {
            setSelectedFiles(prev => prev.filter((f) => f.id !== fileToRemove.id));
        }
    };

    const handleUndeleteFile = (fileToUndelete) => {
        setFilesToRemove(prev => prev.filter(f => f.id !== fileToUndelete.id));
    };

    // Filter for display
    const visibleFiles = selectedFiles.filter(f => !filesToRemove.some(r => r.id === f.id));
    const deletedFiles = selectedFiles.filter(f => filesToRemove.some(r => r.id === f.id));

    const handleReorder = (newOrder) => {
        // newOrder are visible files. Append deleted files to maintain state.
        setSelectedFiles([...newOrder, ...deletedFiles]);
    };

    return (
        <div className="space-y-4">
            <div className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-300 ${!disabled ? 'border-gray-300 hover:border-indigo-400 bg-transparent cursor-pointer' : 'bg-gray-100/50 cursor-not-allowed'}`}
                onDragOver={handleDragOver} onDrop={handleDrop} onClick={() => !disabled && fileInputRef.current?.click()}>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept={acceptString} disabled={disabled} multiple />
                <UploadCloud className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600 select-none">拖曳檔案到此，或 <span className="font-medium text-indigo-600">點擊上傳</span></p>
                <p className="mt-1 text-xs text-gray-500 select-none">已選擇 {selectedFiles.length - filesToRemove.length} / {maxFiles} 個檔案</p>
                <p className="mt-1 text-xs text-gray-400 select-none">
                    支援文件 (Word, Excel, PPT, PDF, ODT, ODS, ODP) 及圖片格式，單一檔案大小上限為 {displayMaxSize}
                </p>
            </div>
            
            {visibleFiles.length > 0 && (
                <div ref={constraintsRef} className="relative">
                    <Reorder.Group axis="y" values={visibleFiles} onReorder={handleReorder} className="space-y-2 rounded-lg p-2 bg-transparent">
                        {visibleFiles.map((file) => (
                            <DraggableFileItem 
                                key={file.id} 
                                file={file} 
                                onRemove={handleRemoveFile}
                                onUndelete={handleUndeleteFile}
                                isMarkedForDeletion={false}
                                formatFileSize={formatFileSize}
                                constraintsRef={constraintsRef}
                            />
                        ))}
                    </Reorder.Group>
                </div>
            )}

            {deletedFiles.length > 0 && (
                <div className="space-y-2 rounded-lg p-2 bg-red-50/50 border border-red-100">
                    <p className="text-xs font-semibold text-red-500 px-1 select-none">已標記刪除</p>
                    {deletedFiles.map((file) => (
                        <DraggableFileItem 
                            key={file.id} 
                            file={file} 
                            onRemove={handleRemoveFile}
                            onUndelete={handleUndeleteFile}
                            isMarkedForDeletion={true}
                            formatFileSize={formatFileSize}
                            constraintsRef={constraintsRef}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};


export default function UpdateAnnouncementModal({ isOpen, onClose, announcement, refreshAnnouncements, onSwitchTo }) {
    const [isSaving, setIsSaving] = useState(false);
    const [isDuplicating, setIsDuplicating] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [filesToRemove, setFilesToRemove] = useState([]);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const [formData, setFormData] = useState({
        title: '', summary: '', is_active: false, category: '',
        application_start_date: '', application_end_date: '',
        target_audience: '', application_limitations: '',
        submission_method: '', external_urls: [{ url: '' }],
        internal_id: ''
    });

    const inputStyles = "w-full px-3 py-2 bg-white/70 border border-gray-300 rounded-md shadow-sm transition-all duration-300 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/30";

    useEffect(() => {
        if (isOpen && announcement) {
            document.body.style.overflow = 'hidden';
            document.body.classList.add('admin-modal-open');
            let urls = [{ url: '' }];
            try {
                const parsedUrls = JSON.parse(announcement.external_urls);
                if (Array.isArray(parsedUrls) && parsedUrls.length > 0) { urls = parsedUrls; }
            } catch (e) {
                if (typeof announcement.external_urls === 'string' && announcement.external_urls.startsWith('http')) {
                    urls = [{ url: announcement.external_urls }];
                }
            }

            setFormData({
                title: announcement.title || '',
                summary: announcement.summary || '',
                is_active: announcement.is_active,
                category: announcement.category || '',
                application_start_date: announcement.application_start_date || '',
                application_end_date: announcement.application_end_date || '',
                target_audience: announcement.target_audience || '',
                application_limitations: announcement.application_limitations || '',
                submission_method: announcement.submission_method || '',
                external_urls: urls,
                internal_id: announcement.internal_id || '',
            });

            loadExistingAttachments(announcement.id);
            setFilesToRemove([]);
        } else {
            document.body.style.overflow = 'unset';
            document.body.classList.remove('admin-modal-open');
        }
        return () => { 
            document.body.style.overflow = 'unset';
            document.body.classList.remove('admin-modal-open');
        };
    }, [isOpen, announcement]);

    const loadExistingAttachments = async (announcementId) => {
        if (!announcementId) return setSelectedFiles([]);
        try {
            const { data, error } = await supabase.from('attachments').select('*').eq('announcement_id', announcementId);
            if (error) throw error;
            // Ensure unique ID for Reorder if not present (should be present from DB)
            const existingFiles = (data || []).map(att => ({
                id: att.id, name: att.file_name, size: att.file_size, type: att.mime_type,
                path: att.stored_file_path, isExisting: true, display_order: att.display_order
            })).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
            setSelectedFiles(existingFiles);
        } catch (error) { showToast('載入附件失敗', 'error'); }
    };

    const hideToast = () => setToast(prev => ({ ...prev, show: false }));

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            hideToast();
        }, 3000);
    };

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSummaryChange = useCallback((content) => setFormData(prev => ({ ...prev, summary: content })), []);
    const handleTargetAudienceChange = useCallback((content) => setFormData(prev => ({ ...prev, target_audience: content })), []);

    const handleUrlChange = (index, value) => {
        const newUrls = [...formData.external_urls]; newUrls[index].url = value;
        setFormData(prev => ({ ...prev, external_urls: newUrls }));
    };
    const addUrlInput = () => setFormData(prev => ({ ...prev, external_urls: [...prev.external_urls, { url: '' }] }));
    const removeUrlInput = (index) => setFormData(prev => ({ ...prev, external_urls: prev.external_urls.filter((_, i) => i !== index) }));

    const handleDuplicate = async () => {
        if (!window.confirm('確定要複製此公告嗎？')) return;
        setIsDuplicating(true);
        try {
            showToast('正在複製公告...', 'info');
            const res = await authFetch('/api/admin/announcements/duplicate', {
                method: 'POST',
                body: JSON.stringify({ announcementId: announcement.id })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || '複製失敗');
            
            showToast('公告已成功複製！即將跳轉...', 'success');
            
            if (refreshAnnouncements) await refreshAnnouncements();
            onClose();
            
            if (onSwitchTo && data.newAnnouncement) {
                // 稍微延遲以確保列表刷新 (雖然 await refreshAnnouncements 應該夠了)
                setTimeout(() => {
                    onSwitchTo(data.newAnnouncement);
                }, 100);
            }
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setIsDuplicating(false);
        }
    };

    const handleSave = async () => {
        if (!formData.title.trim() || !formData.summary.replace(/<[^>]*>?/gm, '').trim() || !formData.application_end_date) {
            showToast('請填寫所有必填欄位', 'warning'); return;
        }

        if (!formData.internal_id || formData.internal_id.trim() === '') {
            if (!window.confirm('您未填寫「內部辨識名」。\n此欄位用於內部申請作業流程自動化。\n\n確定此公告不須該內部辨識名嗎？')) {
                return;
            }
        }

        setIsSaving(true);
        try {
            const finalUrls = formData.external_urls.filter(item => item.url.trim() !== '');

            const { data: updated, error } = await supabase.from('announcements').update({
                title: formData.title,
                summary: formData.summary,
                is_active: formData.is_active,
                category: formData.category,
                application_start_date: formData.application_start_date || null,
                application_end_date: formData.application_end_date || null,
                target_audience: formData.target_audience,
                application_limitations: formData.application_limitations,
                submission_method: formData.submission_method,
                external_urls: JSON.stringify(finalUrls),
                updated_at: new Date().toISOString(),
                internal_id: formData.internal_id,
            }).eq('id', announcement.id).select().single();
            if (error) throw error;

            if (filesToRemove.length > 0) {
                const pathsToRemove = filesToRemove.map(f => f.path);
                const idsToRemove = filesToRemove.map(f => f.id);
                await authFetch('/api/delete-files', { method: 'POST', body: JSON.stringify({ filePaths: pathsToRemove }) });
                const { error: deleteDbError } = await supabase.from('attachments').delete().in('id', idsToRemove);
                if (deleteDbError) throw deleteDbError;
            }

            const newFiles = selectedFiles.filter(file => !file.isExisting);
            let uploadedFilesData = [];

            if (newFiles.length > 0) {
                const uploadFormData = new FormData();
                newFiles.forEach(file => {
                    uploadFormData.append('files', file);
                });

                const uploadResponse = await authFetch('/api/upload-files', { method: 'POST', body: uploadFormData });
                if (!uploadResponse.ok) {
                    const errorResult = await uploadResponse.json().catch(() => null);
                    const errorMessage = errorResult?.error || '檔案上傳請求失敗';
                    throw new Error(errorMessage);
                }

                const uploadResult = await uploadResponse.json();

                if (uploadResult.data.errors && uploadResult.data.errors.length > 0) {
                    const errorMessages = uploadResult.data.errors.map(e => `${e.fileName}: ${e.error}`).join(', ');
                    throw new Error(`部分檔案上傳失敗: ${errorMessages}`);
                }

                uploadedFilesData = uploadResult.data.uploaded || [];
            }

            // Update display_order logic:
            // 1. We have 'selectedFiles' which contains the desired order (both existing and new placeholders)
            // 2. We have 'uploadedFilesData' which contains the backend info for new files.
            
            // We need to iterate over 'selectedFiles' (which is the truth for order) and apply updates/inserts.
            
            const existingUpdates = [];
            const newAttachments = [];

            selectedFiles.forEach((file, index) => {
                if (file.isExisting) {
                    // It's an existing file, we just need to update its display_order
                    existingUpdates.push({
                        id: file.id,
                        display_order: index,
                        announcement_id: announcement.id, // Ensure required fields are present if needed by policies
                        file_name: file.name,
                        stored_file_path: file.path,
                        file_size: file.size,
                        mime_type: file.type
                    });
                } else {
                    // It's a new file. Find its uploaded data.
                    // Match by file name and size since we don't have the original 'file' object with the random ID in 'uploadedFilesData'
                    // 'uploadedFilesData' contains 'originalName' and 'size'.
                    const uploadedInfo = uploadedFilesData.find(u => u.originalName === file.name && u.size === file.size);
                    if (uploadedInfo) {
                        newAttachments.push({
                            announcement_id: updated.id,
                            file_name: uploadedInfo.originalName,
                            stored_file_path: uploadedInfo.path,
                            file_size: uploadedInfo.size,
                            mime_type: uploadedInfo.mimeType,
                            display_order: index
                        });
                        // Remove from uploadedFilesData to prevent double matching if identical files exist (rare but possible)
                        const uIndex = uploadedFilesData.indexOf(uploadedInfo);
                        if (uIndex > -1) uploadedFilesData.splice(uIndex, 1);
                    }
                }
            });

            // Execute Updates
            if (existingUpdates.length > 0) {
                const { error: updateOrderError } = await supabase.from('attachments').upsert(existingUpdates);
                if (updateOrderError) throw updateOrderError;
            }

            // Execute Inserts
            if (newAttachments.length > 0) {
                const { error: insErr } = await supabase.from('attachments').insert(newAttachments);
                if (insErr) throw insErr;
            }

            if (refreshAnnouncements) refreshAnnouncements();
            onClose();
            showToast('公告已成功更新', 'success');
        } catch (err) {
            showToast(`更新失敗: ${err.message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            {createPortal(
                <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />,
                document.body
            )}
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex flex-col pt-[var(--header-height)]">
                        <motion.div
                            initial={{ x: '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="relative bg-white/95 backdrop-blur-lg shadow-2xl w-full flex-1 flex flex-col overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-5 border-b border-black/10 flex justify-between items-center flex-shrink-0 bg-white/50">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 select-none">
                                    <button
                                        onClick={() => {
                                            if (window.confirm('確認關閉公告編輯模組嗎？如尚未儲存將丟失此編輯紀錄！')) {
                                                onClose();
                                            }
                                        }}
                                        disabled={isSaving}
                                        className="text-gray-500 hover:text-gray-700 p-1 rounded-full mr-2"
                                    >
                                        <ArrowLeft size={24} />
                                    </button>
                                    編輯公告
                                </h2>
                            </div>

                            <div className="flex-grow p-6 overflow-y-auto">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden">
                                    {/* Left Column: Basic Info */}
                                    <div className="lg:col-span-4 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                                        {isSaving && (<div className="absolute inset-0 bg-white/70 z-20 flex flex-col items-center justify-center rounded-lg"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /><p className="mt-4 text-indigo-700 font-semibold select-none">儲存中...</p></div>)}

                                        <div>
                                            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-1.5 select-none">
                                                公告標題 <span className="text-red-500 ml-1">*</span>
                                            </label>
                                            <input type="text" id="title" name="title" className={inputStyles} value={formData.title} onChange={handleChange} />
                                        </div>

                                        <div>
                                            <label htmlFor="internal_id" className="block text-sm font-semibold text-gray-700 mb-1.5 select-none">
                                                內部辨識名 (選填)
                                            </label>
                                            <input 
                                                type="text" 
                                                id="internal_id" 
                                                name="internal_id" 
                                                className={inputStyles} 
                                                value={formData.internal_id} 
                                                onChange={handleChange} 
                                                maxLength={5}
                                                placeholder="最多5字，用於申請流程自動化"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><label htmlFor="is_active" className="block text-sm font-semibold text-gray-700 mb-1.5 select-none">公告狀態</label><select id="is_active" name="is_active" className={inputStyles} value={formData.is_active} onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}><option value={false}>下架</option><option value={true}>上架</option></select></div>
                                            <div><label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-1.5 select-none">獎學金分類</label><select id="category" name="category" className={inputStyles} value={formData.category} onChange={handleChange}><option value="">請選擇</option><option value="A">A：各縣市政府獎學金</option><option value="B">B：縣市政府以外之各級公家機關及公營單位獎學金</option><option value="C">C：宗教及民間各項指定身分獎學金</option><option value="D">D：非公家機關或其他無法歸類的獎學金</option><option value="E">E：本校獲配推薦名額獎助學金</option><option value="F">F：校外獎助學金得獎公告</option><option value="G">G：校內獎助學金</option></select></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><label htmlFor="application_start_date" className="block text-sm font-semibold text-gray-700 mb-1.5 select-none">申請開始日期</label><input type="date" id="application_start_date" name="application_start_date" className={inputStyles} value={formData.application_start_date} onChange={handleChange} /></div>
                                            <div><label htmlFor="application_end_date" className="block text-sm font-semibold text-gray-700 mb-1.5 select-none">申請截止日期 <span className="text-red-500 ml-1">*</span></label><input type="date" id="application_end_date" name="application_end_date" className={inputStyles} value={formData.application_end_date} onChange={handleChange} /></div>
                                        </div>
                                        <div><label htmlFor="submission_method" className="block text-sm font-semibold text-gray-700 mb-1.5 select-none">送件方式</label><input type="text" id="submission_method" name="submission_method" className={inputStyles} value={formData.submission_method} onChange={handleChange} /></div>

                                        <div>
                                            <label htmlFor="application_limitations" className="block text-sm font-semibold text-gray-700 mb-1.5 select-none">申請限制</label>
                                            <select id="application_limitations" name="application_limitations" className={inputStyles} value={formData.application_limitations} onChange={handleChange}>
                                                <option value="">未指定</option>
                                                <option value="Y">可兼領</option>
                                                <option value="N">不可兼領</option>
                                            </select>
                                        </div>

                                        <div className="pt-4 border-t border-gray-100">
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-600 flex items-center gap-2 select-none"><LinkIcon size={16} />外部參考連結</label>
                                                {formData.external_urls.map((item, index) => (
                                                    <div key={index} className="flex items-center gap-2">
                                                        <input type="url" className={inputStyles} value={item.url} onChange={(e) => handleUrlChange(index, e.target.value)} placeholder="https://example.com" />
                                                        {formData.external_urls.length > 1 && (<button type="button" onClick={() => removeUrlInput(index)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={16} /></button>)}
                                                    </div>
                                                ))}
                                                <Button type="button" variant="ghost" size="sm" onClick={addUrlInput} leftIcon={<PlusCircle size={16} />}>新增連結</Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Rich Text & Attachments */}
                                    <div className="lg:col-span-8 space-y-6 overflow-y-auto pr-2 custom-scrollbar flex flex-col h-full">
                                        <div className="flex flex-col">
                                            <label htmlFor="summary" className="block text-sm font-semibold text-gray-700 mb-1.5 flex-shrink-0 select-none">
                                                公告摘要 <span className="text-red-500 ml-1">*</span>
                                            </label>
                                            <div className="relative">
                                                <TinyMCE value={formData.summary} onChange={handleSummaryChange} disabled={isSaving} />
                                            </div>
                                        </div>

                                        <div className="flex flex-col">
                                            <label htmlFor="target_audience" className="block text-sm font-semibold text-gray-700 mb-1.5 flex-shrink-0 select-none">適用對象</label>
                                            <div className="relative">
                                                <TinyMCE value={formData.target_audience} onChange={handleTargetAudienceChange} disabled={isSaving} />
                                            </div>
                                        </div>

                                        <div className="p-4 bg-slate-500/5 rounded-lg border">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 select-none">附件管理 (拖曳可排序)</label>
                                            <MultipleFilesUploadArea selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} filesToRemove={filesToRemove} setFilesToRemove={setFilesToRemove} disabled={isSaving} showToast={showToast} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-black/5 flex justify-end space-x-3 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={handleDuplicate}
                                    disabled={isSaving || isDuplicating}
                                    className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg border border-amber-400 bg-transparent text-amber-600 transition-all duration-300 ease-in-out transform hover:bg-amber-100 hover:text-amber-700 hover:border-amber-400 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/20 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 disabled:transform-none disabled:shadow-none"
                                >
                                    {isDuplicating ? <Loader2 size={16} className="animate-spin" /> : <Copy size={16} />}
                                    <span className="select-none">複製公告</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg border border-indigo-400 bg-transparent text-indigo-600 transition-all duration-300 ease-in-out transform hover:bg-indigo-100 hover:text-indigo-700 hover:border-indigo-400 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 disabled:transform-none disabled:shadow-none"
                                >
                                    {isSaving ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Save size={16} />
                                    )}
                                    <span className="select-none">儲存變更</span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}