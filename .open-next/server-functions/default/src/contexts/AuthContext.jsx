"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client'; // Direct access for profile creation
import { authService } from '@/lib/supabase/auth';

const AuthContext = createContext({});

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

    useEffect(() => {
        // Fetches the user and their profile, setting the state.
        const getAndSetUser = async () => {
            const result = await authService.getCurrentUser();
            if (result.success && result.user) {
                setUser(result.user);
            }
            setLoading(false);
        };

        getAndSetUser();

        // The core logic for handling auth state changes.
        const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                const currentUser = session.user;

                // Check if a profile exists for this user.
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', currentUser.id)
                    .single();

                // If no profile exists and the registration metadata is present, it's a first-time sign-in.
                if (!profile && currentUser.raw_user_meta_data?.name) {
                    // 1. Create the profile record.
                    await supabase.from('profiles').insert({
                        id: currentUser.id,
                        username: currentUser.raw_user_meta_data.name,
                        student_id: currentUser.raw_user_meta_data.student_id,
                        role: 'user',
                    });

                    // 2. Update the user's display_name in auth.users.
                    await supabase.auth.updateUser({
                        data: { display_name: currentUser.raw_user_meta_data.name },
                    });
                }

                // After any potential updates, fetch the complete user data again to ensure UI is consistent.
                await getAndSetUser();
                setError(null);

            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setError(null);
            }

            setLoading(false);
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const signUp = async (email, password, userData = {}) => {
        setError(null);
        // The signUp function is now simplified, as the onAuthStateChange handles the profile creation.
        const result = await authService.signUp(email, password, userData);
        if (!result.success) {
            setError(result.error);
        }
        return result;
    };

    const signIn = async (email, password) => {
        setError(null);
        const result = await authService.signIn(email, password);
        if (!result.success) {
            setError(result.error);
        }
        // onAuthStateChange will handle setting the user state.
        return result;
    };



    const signOut = async () => {
        setError(null);
        const result = await authService.signOut();
        if (result.success) {
            setUser(null);
        } else {
            setError(result.error);
        }
        return result;
    };

    const resetPassword = async (email) => {
        setError(null);
        const result = await authService.resetPassword(email);
        if (!result.success) {
            setError(result.error);
        }
        return result;
    };

    const updatePassword = async (password) => {
        setError(null);
        const result = await authService.updatePassword(password);
        if (!result.success) {
            setError(result.error);
        }
        return result;
    };

    const updateProfile = async (profileData) => {
        setError(null);
        const { name, student_id } = profileData;
        const result = await authService.updateProfile({ name, student_id });
        if (result.success) {
            const refreshed = await authService.getCurrentUser();
            if (refreshed.success) {
                setUser(refreshed.user);
            }
        } else {
            setError(result.error);
        }
        return result;
    };

    const verifyOtp = async (email, token, type = 'email') => {
        setError(null);
        const result = await authService.verifyOtp(email, token, type);
        if (!result.success) {
            setError(result.error);
        }
        return result;
    };

    const resendOtp = async (email, type = 'signup') => {
        setError(null);
        const result = await authService.resendOtp(email, type);
        if (!result.success) {
            setError(result.error);
        }
        return result;
    };

    const value = {
        user,
        loading,
        error,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        updateProfile,
        verifyOtp,
        resendOtp,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin'
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
