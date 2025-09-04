import { supabase } from '@/lib/supabase/client';

/**
 * 獲取當前用戶的 access token
 * @returns {Promise<string|null>} Access token 或 null
 */
export async function getCurrentToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('Error getting current token:', error);
    return null;
  }
}

/**
 * 創建包含 Authorization header 的 fetch 選項
 * @param {Object} options - 額外的 fetch 選項
 * @returns {Promise<Object>} 包含 Authorization header 的選項
 */
export async function createAuthFetchOptions(options = {}) {
  const token = await getCurrentToken();
  
  const headers = {
    ...options.headers
  };
  
  // 如果沒有指定 Content-Type 且 body 不是 FormData，則設置為 application/json
  if (!headers['Content-Type'] && !headers['content-type'] && 
      !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return {
    ...options,
    headers
  };
}

/**
 * 帶身份驗證的 fetch 請求
 * @param {string} url - 請求 URL
 * @param {Object} options - fetch 選項
 * @returns {Promise<Response>} fetch Response
 */
export async function authFetch(url, options = {}) {
  const authOptions = await createAuthFetchOptions(options);
  return fetch(url, authOptions);
}
