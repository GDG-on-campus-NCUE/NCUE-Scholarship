import { supabaseServer as supabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { token, deviceType } = await request.json();
        if (!token) return NextResponse.json({ error: 'Token is required' }, { status: 400 });

        const { data: { user } } = await supabase.auth.getUser();

        // 檢查 Token 是否已存在
        const { data: existing } = await supabase
            .from('fcm_tokens')
            .select('id')
            .eq('fcm_token', token)
            .maybeSingle();

        if (existing) {
            // 如果已存在且當前有登入用戶，則更新 user_id 關聯
            if (user) {
                await supabase.from('fcm_tokens').update({ user_id: user.id }).eq('id', existing.id);
            }
            return NextResponse.json({ message: 'Token already exists' });
        }

        // 插入新 Token
        const { error } = await supabase.from('fcm_tokens').insert({
            fcm_token: token,
            user_id: user?.id || null,
            device_type: deviceType || 'web'
        });

        if (error) throw error;

        return NextResponse.json({ message: 'Token saved successfully' });
    } catch (error) {
        console.error('Error saving token:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
