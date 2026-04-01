import { NextResponse } from 'next/server';
import { checkRateLimit, handleApiError } from '@/lib/apiMiddleware';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    // 1. Rate limiting 檢查
    const rateLimitCheck = checkRateLimit(request, 'check-duplicate', 20, 60000); // 每分鐘20次
    if (!rateLimitCheck.success) {
      return rateLimitCheck.error;
    }

    const { email, student_id, exclude_id } = await request.json();

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    let emailExists = false;
    let studentIdExists = false;

    if (email) {
        let query = supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('email', email);
        if (exclude_id) query = query.neq('id', exclude_id);
        
        const { count, error } = await query;
        if (!error && count > 0) emailExists = true;
    }

    if (student_id) {
        let query = supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('student_id', student_id);
        if (exclude_id) query = query.neq('id', exclude_id);

        const { count, error } = await query;
        if (!error && count > 0) studentIdExists = true;
    }

    return NextResponse.json({ emailExists, studentIdExists });
  } catch (error) {
    return handleApiError(error, '/api/check-duplicate');
  }
}
