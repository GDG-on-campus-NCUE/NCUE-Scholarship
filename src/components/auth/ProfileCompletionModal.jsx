"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, AlertCircle, Save, User, IdCard, LogOut, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfileCompletionModal() {
    const { user, needsProfileCompletion, updateProfile, signOut } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        student_id: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.profile?.username || user.user_metadata?.full_name || user.user_metadata?.name || '',
                student_id: user.profile?.student_id || ''
            });
        }
    }, [user]);

    useEffect(() => {
        if (needsProfileCompletion) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => document.body.classList.remove('modal-open');
    }, [needsProfileCompletion]);

    if (!needsProfileCompletion) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        if (!formData.name.trim()) {
            setErrorMessage('請填寫姓名');
            return;
        }
        if (!formData.student_id.trim()) {
            setErrorMessage('請填寫學號');
            return;
        }

        // 驗證學號格式：首位字母 + 7位數字
        const studentIdRegex = /^[A-Z][0-9]{7}$/;
        if (!studentIdRegex.test(formData.student_id)) {
            setErrorMessage('學號格式錯誤，請輸入正確格式 (e.g. S1354000)');
            return;
        }

        setIsSubmitting(true);
        try {
            // 檢查學號是否重複
            const checkRes = await fetch('/api/check-duplicate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    student_id: formData.student_id,
                    exclude_id: user.id
                })
            });
            const checkData = await checkRes.json();

            if (checkData.studentIdExists) {
                setErrorMessage('此學號已有其他帳戶紀錄。請先註銷原帳戶後再重新登入，或聯繫管理員。');
                setIsSubmitting(false);
                return;
            }

            const result = await updateProfile(formData);
            if (!result.success) {
                setErrorMessage(result.error || '更新失敗，請稍後再試');
            }
        } catch (err) {
            setErrorMessage('系統錯誤，請聯繫管理員');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[2000] flex items-start md:items-center justify-center p-4 overflow-y-auto pt-6 md:pt-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" 
                />
                
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 select-none my-auto"
                >
                    <div className="p-5 sm:p-8 pt-8 sm:pt-10">
                        <div className="text-center mb-6 sm:mb-8">
                            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-indigo-50 text-indigo-600 mb-3 sm:mb-4">
                                <Info className="w-6 h-6 sm:w-8 sm:h-8" />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">使用者基本資料</h2>
                            <p className="text-slate-500 text-xs sm:text-sm mt-1.5 sm:mt-2 font-medium px-2">
                                為了進行身分驗證，請核對您的帳號資訊，並務必提供正確資料。
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                            {errorMessage && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-start gap-3 p-3 sm:p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-sm"
                                >
                                    <AlertCircle className="h-5 w-5 shrink-0" />
                                    <p className="font-medium leading-tight">{errorMessage}</p>
                                </motion.div>
                            )}

                            <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                                    <User className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                                    姓名
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-semibold text-slate-800 text-sm sm:text-base"
                                    placeholder="請輸入您的真實姓名"
                                />
                            </div>

                            <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                                    <IdCard className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                                    學號
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.student_id}
                                    onChange={(e) => {
                                        let val = e.target.value.toUpperCase().slice(0, 8);
                                        setFormData({ ...formData, student_id: val });
                                    }}
                                    placeholder="e.g. S1354000"
                                    maxLength={8}
                                    className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-semibold text-slate-800 text-sm sm:text-base"
                                />
                            </div>

                            <div className="pt-2 sm:pt-4 space-y-3 sm:space-y-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full flex items-center justify-center gap-2 sm:gap-3 py-3.5 sm:py-4 bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-400 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-[0.98] group text-sm sm:text-base"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="animate-spin h-5 w-5" />
                                    ) : (
                                        <Save className="h-5 w-5 transition-transform group-hover:scale-110" />
                                    )}
                                    <span>儲存並進入平台</span>
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={() => signOut()}
                                    className="w-full py-2 text-slate-400 hover:text-red-500 text-[13px] sm:text-sm font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    登出
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="bg-slate-50 p-4 sm:p-6 border-t border-slate-100">
                        <div className="flex gap-2 sm:gap-3">
                            <Info className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-slate-400 shrink-0 mt-0.5" />
                            <p className="text-[10px] sm:text-[11px] text-slate-400 leading-relaxed font-medium">
                                此資訊將用於獎學金資格審核與身分識別，請確保填寫正確。系統將嚴格遵守個資保護政策，您的資料僅供本平台內部業務使用。
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
