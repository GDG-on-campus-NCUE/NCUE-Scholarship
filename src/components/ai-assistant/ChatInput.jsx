'use client';

import { Send, Trash2, Mail, Sparkles } from 'lucide-react';

const ChatInput = ({ 
    input = '',
    handleInputChange,
    handleSubmit,
    onClear, 
    isLoading, 
    onSupportRequest, 
    hasStarted 
}) => {
    
    const onFormSubmit = (e) => {
        e?.preventDefault();
        if (!input?.trim() || isLoading) return;
        
        // 安全呼叫 handleSubmit
        if (typeof handleSubmit === 'function') {
            handleSubmit(e);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (input?.trim() && !isLoading) {
                onFormSubmit(e);
            }
        }
    };

    // Auto-resize textarea height
    const adjustHeight = (target) => {
        if (!target) return;
        target.style.height = 'auto';
        target.style.height = Math.min(target.scrollHeight, 128) + 'px';
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-2 sm:space-y-4 px-2 sm:px-4 pb-2 sm:pb-4">
            {/* Action Buttons */}
            <div className="flex justify-center gap-2 sm:gap-3 transition-opacity duration-500 ease-in-out">
                 {hasStarted && (
                    <button
                        type="button"
                        onClick={onSupportRequest}
                        disabled={isLoading}
                        className="group flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium
                                    bg-white/80 border border-indigo-200 text-indigo-600 backdrop-blur-sm
                                    transition-all hover:bg-indigo-50 hover:border-indigo-300 hover:shadow-sm
                                    disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Mail size={12} className="sm:w-[13px] sm:h-[13px]" />
                        <span>專人協助</span>
                    </button>
                )}
                {hasStarted && (
                    <button
                        type="button"
                        onClick={onClear}
                        disabled={isLoading}
                        className="group flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium
                                    bg-white/80 border border-gray-200 text-gray-500 backdrop-blur-sm
                                    transition-all hover:bg-red-50 hover:border-red-200 hover:text-red-600 hover:shadow-sm
                                    disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Trash2 size={12} className="sm:w-[13px] sm:h-[13px]" />
                        <span>清除紀錄</span>
                    </button>
                )}
            </div>

            {/* Input Form */}
            <form 
                onSubmit={onFormSubmit} 
                className={`relative flex items-end gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-[24px] bg-white border transition-all duration-300 shadow-sm
                    ${isLoading ? 'border-gray-200 bg-gray-50' : 'border-gray-200 hover:border-gray-300 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:shadow-md'}
                `}
            >
                <div className="pl-2 sm:pl-3 pb-2 sm:pb-3 text-indigo-500">
                    <Sparkles size={18} className={`sm:w-5 sm:h-5 ${isLoading ? 'animate-pulse' : ''}`} />
                </div>

                <textarea
                    value={input}
                    onChange={(e) => {
                        // 安全呼叫 handleInputChange
                        if (typeof handleInputChange === 'function') {
                            handleInputChange(e);
                        }
                        adjustHeight(e.target);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="請輸入您的問題..."
                    rows={1}
                    className="w-full max-h-32 bg-transparent border-0 py-2 sm:py-3 px-1 sm:px-2 text-sm sm:text-base text-gray-800 placeholder-gray-400 focus:ring-0 focus:outline-none outline-none resize-none custom-scrollbar leading-relaxed"
                    style={{ minHeight: '38px' }}
                />

                <button
                    type="submit"
                    disabled={isLoading || !input?.trim()}
                    className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 mb-0.5 sm:mb-1 flex items-center justify-center rounded-full bg-indigo-600 text-white transition-all 
                        hover:bg-indigo-700 active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:active:scale-100 relative"
                >
                    <Send size={16} className={`sm:w-[18px] sm:h-[18px] ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`} />
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                        </div>
                    )}
                </button>
            </form>
            
            <p className="text-center text-[10px] text-gray-400 select-none">
                AI 生成內容僅供參考，請務必查閱原始公告確認詳情。
            </p>
        </div>
    );
};

export default ChatInput;