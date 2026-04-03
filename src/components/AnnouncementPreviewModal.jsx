import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2 } from 'lucide-react';
import EmailPreview from './previews/EmailPreview';
import LinePreview from './previews/LinePreview';

export default function AnnouncementPreviewModal({ isOpen, type, announcement, onConfirm, onClose }) {
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => document.body.classList.remove('modal-open');
    }, [isOpen]);

    const handleConfirm = async () => {
        setIsSending(true);
        await onConfirm();
        setIsSending(false);
    };

    if (!announcement) return null;

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
                        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col h-[95vh] sm:h-[85vh] max-h-[900px] overflow-hidden border border-gray-200 mt-auto sm:mt-0 cursor-default"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-4 sm:p-5 border-b border-gray-100 flex justify-between items-center flex-shrink-0 bg-white">
                            <h2 className="text-base sm:text-lg font-bold text-gray-800">
                                {type === 'email' ? 'Email 通知預覽' : 'LINE 通知預覽'}
                            </h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"><X size={20} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50/30 p-4 sm:p-8">
                            <div className="h-full">
                                {type === 'email' && <EmailPreview announcement={announcement} />}
                                {type === 'line' && <LinePreview announcement={announcement} />}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 sm:p-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 flex-shrink-0">
                            <p className="text-xs text-gray-400 font-medium hidden sm:block">
                                郵件將以密件副本 (BCC) 方式分批寄送給收件者。
                            </p>
                            <div className="flex w-full sm:w-auto gap-3">
                                <button onClick={onClose} className="sm:hidden flex-1 px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors border border-gray-200 rounded-lg text-center">取消</button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isSending}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-10 py-3 sm:py-2 text-sm font-semibold rounded-lg border border-indigo-200 bg-transparent text-indigo-600 transition-all duration-300 ease-in-out transform hover:bg-indigo-100 hover:text-indigo-700 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 disabled:transform-none disabled:shadow-none"
                                >
                                    {isSending ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Send size={18} />
                                    )}
                                    <span>
                                        {isSending ? '發送中...' : `確認寄送`}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
