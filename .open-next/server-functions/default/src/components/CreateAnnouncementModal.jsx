'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from "@google/generative-ai";
import TinyMCE from './TinyMCE';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import { authFetch } from '@/lib/authFetch';
import { X, Loader2, Save, Trash2, UploadCloud, Link as LinkIcon, PlusCircle, File as FileIcon } from 'lucide-react';

// --- Button Styles ---
const buttonStyles = {
    primary: "flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg border border-indigo-400 bg-transparent text-indigo-600 transition-all duration-300 ease-in-out transform whitespace-nowrap hover:bg-indigo-100 hover:text-indigo-700 hover:border-indigo-400 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 disabled:transform-none disabled:shadow-none disabled:cursor-not-allowed",
    secondary: "flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg border border-stone-400 bg-transparent text-stone-700 transition-all duration-300 ease-in-out transform whitespace-nowrap hover:bg-stone-200 hover:text-stone-800 hover:border-stone-500 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:shadow-stone-500/20 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 disabled:transform-none disabled:shadow-none disabled:cursor-not-allowed",
};


const InputModeSelector = ({ inputMode, setInputMode, disabled }) => (
    <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">選擇輸入模式</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${inputMode === 'ai' ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-300 hover:border-gray-400'}`} onClick={() => !disabled && setInputMode('ai')}>
                <h4 className="font-bold text-gray-900">AI 智慧分析</h4>
                <p className="text-sm text-gray-600 mt-1">上傳檔案或網址，由 AI 自動生成摘要</p>
            </div>
            <div className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${inputMode === 'manual' ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-300 hover:border-gray-400'}`} onClick={() => !disabled && setInputMode('manual')}>
                <h4 className="font-bold text-gray-900">手動輸入</h4>
                <p className="text-sm text-gray-600 mt-1">自行填寫所有公告欄位</p>
            </div>
        </div>
    </div>
);

const FileUploadArea = ({ selectedFiles, setSelectedFiles, disabled, showToast }) => {
    const fileInputRef = useRef(null);
    const maxFiles = 8;
    const maxFileSize = 15 * 1024 * 1024; // 15MB
    const displayMaxSize = `${maxFileSize / 1024 / 1024} MB`;

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
            newFiles.push(file);
        }
        if (newFiles.length > 0) {
            setSelectedFiles(prev => [...prev, ...newFiles]);
        }
    };

    const handleFileChange = (e) => { handleFiles(Array.from(e.target.files)); e.target.value = ''; };
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => { e.preventDefault(); if (!disabled) handleFiles(Array.from(e.dataTransfer.files)); };
    const handleRemoveFile = (index) => setSelectedFiles(prev => prev.filter((_, i) => i !== index));
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
                <p className="mt-2 text-sm text-gray-600">拖曳檔案到此，或 <span className="font-medium text-indigo-600">點擊上傳</span></p>
                <p className="mt-1 text-xs text-gray-500">已選擇 {selectedFiles.length} / {maxFiles} 個檔案</p>
                <p className="mt-1 text-xs text-gray-400">
                    支援文件 (Word, Excel, PPT, PDF, ODT, ODS, ODP) 及圖片格式，單一檔案大小上限為 {displayMaxSize}
                </p>
            </div>
            {selectedFiles.length > 0 && (
                <div className="space-y-2">
                    <div className="space-y-2 rounded-lg p-2 bg-transparent">
                        {selectedFiles.map((file, index) => (
                            <div key={file.name + index} className="relative flex items-center justify-between p-3 rounded-lg bg-white border">
                                <div className="flex items-center space-x-3 overflow-hidden">
                                    <FileIcon className="h-6 w-6 flex-shrink-0 text-blue-500" />
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                                        <p className="text-xs text-gray-500">{file.type} • {formatFileSize(file.size)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemoveFile(index)}
                                    className="p-1 rounded-full transition-colors text-red-500 hover:bg-red-100"
                                    title="移除"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
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
                    添加
                </button>
            </div>
            {urls.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto p-2">
                    {urls.map((url, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                            <div className="flex items-center space-x-3 overflow-hidden">
                                <LinkIcon className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                                <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline truncate">{url}</a>
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
    const modelRef = useRef(null);

    const initialFormData = {
        title: '', summary: '', category: '', application_start_date: '',
        application_end_date: '', target_audience: '', application_limitations: '',
        submission_method: '', external_urls: [{ url: '' }],
        is_active: true,
    };
    const [formData, setFormData] = useState(initialFormData);

    const inputStyles = "w-full px-3 py-2 bg-white/70 border border-gray-300 rounded-md shadow-sm transition-all duration-300 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/30";

    const showToast = (message, type = 'success') => setToast({ show: true, message, type });
    const hideToast = () => setToast(prev => ({ ...prev, show: false }));

    useEffect(() => {
        if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
            try {
                const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
                modelRef.current = genAI.getGenerativeModel({
                    model: "gemini-2.5-flash",
                    generationConfig: { responseMimeType: "application/json" },
                });
            } catch (error) {
                console.error("Failed to initialize Gemini AI:", error);
                showToast("AI 模型初始化失敗", "error");
            }
        } else {
            console.error("Gemini API Key is not set.");
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setInputMode('ai');
            setCurrentStep(0);
            setSelectedFiles([]);
            setUrls([]);
            setFormData(initialFormData);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
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

    const isFormValid = formData.title.trim() !== '' && formData.summary.replace(/<[^>]*>?/gm, '').trim() !== '';

    const fileToGenerativePart = async (file) => {
        const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
        return { inlineData: { data: base64, mimeType: file.type } };
    };

    const handleAiAnalyze = async () => {
        // 確保有輸入源
        if (selectedFiles.length === 0 && urls.length === 0) {
            showToast("請至少上傳一個檔案或提供一個網址", "warning");
            return;
        }
        // 驗證 AI 模型是否已準備就緒
        if (!modelRef.current) {
            showToast("AI 模型尚未初始化或初始化失敗", "error");
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

            if (filesForAI.length > 0) {
                console.log(`找到 ${filesForAI.length} 個可供 AI 分析的檔案:`, filesForAI.map(f => f.name));
            }
            if (filesForAI.length < selectedFiles.length) {
                console.log(`有 ${selectedFiles.length - filesForAI.length} 個檔案將作為一般附件，不參與 AI 分析。`);
            }

            const parts = [];
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
                        scrapedContentsForAI.push(`--- 網址內容 (${url}) ---\n${text}`);
                    } else {
                        // 將失敗的原始網址加入陣列，讓 AI 稍後自行嘗試
                        sourceUrlsForAI.push(url);
                    }
                });
            }

            const promptText = `
# 角色 (Persona)
你是一位頂尖的「彰化師範大學獎學金公告分析專家」。你的風格是專業、精確且以學生為中心。你的任務是將一篇關於獎學金的公告，轉換成一段重點突出、視覺清晰的 HTML 公告，並提取結構化資料。你只須關注與彰師大「大學部」及「碩士班」學生相關的資訊，並嚴格遵循所有規則。

# 核心任務 (Core Task)
你的任務是根據下方提供的「公告全文」，執行以下兩項任務，並將結果合併在一個**單一的 JSON 物件**中回傳。

## 任務一：提取結構化資料 (JSON Extraction)
提取公告中的關鍵資訊，並以一個嚴格的 JSON 物件格式回傳。

### 欄位規則 (Field Rules)
- **不確定性原則**：若資訊未提及或不明確，**必須**回傳 \`null\`，**禁止**自行猜測。
- **日期格式**：所有日期欄位格式必須是 \`YYYY-MM-DD\`。民國年 + 1911 即為西元年。
- **欄位列表**：
    1.  \`title\` (string | null): 公告的**簡短**標題，必須包含**提供單位**和**獎學金名稱**。例如：「國際崇她社『崇她獎』獎學金」。
    2.  \`category\` (string | null): 根據下方的「代碼定義」從 'A'~'E' 中選擇一個。
    3.  \`application_start_date\` (string | null): **申請開始日期**。
    4.  \`application_end_date\` (string | null): **申請結止日期**，格式必須是 'YYYY-MM-DD' 。若只提及月份，以該月最後一天為準。若為區間，以**結束日期**為準，備註: 民國年 + 1911 即為西元年。
    5.  \`target_audience\` (string | null): **目標對象**。**此欄位必須是 HTML 格式**，並遵循下方的「視覺化與樣式指導」為關鍵字上色。
    6.  \`application_limitations\` (string | null): **兼領限制**。若明確提及**不行**兼領，回傳 'N'，否則一律回傳 'Y'。
    7.  \`submission_method\` (string | null): **送件方式**。簡要說明最終的送件管道。
    8.  \`external_urls\` (array of objects | []): **所有相關網址**。將所有找到的 URL 整理成一個物件陣列，格式為 \`[{ "url": "https://..." }]\`。若無則回傳空陣列 \`[]\`。
    9.  \`summary\` (string | null): **公告摘要**。**此欄位必須是 HTML 格式**，並遵循下方的「視覺化與樣式指導」為關鍵字上色。
    
## 任務二：生成 HTML 重點摘要 (HTML Summary Generation)
根據你分析的內容，生成一份專業、條理分明的 HTML 格式重點摘要。

### 內容與結構指導
- **摘要必須包含**：申請期限、申請資格、獎助金額、應繳文件、其他注意事項。
- **表格優先**：當資訊具有「項目-內容」的對應關係資訊時，**優先使用 \`<table>\`** 以提升閱讀性。

### 視覺化與樣式指導 (適用於 summary 和 target_audience)
- **多色彩重點標記**：
    - **金額、日期、名額等數字類關鍵字**: \`<span style="color: #D6334C; font-weight: bold;">\`
    - **身份、成績等申請條件**: \`<span style="color: #F79420; font-weight: bold;">\`
    - **所有小標題**: \`<h4 style="color: #008DD5; margin-top: 1.5em; margin-bottom: 0.75em;">\`
- \`summary\` 的內容必須放在 JSON 物件的 \`summary\` (string) 鍵中。

# 獎助學金代碼定義 (Category Definitions)
- **A**: 各縣市政府獎助學金
- **B**: 縣市政府以外之各級公家機關及公營單位獎助學金
- **C**: 宗親會及民間各項指定身分獎助學金 (指定姓名、籍貫、學系等)
- **D**: 非公家機關或其他無法歸類的獎助學金
- **E**: 獎學金得獎名單公告

# 最終輸出規則
- **你的回覆必須是、也只能是一個 JSON 物件**，不含任何 Markdown 標記。
- 請嚴格模仿下方範例的 JSON 結構和 HTML 風格。

# 輸出格式與範例 (Output Format & Example)
\`\`\`json
{
  "title": "國際蘭馨交流協會『讓夢想起飛』獎學金",
  "category": "C",
  "application_start_date": null,
  "application_end_date": "2025-07-23",
  "target_audience": "<ul><li>國內各大學日間部、進修學士班之<span style=\\"color: #F79420; font-weight: bold;\\">在學女學生</span>。</li><li>歷年學業平均成績達 <span style=\\"color: #F79420; font-weight: bold;\\">70分</span>。</li></ul>",
  "application_limitations": "N",
  "submission_method": "送件至生輔組或將申請資料寄送至承辦人員信箱: act5718@gmail.com",
  "external_urls": [{ "url": "https://example.com/scholarship-info" }],
  "summary": "<h4 style=\"color: #008DD5; margin-top: 1.5em; margin-bottom: 0.75em;\">申請期限與方式</h4><p>親送或寄送郵件至生輔組承辦人員，由學校代為辦理，截止日期為 <span style=\"color: #D6334C; font-weight: bold;\">2025年7月23日</span>。</p><h4 style=\"color: #008DD5; margin-top: 1.5em; margin-bottom: 0.75em;\">申請資格</h4><ul><li>家境清寒且就讀<span style=\"color: #F79420; font-weight: bold;\">國立大學</span>之<span style=\"color: #F79420; font-weight: bold;\">績優女學生</span>（不限年級）。</li><li>在校學業平均成績達 <span style=\"color: #F79420; font-weight: bold;\">70分</span> 以上，且未受小過以上處分。</li></ul><h4 style=\"color: #008DD5; margin-top: 1.5em; margin-bottom: 0.75em;\">獎助金額</h4><p>依申請年級不同，提供相對應的學費補助，詳情如下：</p><table style=\"width: 100%; border-collapse: collapse; margin-top: 0.5em;\"><thead><tr style=\"background-color: #f2f2f2;\"><th style=\"padding: 8px; border: 1px solid #ddd; text-align: left;\">適用對象</th><th style=\"padding: 8px; border: 1px solid #ddd; text-align: left;\">補助內容</th></tr></thead><tbody><tr><td style=\"padding: 8px; border: 1px solid #ddd;\"><span style=\"color: #F79420; font-weight: bold;\">大一新生及大三學生</span></td><td style=\"padding: 8px; border: 1px solid #ddd;\">通過審查後，補助<span style=\"color: #D6334C; font-weight: bold;\">兩年</span>學雜費</td></tr><tr><td style=\"padding: 8px; border: 1px solid #ddd;\"><span style=\"color: #F79420; font-weight: bold;\">大二女學生</span></td><td style=\"padding: 8px; border: 1px solid #ddd;\">通過審查後，補助<span style=\"color: #D6334C; font-weight: bold;\">一年</span>學雜費</td></tr></tbody></table><p style=\"margin-top: 0.5em;\">註：已受補助學生可持續獲得補助至其大四學年，但須符合每階段資格審查標準。</p><h4 style=\"color: #008DD5; margin-top: 1.5em; margin-bottom: 0.75em;\">申請應繳文件</h4><table style=\"width: 100%; border-collapse: collapse; margin-top: 0.5em;\"><thead><tr style=\"background-color: #f2f2f2;\"><th style=\"padding: 8px; border: 1px solid #ddd; text-align: left;\">文件項目</th><th style=\"padding: 8px; border: 1px solid #ddd; text-align: left;\">備註</th></tr></thead><tbody><tr><td style=\"padding: 8px; border: 1px solid #ddd;\">1. 全家人口戶籍謄本</td><td style=\"padding: 8px; border: 1px solid #ddd;\">-</td></tr><tr><td style=\"padding: 8px; border: 1px solid #ddd;\">2. 全家人口所得及財產資料</td><td style=\"padding: 8px; border: 1px solid #ddd;\">請向國稅局申請</td></tr><tr><td style=\"padding: 8px; border: 1px solid #ddd;\">3. 最近學期成績單</td><td style=\"padding: 8px; border: 1px solid #ddd;\">-</td></tr><tr><td style=\"padding: 8px; border: 1px solid #ddd;\">4. 大學完整學業成績單與操行紀錄</td><td style=\"padding: 8px; border: 1px solid #ddd;\">適用於<span style=\"color: #F79420; font-weight: bold;\">大三以上</span>學生</td></tr><tr><td style=\"padding: 8px; border: 1px solid #ddd;\">5. 相關證明文件</td><td style=\"padding: 8px; border: 1px solid #ddd;\">如身心障礙手冊、重大傷病卡等 (無則免附)</td></tr></tbody></table><h4 style=\"color: #008DD5; margin-top: 1.5em; margin-bottom: 0.75em;\">其他注意事項</h4><p>申請人家庭若有以下任一情況，則<span style=\"color: #D6334C; font-weight: bold;\">不符合</span>清寒補助資格：</p><ul><li>全戶存款本金合計超過 <span style=\"color: #D6334C; font-weight: bold;\">10萬元</span>。</li><li>全戶土地及房屋公告現值合計超過 <span style=\"color: #D6334C; font-weight: bold;\">100萬元</span>（自用住宅不在此限）。</li><li>其他情況如休學、畢業或家庭經濟狀況已顯著改善者。</li></ul>"
}
\`\`\`

# 公告全文 (Source Text)
---
請分析以下資訊：
${scrapedContentsForAI.length > 0 ? `\n# 已爬取的網址內容:\n${scrapedContentsForAI.join('\n\n')}` : ''}
${sourceUrlsForAI.length > 0 ? `\n# 以下網址無法爬取，請直接分析:\n${sourceUrlsForAI.join('\n')}` : ''}
${selectedFiles.length > 0 ? `\n# 檔案資料來源` : ''}
`;
            parts.push({ text: promptText });
            // 確保只處理和附加 AI 支援的檔案
            if (filesForAI.length > 0) {
                const filePromises = filesForAI.map(file => fileToGenerativePart(file));
                const fileParts = await Promise.all(filePromises);
                parts.push(...fileParts);
                showToast(`已附加 ${filesForAI.length} 個檔案進行 AI 分析`, "info");
            }

            setLoadingText("AI 分析中，請稍候...");

            // 6. 叫 Google Gemini AI
            const result = await modelRef.current.generateContent({ contents: [{ parts }] });
            const response = result.response;

            let aiResponse;
            try {
                // 解析 AI 回傳的 JSON 字串
                aiResponse = JSON.parse(response.text());
            } catch (e) {
                console.error("AI 回應的原始文字:", response.text());
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
            };

            const { data: announcement, error: announcementError } = await supabase
                .from('announcements')
                .insert(dataToInsert)
                .select().single();
            if (announcementError) throw announcementError;

            if (uploadedFilesData.length > 0) {
                const attachments = uploadedFilesData.map(fileInfo => ({
                    announcement_id: announcement.id,
                    file_name: fileInfo.originalName,
                    stored_file_path: fileInfo.path,
                    file_size: fileInfo.size,
                    mime_type: fileInfo.mimeType,
                }));
                const { error: attachmentError } = await supabase.from('attachments').insert(attachments);
                if (attachmentError) throw attachmentError;
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
                            <h3 className="text-lg font-semibold text-gray-800">上傳檔案或提供網址</h3>
                            <FileUploadArea selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} disabled={isLoading} showToast={showToast} />
                            <UrlInputArea urls={urls} setUrls={setUrls} disabled={isLoading} showToast={showToast} />
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 p-8 bg-gray-50/50 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">手動輸入模式</h3>
                            <p>請點擊「下一步」開始手動填寫公告內容。</p>
                        </div>
                    )}
                </div>
            );
        }
        if (currentStep === 1) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <Loader2 className="animate-spin h-12 w-12 text-indigo-600 mb-4" />
                    <p className="text-lg font-semibold text-gray-900">{loadingText}</p>
                    <p className="text-sm text-gray-500 mt-2">請稍候，AI 正在為您生成公告內容...</p>
                </div>
            );
        }
        if (currentStep === 2) {
            return (
                <div className="space-y-6 max-w-4xl mx-auto">
                    <div>
                        <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-1.5">
                            公告標題 <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input type="text" id="title" name="title" className={inputStyles} value={formData.title} onChange={handleChange} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div><label htmlFor="is_active" className="block text-sm font-semibold text-gray-700 mb-1.5">公告狀態</label><select id="is_active" name="is_active" className={inputStyles} value={formData.is_active} onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}><option value={true}>上架</option><option value={false}>下架</option></select></div>
                        <div><label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-1.5">獎學金分類</label><select id="category" name="category" className={inputStyles} value={formData.category} onChange={handleChange}><option value="">請選擇</option><option value="A">A：各縣市政府獎學金</option><option value="B">B：縣市政府以外之各級公家機關及公營單位獎學金</option><option value="C">C：宗教及民間各項指定身分獎學金</option><option value="D">D：非公家機關或其他無法歸類的獎助學金</option><option value="E">E：本校獲配推薦名額獎助學金</option><option value="F">F：校外獎助學金得獎公告</option><option value="G">G：校內獎助學金</option></select></div>
                        <div><label htmlFor="application_start_date" className="block text-sm font-semibold text-gray-700 mb-1.5">申請開始日期</label><input type="date" id="application_start_date" name="application_start_date" className={inputStyles} value={formData.application_start_date} onChange={handleChange} /></div>
                        <div><label htmlFor="application_end_date" className="block text-sm font-semibold text-gray-700 mb-1.5">公告結束日期</label><input type="date" id="application_end_date" name="application_end_date" className={inputStyles} value={formData.application_end_date} onChange={handleChange} /></div>
                        <div><label htmlFor="submission_method" className="block text-sm font-semibold text-gray-700 mb-1.5">送件方式</label><input type="text" id="submission_method" name="submission_method" className={inputStyles} value={formData.submission_method} onChange={handleChange} /></div>
                        <div>
                            <label htmlFor="application_limitations" className="block text-sm font-semibold text-gray-700 mb-1.5">兼領限制</label>
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
                    </div>

                    <div className="flex flex-col min-h-[250px]">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex-shrink-0">適用對象</label>
                        <div className="relative flex-grow">
                            <TinyMCE value={formData.target_audience} onChange={handleTargetAudienceChange} disabled={isLoading} />
                        </div>
                    </div>

                    <div className="flex flex-col min-h-[400px]">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex-shrink-0">
                            公告摘要 <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="relative flex-grow">
                            <TinyMCE value={formData.summary} onChange={handleSummaryChange} disabled={isLoading} />
                        </div>
                    </div>

                    <div className="p-4 bg-slate-500/5 rounded-lg border">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">附件與連結</label>
                        <FileUploadArea selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} disabled={isLoading} showToast={showToast} />
                        <div className="mt-4 space-y-2">
                            <label className="block text-sm font-medium text-gray-600 flex items-center gap-2"><LinkIcon size={16} />外部參考連結</label>
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
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 pt-16">
                        <motion.div
                            initial={{ scale: 0.95, y: 50, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 50, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="relative bg-white/85 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden border border-white/20"
                            style={{ height: 'calc(100vh - 10rem)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-5 border-b border-black/10 flex justify-between items-center flex-shrink-0">
                                <h2 className="text-lg font-bold text-gray-800">新增公告</h2>
                                <button
                                    onClick={() => {
                                        if (window.confirm('確認關閉公告編輯模組嗎？如尚未儲存將丟失此編輯紀錄！')) {
                                            onClose();
                                        }
                                    }}
                                    disabled={isLoading}
                                    className="text-gray-400 hover:text-gray-600 p-2 rounded-full"
                                >
                                    <X size={20} />
                                </button>
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
                                            返回上一步
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
                                            {inputMode === 'ai' ? '開始 AI 分析' : '下一步'}
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
                                            <span>儲存並發布</span>
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