import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/apiMiddleware';

export async function POST(request) {
    const endpoint = '/api/auth/profile-sync';
    try {
        // 1. 從 Authorization Header 取得 Token
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
        }
        
        const token = authHeader.replace('Bearer ', '');
        
        // 2. 驗證 Token 並取得 User
        const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);
        
        if (authError || !user) {
            console.error('[ProfileSync] Auth error:', authError?.message);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const email = user.email;
        const userAgent = request.headers.get('user-agent') || 'unknown';
        
        // 取得更準確的客戶端 IP
        const forwardedFor = request.headers.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : (request.ip || 'unknown');

        let profile;

        // 3. 檢查 Profile 是否存在 (根據 ID)
        const { data: profileById, error: fetchError } = await supabaseServer
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

        if (profileById) {
            profile = profileById;
        } else {
            // 4. 根據 Email 檢查 (處理 Google 登入關聯)
            const { data: profileByEmail } = await supabaseServer
                .from('profiles')
                .select('*')
                .eq('email', email)
                .maybeSingle();

            if (profileByEmail) {
                const { data: linkedProfile, error: linkError } = await supabaseServer
                    .from('profiles')
                    .update({ id: user.id })
                    .eq('id', profileByEmail.id)
                    .select()
                    .single();

                if (linkError) throw linkError;
                profile = linkedProfile;
            } else {
                // 5. 建立全新 Profile
                const name = user.user_metadata?.full_name || user.user_metadata?.name || '';
                const { data: newProfile, error: createError } = await supabaseServer
                    .from('profiles')
                    .insert({
                        id: user.id,
                        username: name,
                        email: email,
                        role: 'user',
                        has_agreed_to_terms: false
                    })
                    .select()
                    .single();

                if (createError) throw createError;
                profile = newProfile;
            }
        }

        // 6. 移除強制寫入登入紀錄的邏輯，改由登入時 (LoginClient 與 OAuth callback) 主動觸發
        // 以避免 Token 刷新或系統重整時產生多餘的登入紀錄

        return NextResponse.json({ success: true, profile });

    } catch (err) {
        return handleApiError(err, endpoint);
    }
}
