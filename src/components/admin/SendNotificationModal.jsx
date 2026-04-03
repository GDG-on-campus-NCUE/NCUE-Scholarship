'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TinyMCE from '../TinyMCE';
import { X, Send, Loader2, Edit3, Eye } from 'lucide-react';
import Button from '../ui/Button';

export default function SendNotificationModal({ isOpen, onClose, user, onConfirm, isSending, targetCount, targetLabel = '所有使用者' }) {
    const [emailData, setEmailData] = useState({ subject: '', body: '' });
    const [activeTab, setActiveTab] = useState('edit'); // 'edit' or 'preview'
    const isBulkSend = !user;

    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('modal-open');
            setActiveTab('edit'); // 重置分頁
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => document.body.classList.remove('modal-open');
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            if (isBulkSend) {
                setEmailData({
                    subject: `[校外獎助學金平台] 重要公告`,
                    body: `<p>親愛的同學，您好：</p><p>這是一封來自「彰師生輔組校外獎助學金資訊平台」的系統通知信。</p><p>...</p><p>若有任何疑問，歡迎隨時與我們聯繫。<br>彰師大 學務處生輔組 敬上</p>`
                });
            }
            else if (user) {
                setEmailData({
                    subject: `[重要通知] 主旨`,
                    body: `<p>親愛的 ${user.name || 'User'} 同學，您好：</p><p>...</p><p>若有任何疑問，歡迎隨時與我們聯繫。<br>彰師大 學務處生輔組 敬上</p>`
                });
            }
        }
    }, [isOpen, user, isBulkSend]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEmailData(prev => ({ ...prev, [name]: value }));
    };

    const handleBodyChange = useCallback((content) => {
        setEmailData(prev => ({ ...prev, body: content }));
    }, []);

    const handleConfirmClick = () => {
        onConfirm({
            subject: emailData.subject,
            htmlContent: emailData.body
        });
    };

    const currentYear = new Date().getFullYear();
    const emailPreviewHtml = `
    <!DOCTYPE html>
    <html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>彰師校外獎助學金資訊平台</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap');
        body { margin: 0; padding: 0; background-color: transparent; font-family: 'Noto Sans TC', 'Microsoft JhengHei', sans-serif; -webkit-font-smoothing: antialiased; }
        table { border-collapse: collapse; width: 100%; }
        .container { background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; margin: 0 auto; max-width: 600px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 32px; text-align: center; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 700; }
        .content { padding: 32px 40px; color: #374151; }
        .content h2 { color: #1f2937; margin-top: 0; margin-bottom: 24px; font-size: 22px; font-weight: 700; text-align: left; }
        .html-body { font-size: 16px; line-height: 1.7; color: #374151; word-break: break-word; }
        .html-body * { max-width: 100%; }
        .footer { padding: 24px 40px; font-size: 12px; text-align: center; color: #9ca3af; background-color: #f9fafb; border-top: 1px solid #e5e7eb; }
        .footer a { color: #6b7280; text-decoration: none; }
        @media screen and (max-width: 600px) {
            .header { padding: 24px; } .header h1 { font-size: 22px; }
            .content { padding: 24px 20px; } .content h2 { font-size: 20px; }
        }
    </style></head><body>
    <table class="wrapper" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="padding: 12px 0;">
    <table class="container" border="0" cellpadding="0" cellspacing="0">
        <tr><td class="header"><h1>生輔組校外獎助學金資訊平台</h1></td></tr>
        <tr><td class="content">
            <h2>${emailData.subject || '(預覽標題)'}</h2>
            <div class="html-body">${emailData.body || '(預覽內文)'}</div>
        </td></tr>
        <tr><td class="footer">
            <p style="margin: 0 0 12px;"><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" target="_blank">生輔組獎助學金資訊平台</a> • <a href="https://stuaffweb.ncue.edu.tw/" target="_blank">生輔組首頁</a></p>
            <p style="margin: 0 0 5px;">© ${currentYear} 彰師生輔組校外獎助學金資訊平台. All Rights Reserved.</p>
            <p style="margin: 0;">此為系統自動發送之信件，請勿直接回覆。</p>
        </td></tr>
    </table></td></tr></table></body></html>`;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex justify-center items-center p-0 sm:p-4 cursor-pointer"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: 20, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col h-[95vh] sm:h-[85vh] max-h-[900px] overflow-hidden border border-gray-200 mt-auto sm:mt-0 cursor-default"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-4 sm:p-5 border-b border-gray-100 flex justify-between items-center flex-shrink-0 bg-white">
                             <h2 className="text-base sm:text-lg font-bold text-gray-800 truncate pr-2">
                                {isBulkSend
                                    ? `寄送群體通知 (${targetCount} 人)`
                                    : `寄送通知給 ${user?.name}`
                                }
                            </h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"><X size={20} /></button>
                        </div>

                        {/* Mobile Tabs */}
                        <div className="flex lg:hidden border-b border-gray-100 bg-gray-50/50">
                            <button 
                                onClick={() => setActiveTab('edit')}
                                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'edit' ? 'border-indigo-500 text-indigo-600 bg-white' : 'border-transparent text-gray-500'}`}
                            >
                                <Edit3 size={16} /> 編輯內容
                            </button>
                            <button 
                                onClick={() => setActiveTab('preview')}
                                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'preview' ? 'border-indigo-500 text-indigo-600 bg-white' : 'border-transparent text-gray-500'}`}
                            >
                                <Eye size={16} /> 預覽效果
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto min-h-0 bg-white p-4 sm:p-6">
                            <div className={`flex flex-col h-full gap-6 ${activeTab === 'preview' ? 'hidden lg:flex' : 'flex'}`}>
                                {/* Subject Input */}
                                <div className="flex-shrink-0">
                                    <label htmlFor="subject" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">郵件主旨</label>
                                    <input id="subject" type="text" name="subject" value={emailData.subject} onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl shadow-sm transition-all duration-300
                                            focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-medium" />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
                                    {/* Editor Section */}
                                    <div className={`flex flex-col flex-1 min-h-0 ${activeTab === 'preview' ? 'hidden lg:flex' : 'flex'}`}>
                                        <label htmlFor="body" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex-shrink-0">郵件內文</label>
                                        <div className="relative flex-grow min-h-[400px] lg:min-h-0 h-full overflow-hidden">
                                            <TinyMCE
                                                value={emailData.body}
                                                onChange={handleBodyChange}
                                                disabled={isSending}
                                                init={{
                                                    height: "100%",
                                                    plugins: 'lists link image table code help wordcount',
                                                    toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist outdent indent | link image | code',
                                                    content_style: 'body { font-family: "Noto Sans TC", sans-serif; font-size: 14px; }',
                                                    statusbar: true,
                                                    branding: false,
                                                    resize: false,
                                                    autoresize_bottom_margin: 0 // Ensure no extra margin
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Preview Section (Desktop) */}
                                    <div className="hidden lg:flex flex-col flex-1 min-h-0">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex-shrink-0">即時預覽</label>
                                        <div className="flex-grow bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                                            <iframe
                                                srcDoc={emailPreviewHtml}
                                                className="w-full h-full border-0"
                                                title="Email Preview"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Preview View */}
                            <div className={`h-full flex flex-col ${activeTab === 'preview' ? 'flex lg:hidden' : 'hidden'}`}>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex-shrink-0">預覽效果</label>
                                <div className="flex-grow bg-gray-100 rounded-xl overflow-hidden border border-gray-200 min-h-[400px]">
                                    <iframe
                                        srcDoc={emailPreviewHtml}
                                        className="w-full h-full border-0"
                                        title="Email Preview Mobile"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 sm:p-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 flex-shrink-0">
                            <p className="text-xs text-gray-400 font-medium hidden sm:block">
                                郵件將以密件副本 (BCC) 方式分批寄送給收件者。
                            </p>
                            <div className="flex w-full sm:w-auto gap-3">
                                <button onClick={onClose} className="sm:hidden flex-1 px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors border border-gray-200 rounded-lg">取消</button>
                                <button
                                    onClick={handleConfirmClick}
                                    disabled={isSending || !emailData.subject || !emailData.body}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 sm:py-2 text-sm font-semibold rounded-lg border border-indigo-200 bg-transparent text-indigo-600 transition-all duration-300 ease-in-out transform hover:bg-indigo-100 hover:text-indigo-700 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 disabled:transform-none disabled:shadow-none"
                                >
                                    {isSending ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Send size={18} />
                                    )}
                                    <span>{isSending ? '郵件寄送中...' : '確認寄送'}</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
