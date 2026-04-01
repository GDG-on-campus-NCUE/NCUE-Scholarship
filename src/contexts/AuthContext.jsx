"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client'; // Direct access for profile creation
import { authService } from '@/lib/supabase/auth';

const AuthContext = createContext({});

const IDLE_TIMEOUT = 30 * 60; // 30 分鐘 (秒)

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // 自動登出相關狀態
    const [timeLeft, setTimeLeft] = useState(IDLE_TIMEOUT);
    const lastActivity = useRef(Date.now());
    const timerRef = useRef(null);

    const signOut = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await authService.signOut();
            if (result.success) {
                setUser(null);
                setTimeLeft(IDLE_TIMEOUT);
                // 強制跳轉至首頁並重整，清除所有前端狀態與元件快取，避免殘留的 Auth Guard 造成無限轉圈
                window.location.href = '/';
            } else {
                setError(result.error);
            }
            return result;
        } finally {
            setLoading(false);
        }
    }, []);

    // 更新活動時間
    const resetIdleTimer = useCallback(() => {
        lastActivity.current = Date.now();
        setTimeLeft(IDLE_TIMEOUT);
    }, []);

    useEffect(() => {
        // Fetches the user and their profile, setting the state.
        const getAndSetUser = async () => {
            const result = await authService.getCurrentUser();
            if (result.success && result.user) {
                setUser({
                    ...result.user,
                    needsProfileCompletion: !result.user.profile?.student_id,
                    hasAgreedToTerms: !!result.user.profile?.has_agreed_to_terms
                });
            }
            setLoading(false);
        };

        getAndSetUser();

        // The core logic for handling auth state changes.
        const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                const currentUser = session.user;
                const email = currentUser.email;

                // 1. 先根據 Email 檢查是否有現有 Profile (用於關聯 Google 帳號與舊有 Email 帳號)
                const { data: existingProfileByEmail } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('email', email)
                    .maybeSingle();

                if (existingProfileByEmail && existingProfileByEmail.id !== currentUser.id) {
                    // 如果 Email 已存在但 ID 不同，將舊 Profile 關聯到新 ID
                    console.log('Linking existing profile to new Google ID...');
                    await supabase
                        .from('profiles')
                        .update({ id: currentUser.id })
                        .eq('id', existingProfileByEmail.id);
                }

                // 2. 檢查目前 ID 是否有 Profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', currentUser.id)
                    .single();

                // If no profile exists and it's a social login or we have metadata
                if (!profile) {
                    const name = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || '';
                    await supabase.from('profiles').insert({
                        id: currentUser.id,
                        username: name,
                        email: email,
                        role: 'user',
                        has_agreed_to_terms: false
                    });

                    if (name) {
                        await supabase.auth.updateUser({
                            data: { display_name: name },
                        });
                    }
                }

                const { success, user: userData } = await authService.getCurrentUser();
                if (success && userData) {
                    setUser({
                        ...userData,
                        needsProfileCompletion: !userData.profile?.student_id,
                        hasAgreedToTerms: !!userData.profile?.has_agreed_to_terms
                    });
                }
                setError(null);
                resetIdleTimer();

            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setError(null);
                // 當檢測到登出事件時（可能是其他分頁觸發），強制跳轉至首頁並重整，確保所有分頁都能同步登出狀態
                if (typeof window !== 'undefined') {
                    // 只有當不在登入頁等公開頁面時才強制跳轉，避免干擾正常的登入流程
                    const publicPaths = ['/login', '/forgot-password', '/reset-password', '/terms-and-privacy', '/auth/callback'];
                    const isPublicPath = publicPaths.some(path => window.location.pathname.startsWith(path)) || window.location.pathname === '/';
                    
                    if (!isPublicPath) {
                        window.location.href = '/';
                    }
                }
            }

            setLoading(false);
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, [resetIdleTimer]);

    // 監聽使用者行為與倒數計時器
    useEffect(() => {
        if (!user) return;

        const handleUserActivity = () => resetIdleTimer();

        // 監聽行為
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(name => document.addEventListener(name, handleUserActivity));

        // 每秒檢查一次
        timerRef.current = setInterval(() => {
            const now = Date.now();
            const diff = Math.floor((now - lastActivity.current) / 1000);
            const remaining = IDLE_TIMEOUT - diff;

            if (remaining <= 0) {
                clearInterval(timerRef.current);
                signOut();
            } else {
                setTimeLeft(remaining);
            }
        }, 1000);

        return () => {
            events.forEach(name => document.removeEventListener(name, handleUserActivity));
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [user, signOut, resetIdleTimer]);

    const signIn = async (email, password) => {
        setError(null);
        const result = await authService.signIn(email, password);
        if (!result.success) setError(result.error);
        return result;
    };

    const signInWithGoogle = async () => {
        setError(null);
        const result = await authService.signInWithGoogle();
        if (!result.success) setError(result.error);
        return result;
    };

    const deleteAccount = async () => {
        setError(null);
        try {
            const response = await fetch('/api/users/delete-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            if (data.success) {
                await signOut();
                return { success: true };
            } else {
                return { success: false, error: data.error };
            }
        } catch (err) {
            return { success: false, error: '刪除帳號請求失敗' };
        }
    };

    const resetPassword = async (email) => {
        setError(null);
        const result = await authService.resetPassword(email);
        if (!result.success) setError(result.error);
        return result;
    };

    const updatePassword = async (password) => {
        setError(null);
        const result = await authService.updatePassword(password);
        if (!result.success) setError(result.error);
        return result;
    };

    const updateProfile = async (profileData) => {
        setError(null);
        const { name, student_id } = profileData;
        const result = await authService.updateProfile({ name, student_id });
        if (result.success) {
            const refreshed = await authService.getCurrentUser();
            if (refreshed.success && refreshed.user) {
                setUser({
                    ...refreshed.user,
                    needsProfileCompletion: !refreshed.user.profile?.student_id,
                    hasAgreedToTerms: !!refreshed.user.profile?.has_agreed_to_terms
                });
            }
        } else {
            setError(result.error);
        }
        return result;
    };

    const agreeToTerms = async () => {
        if (!user) return { success: false, error: 'User not logged in' };
        
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ has_agreed_to_terms: true })
                .eq('id', user.id);
            
            if (error) throw error;
            
            const refreshed = await authService.getCurrentUser();
            if (refreshed.success && refreshed.user) {
                setUser({
                    ...refreshed.user,
                    needsProfileCompletion: !refreshed.user.profile?.student_id,
                    hasAgreedToTerms: true
                });
            }
            return { success: true };
        } catch (err) {
            console.error('Error agreeing to terms:', err);
            return { success: false, error: err.message };
        }
    };

    const value = {
        user,
        loading,
        error,
        timeLeft, // 暴露剩餘秒數
        signIn,
        signInWithGoogle,
        signOut,
        deleteAccount,
        resetPassword,
        updatePassword,
        updateProfile,
        agreeToTerms,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        needsProfileCompletion: !!user?.needsProfileCompletion,
        hasAgreedToTerms: !!user?.hasAgreedToTerms
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
