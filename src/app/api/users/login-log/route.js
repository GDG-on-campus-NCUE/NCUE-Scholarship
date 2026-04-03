import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyUserAuth, handleApiError } from '@/lib/apiMiddleware';

export async function POST(request) {
    const endpoint = '/api/users/login-log';
    try {
        const authCheck = await verifyUserAuth(request, {
            requireAuth: true,
            endpoint
        });
        if (!authCheck.success) return authCheck.error;

        const user = authCheck.user;
        const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        // 1. Insert into login_history
        const { error: historyError } = await supabaseServer
            .from('login_history')
            .insert({
                user_id: user.id,
                ip_address: ip,
                user_agent: userAgent
            });

        if (historyError) throw historyError;

        // 2. Update profile last login
        const { error: profileError } = await supabaseServer
            .from('profiles')
            .update({
                last_login_at: new Date().toISOString(),
                last_login_ip: ip
            })
            .eq('id', user.id);

        if (profileError) throw profileError;

        return NextResponse.json({ success: true });

    } catch (err) {
        return handleApiError(err, endpoint);
    }
}

export async function GET(request) {
    const endpoint = '/api/users/login-log';
    try {
        const authCheck = await verifyUserAuth(request, {
            requireAuth: true,
            endpoint
        });
        if (!authCheck.success) return authCheck.error;

        const { data, error } = await supabaseServer
            .from('login_history')
            .select('login_at, ip_address')
            .eq('user_id', authCheck.user.id)
            .order('login_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        return NextResponse.json({ history: data });

    } catch (err) {
        return handleApiError(err, endpoint);
    }
}
