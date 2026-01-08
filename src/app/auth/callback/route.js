import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  // 獲取正確的域名 (支援反向代理)
  const getOrigin = () => {
    // 檢查 X-Forwarded-Host 或 Host headers
    const forwardedHost = request.headers.get('x-forwarded-host');
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host');
    
    if (forwardedHost) {
      return `${forwardedProto}://${forwardedHost}`;
    }
    
    // 從環境變數取得
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL;
    }
    
    // fallback 到 request origin
    return requestUrl.origin;
  };

  const origin = getOrigin();

  console.log(`[AUTH-CALLBACK] Request URL: ${requestUrl.href}`)
  console.log(`[AUTH-CALLBACK] Detected Origin: ${origin}`)
  console.log(`[AUTH-CALLBACK] Code: ${code ? 'present' : 'missing'}`)

  if (code) {
    const cookieStore = await cookies()
    
    // 使用與前端一致的配置
    const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:8000'
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log(`[AUTH-CALLBACK] Using Supabase URL: ${supabaseUrl}`)
    
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (newCookies) => {
            newCookies.forEach(({ name, value, options }) => {
              cookieStore.set({ name, value, ...options })
            })
          }
        }
      }
    )
    
    try {
      console.log(`[AUTH-CALLBACK] Exchanging code for session...`)
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('[AUTH-CALLBACK] 驗證錯誤:', error)
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
      }

      console.log(`[AUTH-CALLBACK] Session exchange successful`, { userId: data?.user?.id })

      if (data?.user) {
        console.log(`[AUTH-CALLBACK] Creating/updating user profile...`)
        // 創建用戶檔案（如果不存在）
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            name: data.user.user_metadata?.name || data.user.email || '',
            student_id: data.user.user_metadata?.student_id || '',
            department: data.user.user_metadata?.department || '',
            year: data.user.user_metadata?.year || '',
            role: 'user'
          })
        
        if (profileError) {
          console.error('[AUTH-CALLBACK] 創建用戶檔案錯誤:', profileError)
        } else {
          console.log(`[AUTH-CALLBACK] Profile created/updated successfully`)
        }
      }

      // 驗證成功，重定向到 profile 頁面
      const redirectUrl = `${origin}/profile`
      console.log(`[AUTH-CALLBACK] Redirecting to: ${redirectUrl}`)
      return NextResponse.redirect(redirectUrl)
    } catch (err) {
      console.error('[AUTH-CALLBACK] 處理驗證回調時發生錯誤:', err)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('驗證過程中發生錯誤')}`)
    }
  }

  // 沒有驗證碼，重定向到登入頁面
  console.log(`[AUTH-CALLBACK] No code provided, redirecting to login`)
  return NextResponse.redirect(`${origin}/login`)
}
