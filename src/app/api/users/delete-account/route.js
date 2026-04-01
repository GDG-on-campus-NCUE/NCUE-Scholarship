import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(request) {
    const res = NextResponse.next();
    
    // 1. 建立普通 Server Client 驗證當前用戶身分
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll: () => request.cookies.getAll(),
                setAll: (cookies) => {
                    cookies.forEach(({ name, value, options }) => {
                        res.cookies.set({ name, value, ...options });
                    });
                },
            },
        }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: '未授權的操作' }, { status: 401 });
    }

    // 2. 建立管理員 Client (使用 Service Role Key)
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    try {
        // A. 刪除用戶在 public.profiles 中的資料 (這通常會觸發關聯資料的刪除)
        // 注意：chat_history 等表若有外鍵關聯到 profiles，且未設定 CASCADE，需手動刪除。
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', user.id);

        if (profileError) throw profileError;

        // B. 刪除 auth.users 中的帳號
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

        if (deleteError) throw deleteError;

        return NextResponse.json({ success: true, message: '帳戶已成功註銷' });
    } catch (err) {
        console.error('Delete account error:', err);
        return NextResponse.json({ error: err.message || '註銷過程中發生錯誤' }, { status: 500 });
    }
}
