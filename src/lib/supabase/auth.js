import { supabase } from './client';

// User authentication functions
export const authService = {
  /**
   * Signs up a new user.
   * Profile creation and display_name update are now fully handled by a database trigger.
   * This function only needs to pass the user's data to Supabase Auth.
   */
  async signUp(email, password, userData = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            student_id: userData.student_id,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error("Sign-up failed:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Signs in a user.
   */
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Signs in with Google OAuth.
   */
  async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        }
      });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Signs out the current user.
   */
  async signOut() {
    try {
      // 1. 手動清除前端 cookies 以防萬一 (特別是網域問題造成的殘留)
      // 這部分先執行，確保即便 API 掛起，本地狀態也能清除
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i];
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
          
          // 清除 Supabase 相關 cookie (sb-...) 以及其他認證相關 cookie
          if (name.startsWith('sb-') || name.includes('auth') || name.includes('token')) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            // 同時嘗試清除子網域的 cookie
            const domain = window.location.hostname;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain}`;
            // 嘗試清除 ncuesa.org.tw 網域的 cookie
            if (domain.includes('ncuesa.org.tw')) {
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.ncuesa.org.tw`;
            }
          }
        }
        // 清除 localStorage 中的 Supabase session
        for (let key in localStorage) {
          if (key.startsWith('sb-')) {
            localStorage.removeItem(key);
          }
        }
      }

      // 2. 異步呼叫 Supabase API，不等待它完成以防掛起
      supabase.auth.signOut().catch(err => {
        console.warn('Background Supabase signOut API error:', err.message);
      });
      
      // 3. 立即返回成功，讓 UI 能夠繼續處理
      return { success: true };
    } catch (error) {
      console.error('Logout process error:', error);
      // 即使報錯，如果 cookie 已清，我們也應該讓前端認為成功
      return { success: true };
    }
  },

  /**
   * Gets the current user and their profile.
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') { // Ignore "no rows found" error
          console.error("Error fetching profile:", profileError);
        }
        
        return { 
          success: true, 
          user: {
            ...user,
            profile: profile || null,
            role: profile?.role || 'user'
          }
        };
      }
      
      return { success: true, user: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ... (the rest of the authService functions: resetPassword, updatePassword, etc.)
    // 獲取用戶profile
    async getUserProfile(userId) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (error) throw error;
          return { success: true, data };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
    
      // 重設密碼
      async resetPassword(email) {
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
          });
          
          if (error) throw error;
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
    
      // 更新密碼
      async updatePassword(password) {
        try {
          const { error } = await supabase.auth.updateUser({
            password
          });

          if (error) throw error;
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      // 更新使用者個人資料
      async updateProfile({ name, student_id }) {
        try {
          const { data, error } = await supabase.auth.updateUser({
            data: { name, student_id }
          });

          if (error) throw error;

          const userId = data.user.id;

          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              username: name,
              student_id
            })
            .eq('id', userId);

          if (profileError) throw profileError;

          return { success: true, user: data.user };
        } catch (error) {
          console.error('更新個人資料失敗:', error);
          return { success: false, error: error.message };
        }
      },
    
      // 驗證 OTP
      async verifyOtp(email, token, type = 'email') {
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type
          });
          
          if (error) throw error;
          return { success: true, data };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
    
      // 重新發送 OTP
      async resendOtp(email, type = 'signup') {
        try {
          const { error } = await supabase.auth.resend({
            type,
            email
          });
          
          if (error) throw error;
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
    
      // 監聽認證狀態變化
      onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange((event, session) => {
          callback(event, session);
        });
      }
};
