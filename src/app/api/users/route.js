import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyUserAuth, checkRateLimit, handleApiError, logSuccessAction } from '@/lib/apiMiddleware';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    // 1. Rate limiting 檢查
    const rateLimitCheck = checkRateLimit(request, 'users-get', 100, 60000); // 每分鐘100次
    if (!rateLimitCheck.success) {
      return rateLimitCheck.error;
    }

    // 2. 用戶身份驗證（需要管理員權限）
    const authCheck = await verifyUserAuth(request, {
      requireAuth: true,
      requireAdmin: true,
      endpoint: '/api/users'
    });
    
    if (!authCheck.success) {
      return authCheck.error;
    }

    const supabase = supabaseServer;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let usersData = [];
    let totalCount = 0;
    let usingView = false;

    // 3. 嘗試從 admin_profiles_view 查詢 (支援 Email 搜尋)
    try {
        let viewQuery = supabase.from('admin_profiles_view').select('*', { count: 'exact' });

        if (search) {
            viewQuery = viewQuery.or(`username.ilike.%${search}%,student_id.ilike.%${search}%,email.ilike.%${search}%`);
        }

        viewQuery = viewQuery.order('created_at', { ascending: false }).range(from, to);

        const { data, error, count } = await viewQuery;

        if (!error) {
            usersData = data;
            totalCount = count;
            usingView = true;
        } else {
            // 如果 View 不存在 (code 42P01) 或其他錯誤，轉為 Fallback
            if (error.code !== '42P01') {
                console.warn('Error querying admin_profiles_view, attempting fallback:', error);
            }
        }
    } catch (e) {
        console.warn('Exception querying admin_profiles_view:', e);
    }

    // 4. Fallback: 如果 View 查詢失敗，使用原有的 profiles 表查詢
    if (!usingView) {
        let query = supabase.from('profiles').select('*', { count: 'exact' });

        if (search) {
            // Fallback 模式不支援 Email 搜尋
            query = query.or(`username.ilike.%${search}%,student_id.ilike.%${search}%`);
        }
        
        query = query.order('created_at', { ascending: false }).range(from, to);

        const { data: profiles, error, count } = await query;

        if (error) {
            console.error('Error fetching users from profiles:', error);
            throw new Error('獲取用戶資料失敗');
        }

        // 獲取對應的電子信箱資料 (僅針對當前頁面的 User ID)
        const userIds = profiles.map(p => p.id);
        const emailMap = {};

        // 平行請求獲取 Email
        await Promise.all(userIds.map(async (uid) => {
            try {
                const { data: { user }, error: uError } = await supabase.auth.admin.getUserById(uid);
                if (user && !uError) {
                    emailMap[uid] = user.email;
                }
            } catch (e) {
                console.error(`Failed to fetch email for user ${uid}`, e);
            }
        }));

        // 合併資料
        usersData = profiles.map(p => ({
            ...p,
            email: emailMap[p.id]
        }));
        totalCount = count;
    }

    // 5. 獲取統計數據
    const [adminCountRes, userCountRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user')
    ]);

    // 6. 格式化輸出
    const formattedUsers = usersData.map(user => {
      const email = user.email || '';
      
      return {
        id: user.id,
        studentId: user.student_id || '',
        name: user.username || '',
        // 電子信箱脫敏處理 (只顯示前3個字符和@後的網域)
        email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : '',
        emailFull: email, // 保留完整電子信箱供編輯使用
        role: user.role || 'user',
        joinedAt: user.created_at,
        avatarUrl: user.avatar_url
      };
    });

    // 記錄成功操作
    logSuccessAction('GET_USERS', '/api/users', {
      adminId: authCheck.user.id,
      userCount: formattedUsers.length,
      page,
      search,
      usingView
    });

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      total: totalCount,
      page,
      limit,
      stats: {
          total: (adminCountRes.count || 0) + (userCountRes.count || 0),
          admins: adminCountRes.count || 0,
          users: userCountRes.count || 0
      }
    });

  } catch (error) {
    return handleApiError(error, '/api/users');
  }
}