"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { authService } from '@/lib/supabase/auth';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/authFetch';

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
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // 自動登出相關狀態
    const [timeLeft, setTimeLeft] = useState(IDLE_TIMEOUT);
    const lastActivity = useRef(Date.now());
    const timerRef = useRef(null);

    const refreshUserData = useCallback(async () => {
        const result = await authService.getCurrentUser();
        if (result.success && result.user) {
            setUser({
                ...result.user,
                needsProfileCompletion: !result.user.profile?.student_id,
                hasAgreedToTerms: !!result.user.profile?.has_agreed_to_terms
            });
        } else {
            setUser(null);
        }
        setLoading(false);
    }, []);

    const signOut = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await authService.signOut();
            setUser(null);
            setTimeLeft(IDLE_TIMEOUT);
            // 使用 router.replace 避免 history 堆疊，並重導向到首頁
            router.replace('/');
            // 稍微延遲後強制重新載入，確保所有元件狀態清除
            setTimeout(() => {
                if (typeof window !== 'undefined') window.location.reload();
            }, 100);
            return result;
        } finally {
            setLoading(false);
        }
    }, [router]);

    // 更新活動時間
    const resetIdleTimer = useCallback(() => {
        lastActivity.current = Date.now();
        setTimeLeft(IDLE_TIMEOUT);
    }, []);

    useEffect(() => {
        // 初次載入獲取使用者
        refreshUserData();

        // 監聽認證狀態變化
        const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event);

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                if (session?.user) {
                    // 通知後端同步 Profile (使用 session 中的 token 確保驗證成功)
                    const token = session.access_token;
                    authFetch('/api/auth/profile-sync', { method: 'POST' }, token).catch(console.error);
                    await refreshUserData();
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setLoading(false);
                
                // 處理 PWA 或多標籤頁同步登出
                const publicPaths = ['/login', '/forgot-password', '/reset-password', '/terms-and-privacy', '/auth/callback', '/resource'];
                const isPublicPath = publicPaths.some(path => window.location.pathname.startsWith(path)) || window.location.pathname === '/';
                
                if (!isPublicPath) {
                    router.replace('/login');
                }
            } else if (event === 'USER_UPDATED') {
                await refreshUserData();
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, [refreshUserData, router]);

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
        if (result.success) {
            await refreshUserData();
            // 主動觸發寫入登入紀錄
            authFetch('/api/users/login-log', { method: 'POST' }).catch(console.error);
        } else {
            setError(result.error);
        }
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
            const response = await authFetch('/api/users/delete-account', {
                method: 'POST'
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
            await refreshUserData();
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
            await refreshUserData();
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
        timeLeft,
        signIn,
        signInWithGoogle,
        signOut,
        deleteAccount,
        resetPassword,
        updatePassword,
        updateProfile,
        agreeToTerms,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin' || user?.profile?.role === 'admin',
        needsProfileCompletion: !!user?.needsProfileCompletion,
        hasAgreedToTerms: !!user?.hasAgreedToTerms
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
