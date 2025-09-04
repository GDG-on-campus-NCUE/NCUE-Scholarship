'use client';

import { useState } from 'react';
import { Send, Trash2, Mail } from 'lucide-react';

const ChatInput = ({ onSubmit, onClear, isLoading, onSupportRequest, hasStarted }) => {
    const [input, setInput] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSubmit(input);
            setInput('');
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-4">
            {hasStarted && (
                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={onSupportRequest}
                        disabled={isLoading}
                        title="AI 無法解決？尋求承辦人員協助"
                        className="group flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-semibold
                                    border border-purple-300 text-purple-600 
                                    transition-all duration-300 ease-in-out shadow-sm 
                                    hover:bg-purple-50 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20
                                    disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-400 disabled:shadow-none
                                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <Mail size={14} />
                        <span>AI 無法解決？尋求承辦人員協助</span>
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="relative flex items-center w-full">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
                    <button
                        type="button"
                        onClick={onClear}
                        disabled={isLoading}
                        title="刪除對話紀錄"
                        className="group flex items-center space-x-1.5 rounded-full h-10 px-3 text-xs text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                        <Trash2 size={16} />
                        <span className="hidden sm:inline">刪除紀錄</span>
                    </button>
                </div>

                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="詢問獎學金相關問題..."
                    disabled={isLoading}
                    className="w-full bg-white border border-gray-200 rounded-full py-4 pl-12 sm:pl-28 pr-14 text-base text-gray-800 placeholder-gray-400 transition-shadow duration-300 shadow-md focus:outline-none input-focus-glow"
                />

                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex-shrink-0 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:scale-90 hover:from-purple-600 hover:to-indigo-600 focus:outline-none focus:ring-4 focus:ring-purple-300"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default ChatInput;