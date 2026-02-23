'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
// import { GoogleGenerativeAI } from "@google/generative-ai"; // Removed client-side SDK
import TinyMCE from './TinyMCE';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import { authFetch } from '@/lib/authFetch';
import { X, Loader2, Save, Trash2, UploadCloud, Link as LinkIcon, PlusCircle, File as FileIcon, GripVertical, ArrowLeft } from 'lucide-react';

// --- Button Styles ---
const buttonStyles = {
    primary: "flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg border border-indigo-400 bg-transparent text-indigo-600 transition-all duration-300 ease-in-out transform whitespace-nowrap hover:bg-indigo-100 hover:text-indigo-700 hover:border-indigo-400 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 disabled:transform-none disabled:shadow-none disabled:cursor-not-allowed",
    secondary: "flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg border border-stone-400 bg-transparent text-stone-700 transition-all duration-300 ease-in-out transform whitespace-nowrap hover:bg-stone-200 hover:text-stone-800 hover:border-stone-500 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:shadow-stone-500/20 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 disabled:transform-none disabled:shadow-none disabled:cursor-not-allowed",
};


const InputModeSelector = ({ inputMode, setInputMode, disabled }) => (
    <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 select-none">選擇輸入模式</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${inputMode === 'ai' ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-300 hover:border-gray-400'}`} onClick={() => !disabled && setInputMode('ai')}> 
                <h4 className="font-bold text-gray-900 select-none">AI 智慧分析</h4>
                <p className="text-sm text-gray-600 mt-1 select-none">上傳檔案或網址，由 AI 自動生成摘要</p>
            </div>
            <div className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${inputMode === 'manual' ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-300 hover:border-gray-400'}`} onClick={() => !disabled && setInputMode('manual')}> 
                <h4 className="font-bold text-gray-900 select-none">手動輸入</h4>
                <p className="text-sm text-gray-600 mt-1 select-none">自行填寫所有公告欄位</p>
            </div>
        </div>
    </div>
);

const DraggableFileItem = ({ file, onRemove, formatFileSize, constraintsRef }) => {
    const dragControls = useDragControls();

    const handleFileClick = (e) => {
        e.preventDefault();
        // Since selectedFiles in CreateAnnouncementModal are mostly File objects (from input type=file)
        if (file instanceof File) {
            const url = URL.createObjectURL(file);
            window.open(url, '_blank');
        }
    };

    return (
        <Reorder.Item
            value={file}
            dragListener={false} // Disable default drag listener
            dragControls={dragControls}
            dragConstraints={constraintsRef}
            className="relative flex items-center justify-between p-3 rounded-lg bg-white border hover:shadow-md transition-shadow"
        >
            <div className="flex items-center space-x-3 overflow-hidden">
                {/* Drag Handle */}
                <div
                    onPointerDown={(e) => dragControls.start(e)}
                    className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
                >
                    <GripVertical size={20} />
                </div>
                
                <FileIcon className="h-6 w-6 flex-shrink-0 text-blue-500" />
                
                <div className="overflow-hidden">
                    <a 
                        href="#"
                        onClick={handleFileClick} 
                        className="text-sm font-medium text-gray-800 truncate hover:underline hover:text-indigo-600 block transition-colors select-none"
                        title="點擊預覽"
                    >
                        {file.name}
                    </a>
                    <p className="text-xs text-gray-500 select-none">{file.type} • {formatFileSize(file.size)}</p>
                </div>
            </div>
            <button
                onClick={() => onRemove(file)}
                className="p-1 rounded-full transition-colors text-red-500 hover:bg-red-100"
                title="移除"
            >
                <Trash2 size={18} />
            </button>
        </Reorder.Item>
    );
};

const FileUploadArea = ({ selectedFiles, setSelectedFiles, disabled, showToast }) => {
    const fileInputRef = useRef(null);
    const maxFiles = 8;
    const maxFileSize = 15 * 1024 * 1024; // 15MB
    const displayMaxSize = `${maxFileSize / 1024 / 1024} MB`;
    const constraintsRef = useRef(null);

    const supportedTypes = {
        // PDF
        'application/pdf': ['pdf'],
        // Images
        'image/jpeg': ['jpeg', 'jpg'],
        'image/png': ['png'],
        'image/webp': ['webp'],
        // Word
        'application/msword': ['doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
        'application/vnd.oasis.opendocument.text': ['odt'],
        // Excel
        'application/vnd.ms-excel': ['xls'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
        'application/vnd.oasis.opendocument.spreadsheet': ['ods'],
        // PowerPoint
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

            file.isNewFile = true;
            file.id = file.id || crypto.randomUUID();
            newFiles.push(file);
        }
        if (newFiles.length > 0) {
            setSelectedFiles(prev => [...prev, ...newFiles]);
        }
    };

    const handleFileChange = (e) => { handleFiles(Array.from(e.target.files)); e.target.value = ''; };
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => { e.preventDefault(); if (!disabled) handleFiles(Array.from(e.dataTransfer.files)); };
    const handleRemoveFile = (fileToRemove) => setSelectedFiles(prev => prev.filter((f) => f.id !== fileToRemove.id));
    const formatFileSize = (size) => {
        if (!size) return '0 B';
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="space-y-4">
            <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-300 ${!disabled ? 'border-gray-300 hover:border-indigo-400 bg-transparent cursor-pointer' : 'bg-gray-100/50 cursor-not-allowed'}`}
                onDragOver={handleDragOver} onDrop={handleDrop} onClick={() => !disabled && fileInputRef.current?.click()}> 

                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept={acceptString} disabled={disabled} multiple />

                <UploadCloud className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600 select-none">拖曳檔案到此，或 <span className="font-medium text-indigo-600">點擊上傳</span></p>
                <p className="mt-1 text-xs text-gray-500 select-none">已選擇 {selectedFiles.length} / {maxFiles} 個檔案</p>
                <p className="mt-1 text-xs text-gray-400 select-none">
                    支援文件 (Word, Excel, PPT, PDF, ODT, ODS, ODP) 及圖片格式，單一檔案大小上限為 {displayMaxSize}
                </p>
            </div>
            {selectedFiles.length > 0 && (
                <div ref={constraintsRef} className="relative">
                    <Reorder.Group axis="y" values={selectedFiles} onReorder={setSelectedFiles} className="space-y-2 rounded-lg p-2 bg-transparent">
                        {selectedFiles.map((file) => (
                            <DraggableFileItem 
                                key={file.id} 
                                file={file} 
                                onRemove={handleRemoveFile} 
                                formatFileSize={formatFileSize}
                                constraintsRef={constraintsRef}
                            />
                        ))}
                    </Reorder.Group>
                </div>
            )}
        </div>
    );
};

const UrlInputArea = ({ urls, setUrls, disabled, showToast }) => {
    const [urlInput, setUrlInput] = useState('');
    const inputStyles = "w-full px-3 py-2 bg-white/70 border border-gray-300 rounded-md shadow-sm transition-all duration-300 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/30";

    const handleAddUrl = () => {
        const trimmedUrl = urlInput.trim();
        if (!trimmedUrl) { showToast('請輸入網址', 'warning'); return; }
        try { new URL(trimmedUrl); } catch { showToast('請輸入有效的網址', 'warning'); return; }
        if (urls.some(url => url === trimmedUrl)) { showToast('此網址已經存在', 'warning'); return; }
        setUrls(prev => [...prev, trimmedUrl]);
        setUrlInput('');
    };

    const handleRemoveUrl = (indexToRemove) => {
        setUrls(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <input
                    type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddUrl())}
                    placeholder="輸入網址進行 AI 分析" className={`${inputStyles} flex-grow`}
                    disabled={disabled}
                />
                <button
                    type="button"
                    onClick={handleAddUrl}
                    disabled={disabled || !urlInput.trim()}
                    className={buttonStyles.primary}
                >
                    <span className="select-none">添加</span>
                </button>
            </div>
            {urls.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto p-2">
                    {urls.map((url, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                            <div className="flex items-center space-x-3 overflow-hidden">
                                <LinkIcon className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                                <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline truncate select-none">{url}</a>
                            </div>
                            {!disabled && (
                                <button onClick={() => handleRemoveUrl(index)} className="p-1 rounded-full text-red-500 hover:bg-red-100 ml-2" title="移除網址">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Main Modal Component ---
export default function CreateAnnouncementModal({ isOpen, onClose, refreshAnnouncements }) {
    const [inputMode, setInputMode] = useState('ai');
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState("處理中...");
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [urls, setUrls] = useState([]);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    // const modelRef = useRef(null); // Removed

    const initialFormData = {
        title: '', summary: '', category: '', application_start_date: '',
        application_end_date: '', target_audience: '', application_limitations: '',
        submission_method: '', external_urls: [{ url: '' }],
        is_active: true,
        internal_id: '',
    };
    const [formData, setFormData] = useState(initialFormData);

    const inputStyles = "w-full px-3 py-2 bg-white/70 border border-gray-300 rounded-md shadow-sm transition-all duration-300 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/30";

    const showToast = (message, type = 'success') => setToast({ show: true, message, type });
    const hideToast = () => setToast(prev => ({ ...prev, show: false }));

    // Removed useEffect for Gemini initialization

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.classList.add('admin-modal-open');
            setInputMode('ai');
            setCurrentStep(0);
            setSelectedFiles([]);
            setUrls([]);
            setFormData(initialFormData);
        } else {
            document.body.style.overflow = 'unset';
            document.body.classList.remove('admin-modal-open');
        }
        return () => { 
            document.body.style.overflow = 'unset';
            document.body.classList.remove('admin-modal-open');
        };
    }, [isOpen]);

    const handleSummaryChange = useCallback((content) => setFormData(prev => ({ ...prev, summary: content })), []);
    const handleTargetAudienceChange = useCallback((content) => setFormData(prev => ({ ...prev, target_audience: content })), []);
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleUrlChange = (index, value) => {
        const newUrls = [...formData.external_urls];
        newUrls[index].url = value;
        setFormData(prev => ({ ...prev, external_urls: newUrls }));
    };
    const addUrlInput = () => setFormData(prev => ({ ...prev, external_urls: [...prev.external_urls, { url: '' }] }));
    const removeUrlInput = (index) => setFormData(prev => ({ ...prev, external_urls: prev.external_urls.filter((_, i) => i !== index) }));

    const isFormValid = formData.title.trim() !== '' && formData.summary.replace(/<[^>]*>?/gm, '').trim() !== '' && formData.application_end_date && formData.application_end_date !== '';

    // Removed fileToGenerativePart

    const handleAiAnalyze = async () => {
        // 確保有輸入源
        if (selectedFiles.length === 0 && urls.length === 0) {
            showToast("請至少上傳一個檔案或提供一個網址", "warning");
            return;
        }

        // 進入載入狀態，更新 UI
        setIsLoading(true);
        setCurrentStep(1);

        try {
            setLoadingText("正在準備分析資料...");

            // ---  篩選出 AI 可分析的檔案 ---
            const aiSupportedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            const filesForAI = selectedFiles.filter(file => aiSupportedTypes.includes(file.type));

            const sourceUrlsForAI = [];
            const scrapedContentsForAI = [];

            if (urls.length > 0) {
                setLoadingText(`正在分析 ${urls.length} 個網址...`);

                // 為每個 URL 建立一個爬取請求的 Promise
                const scrapingPromises = urls.map(async (url) => {
                    try {
                        const response = await fetch('/api/scrape', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ url }),
                        });

                        // 如果後端 API 回應錯誤 (例如 500)
                        if (!response.ok) {
                            console.warn(`爬取網址失敗 (API 狀態碼: ${response.status}): ${url}`);
                            return { url, success: false };
                        }

                        const result = await response.json();

                        // 如果後端回報錯誤，或沒有抓到任何文字
                        if (result.error || !result.scrapedText) {
                            console.warn(`無法從網址提取內容: ${url}. ${result.message || ''}`);
                            return { url, success: false };
                        }

                        // 成功抓到內容
                        return { url, text: result.scrapedText, success: true };

                    } catch (error) {
                        console.error(`爬取網址時發生前端錯誤: ${url}`, error);
                        return { url, success: false };
                    }
                });

                const results = await Promise.all(scrapingPromises);

                results.forEach(({ url, text, success }) => {
                    if (success) {
                        // 將成功爬取的內容格式化後加入陣列
                        scrapedContentsForAI.push(`--- 網址內容 (${url}) ---
${text}`);
                    } else {
                        // 將失敗的原始網址加入陣列，讓 AI 稍後自行嘗試
                        sourceUrlsForAI.push(url);
                    }
                });
            }

            setLoadingText("AI 分析中，請稍候...");

            // Prepare Form Data for Backend API
            const formDataForAi = new FormData();
            
            // Add Scraped Contents and URLs
            if (scrapedContentsForAI.length > 0) {
                 formDataForAi.append('scrapedContents', `\n# 已爬取的網址內容:\n${scrapedContentsForAI.join('\n\n')}`);
            }
            if (sourceUrlsForAI.length > 0) {
                 formDataForAi.append('sourceUrls', `\n# 以下網址無法爬取，請直接分析:\n${sourceUrlsForAI.join('\n')}`);
            }

            // Add Files
            if (filesForAI.length > 0) {
                filesForAI.forEach(file => {
                    formDataForAi.append('files', file);
                });
                showToast(`已附加 ${filesForAI.length} 個檔案進行 AI 分析`, "info");
            }

            // Call Server-side API
            const response = await authFetch('/api/ai/generate-announcement', {
                method: 'POST',
                body: formDataForAi // authFetch handles headers, but if it sets Content-Type to json, it breaks FormData. 
                                  // Standard fetch detects FormData and sets Content-Type: multipart/form-data with boundary.
                                  // If authFetch forces JSON content type, we might need to bypass it or use standard fetch with token.
                                  // Checking authFetch usage... Usually it's fine if we don't set Content-Type manually.
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `AI 分析請求失敗 (${response.status})`);
            }

            const result = await response.json();
            
            let aiResponse;
            try {
                // 解析 AI 回傳的 JSON 字串
                aiResponse = JSON.parse(result.text);
            } catch (e) {
                console.error("AI 回應的原始文字:", result.text);
                throw new Error(`AI 回應的 JSON 格式解析失敗: ${e.message}`);
            }

            // 7. 驗證 AI 回應的內容是否完整
            if (!aiResponse.title || !aiResponse.summary) {
                console.error("AI 回應不完整:", aiResponse);
                throw new Error("AI 回應中缺少必要的 `title` 或 `summary` 欄位。");
            }

            // 8. 將 AI 生成的內容填入表單
            setFormData(prev => ({
                ...prev,
                ...aiResponse,
                is_active: true,
                external_urls: Array.isArray(aiResponse.external_urls) && aiResponse.external_urls.length > 0
                    ? aiResponse.external_urls
                    : [{ url: '' }],
            }));

            setCurrentStep(2);

        } catch (error) {
            console.error("AI 分析流程失敗:", error);
            showToast(`分析失敗: ${error.message}`, "error");
            setCurrentStep(0);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!isFormValid) {
            showToast("請填寫所有必填欄位", "warning");
            return;
        }

        // 檢查內部辨識名唯一性
        if (formData.internal_id && formData.internal_id.trim() !== '') {
            try {
                const { data: existing, error: checkError } = await supabase
                    .from('announcements')
                    .select('id, title')
                    .eq('internal_id', formData.internal_id.trim())
                    .maybeSingle();

                if (checkError) throw checkError;

                if (existing) {
                    showToast(`內部辨識名 "${formData.internal_id}" 已被其他公告使用：「${existing.title}」`, 'error');
                    return;
                }
            } catch (err) {
                console.error('唯一性檢查失敗:', err);
            }
        } else {
            if (!window.confirm('您未填寫「內部辨識名」。\n此欄位用於內部申請作業流程自動化。\n\n確定此公告不須該內部辨識名嗎？')) {
                return;
            }
        }

        setIsLoading(true);
        setLoadingText("儲存中...");
        try {
            let uploadedFilesData = [];

            const filesToUpload = selectedFiles.filter(f => f.isNewFile);

            if (filesToUpload.length > 0) {
                setLoadingText(`正在上傳 ${filesToUpload.length} 個檔案...`);
                const uploadFormData = new FormData();

                for (const file of filesToUpload) {
                    uploadFormData.append('files', file);
                }

                // 發送單一的 API 請求
                const response = await authFetch('/api/upload-files', {
                    method: 'POST',
                    body: uploadFormData,
                });

                if (!response.ok) {
                    // 整個請求失敗
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`檔案上傳失敗: ${errorData.error || response.statusText}`);
                }

                const result = await response.json();

                // 部分檔案處理失敗
                if (result.data.errors && result.data.errors.length > 0) {
                    const failedFileNames = result.data.errors.map(e => e.fileName).join(', ');
                    showToast(`部分檔案處理失敗: ${failedFileNames}`, 'warning');
                }

                // 只使用成功上傳的檔案資訊
                uploadedFilesData = result.data.uploaded || [];
            }

            setLoadingText("正在寫入資料庫...");

            const finalUrls = formData.external_urls.filter(item => item.url && item.url.trim() !== '');

            const dataToInsert = {
                title: formData.title,
                summary: formData.summary,
                category: formData.category,
                application_start_date: formData.application_start_date || null,
                application_end_date: formData.application_end_date || null,
                target_audience: formData.target_audience,
                application_limitations: formData.application_limitations,
                submission_method: formData.submission_method,
                external_urls: JSON.stringify(finalUrls),
                is_active: formData.is_active,
                internal_id: formData.internal_id,
            };

            const { data: announcement, error: announcementError } = await supabase
                .from('announcements')
                .insert(dataToInsert)
                .select().single();
            if (announcementError) throw announcementError;


            if (uploadedFilesData.length > 0) {
                const attachments = [];
                let orderIndex = 0;
                
                // Map the original selectedFiles order to the uploaded metadata
                // selectedFiles contains the user-defined order
                for (const file of selectedFiles) {
                    // Find the matching uploaded file metadata
                    // Match by name and size to be reasonably unique without ID in metadata response
                    const uploadedInfo = uploadedFilesData.find(u => u.originalName === file.name && u.size === file.size);
                    
                    if (uploadedInfo) {
                        attachments.push({
                            announcement_id: announcement.id,
                            file_name: uploadedInfo.originalName,
                            stored_file_path: uploadedInfo.path,
                            file_size: uploadedInfo.size,
                            mime_type: uploadedInfo.mimeType,
                            display_order: orderIndex
                        });
                        orderIndex++;
                    }
                }

                if (attachments.length > 0) {
                    const { error: attachmentError } = await supabase.from('attachments').insert(attachments);
                    if (attachmentError) throw attachmentError;
                }
            }

            showToast("公告發布成功!", "success");
            if (refreshAnnouncements) refreshAnnouncements();
            onClose();

        } catch (error) {
            console.error('儲存失敗:', error);
            showToast(`儲存失敗: ${error.message}`, "error");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Render Functions ---
    const renderStepContent = () => {
        if (currentStep === 0) {
            return (
                <div className="max-w-3xl mx-auto">
                    <InputModeSelector inputMode={inputMode} setInputMode={setInputMode} disabled={isLoading} />
                    <hr className="my-6 border-gray-200" />
                    {inputMode === 'ai' ? (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-800 select-none">上傳檔案或提供網址</h3>
                            <FileUploadArea selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} disabled={isLoading} showToast={showToast} />
                            <UrlInputArea urls={urls} setUrls={setUrls} disabled={isLoading} showToast={showToast} />
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 p-8 bg-gray-50/50 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 select-none">手動輸入模式</h3>
                            <p className="select-none">請點擊「下一步」開始手動填寫公告內容。</p>
                        </div>
                    )}
                </div>
            );
        }
        if (currentStep === 1) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <Loader2 className="animate-spin h-12 w-12 text-indigo-600 mb-4" />
                    <p className="text-lg font-semibold text-gray-900 select-none">{loadingText}</p>
                    <p className="text-sm text-gray-500 mt-2 select-none">請稍候，AI 正在為您生成公告內容...</p>
                </div>
            );
        }
        if (currentStep === 2) {
            return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden">
                    {/* Left Column: Basic Info - Scrollable */}
                    <div className="lg:col-span-4 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
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
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="is_active" className="block text-sm font-semibold text-gray-700 mb-1.5 select-none">公告狀態</label>
                                <select id="is_active" name="is_active" className={inputStyles} value={formData.is_active} onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}>
                                    <option value={true}>上架</option>
                                    <option value={false}>下架</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-1.5 select-none">獎學金分類</label>
                                <select id="category" name="category" className={inputStyles} value={formData.category} onChange={handleChange}>
                                    <option value="">請選擇</option>
                                    <option value="A">A：各縣市政府獎學金</option>
                                    <option value="B">B：縣市政府以外之各級公家機關及公營單位獎學金</option>
                                    <option value="C">C：宗教及民間各項指定身分獎學金</option>
                                    <option value="D">D：非公家機關或其他無法歸類的獎學金</option>
                                    <option value="E">E：本校獲配推薦名額獎助學金</option>
                                    <option value="F">F：校外獎助學金得獎公告</option>
                                    <option value="G">G：校內獎助學金</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div><label htmlFor="application_start_date" className="block text-sm font-semibold text-gray-700 mb-1.5 select-none">申請開始日期</label><input type="date" id="application_start_date" name="application_start_date" className={inputStyles} value={formData.application_start_date} onChange={handleChange} /></div>
                            <div><label htmlFor="application_end_date" className="block text-sm font-semibold text-gray-700 mb-1.5 select-none">公告結束日期 <span className="text-red-500 ml-1">*</span></label><input type="date" id="application_end_date" name="application_end_date" className={inputStyles} value={formData.application_end_date} onChange={handleChange} /></div>
                        </div>

                        <div><label htmlFor="submission_method" className="block text-sm font-semibold text-gray-700 mb-1.5 select-none">送件方式</label><input type="text" id="submission_method" name="submission_method" className={inputStyles} value={formData.submission_method} onChange={handleChange} /></div>
                        
                        <div>
                            <label htmlFor="application_limitations" className="block text-sm font-semibold text-gray-700 mb-1.5 select-none">兼領限制</label>
                            <select
                                id="application_limitations"
                                name="application_limitations"
                                className={inputStyles}
                                value={formData.application_limitations}
                                onChange={handleChange}
                            >
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

                    {/* Right Column: Rich Text & Attachments - Scrollable */}
                    <div className="lg:col-span-8 space-y-6 overflow-y-auto pr-2 custom-scrollbar flex flex-col h-full">
                         <div className="flex flex-col">
                            <label htmlFor="summary" className="block text-sm font-semibold text-gray-700 mb-1.5 flex-shrink-0 select-none">
                                公告摘要 <span className="text-red-500 ml-1">*</span>
                            </label>
                            <div className="relative">
                                <TinyMCE value={formData.summary} onChange={handleSummaryChange} disabled={isLoading} />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex-shrink-0 select-none">適用對象</label>
                            <div className="relative">
                                <TinyMCE value={formData.target_audience} onChange={handleTargetAudienceChange} disabled={isLoading} />
                            </div>
                        </div>

                        <div className="p-4 bg-slate-500/5 rounded-lg border">
                            <label className="block text-sm font-semibold text-gray-700 mb-2 select-none">附件管理 (拖曳可排序)</label>
                            <FileUploadArea selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} disabled={isLoading} showToast={showToast} />
                        </div>
                    </div>
                </div>
            );
        }
    };

    const handleNextStep = () => {
        if (inputMode === 'ai') {
            handleAiAnalyze();
        } else {
            setFormData(initialFormData);
            setCurrentStep(2);
        }
    };

    return (
        <>
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
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
                                            >                            <div className="p-5 border-b border-black/10 flex justify-between items-center flex-shrink-0 bg-white/50">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 select-none">
                                    <button
                                        onClick={() => {
                                            if (window.confirm('確認關閉公告編輯模組嗎？如尚未儲存將丟失此編輯紀錄！')) {
                                                onClose();
                                            }
                                        }}
                                        disabled={isLoading}
                                        className="text-gray-500 hover:text-gray-700 p-1 rounded-full mr-2"
                                    >
                                        <ArrowLeft size={24} />
                                    </button>
                                    新增公告
                                </h2>
                            </div>

                            <div className="flex-grow p-6 overflow-y-auto">
                                {renderStepContent()}
                            </div>

                            <div className="p-4 bg-black/5 flex justify-between items-center flex-shrink-0 border-t border-black/10">
                                <div>
                                    {currentStep === 2 && (
                                        <button
                                            type="button"
                                            onClick={() => setCurrentStep(0)}
                                            disabled={isLoading}
                                            className={buttonStyles.secondary}
                                        >
                                            <span className="select-none">返回上一步</span>
                                        </button>
                                    )}
                                </div>
                                <div className="flex justify-end space-x-3">
                                    {currentStep === 0 && (
                                        <button
                                            type="button"
                                            onClick={handleNextStep}
                                            disabled={isLoading || (inputMode === 'ai' && selectedFiles.length === 0 && urls.length === 0)}
                                            className={buttonStyles.primary}
                                        >
                                            <span className="select-none">{inputMode === 'ai' ? '開始 AI 分析' : '下一步'}</span>
                                        </button>
                                    )}

                                    {currentStep === 2 && (
                                        <button
                                            type="button"
                                            onClick={handleSave}
                                            disabled={isLoading || !isFormValid}
                                            className={buttonStyles.primary}
                                        >
                                            {isLoading ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <Save size={16} />
                                            )}
                                            <span className="select-none">儲存並發布</span>
                                        </button>
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