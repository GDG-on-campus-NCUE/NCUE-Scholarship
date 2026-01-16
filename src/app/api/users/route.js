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
    const rateLimitCheck = checkRateLimit(request, 'users-get', 20, 60000); // 每分鐘20次
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

    // 3. 查詢 Profiles (分頁與搜尋)
    let query = supabase.from('profiles').select('*', { count: 'exact' });

    if (search) {
        query = query.or(`username.ilike.%${search}%,student_id.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data: profiles, error, count } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      throw new Error('獲取用戶資料失敗');
    }

    // 4. 獲取對應的電子信箱資料 (僅針對當前頁面的 User ID)
    const userIds = profiles.map(p => p.id);
    const emailMap = {};

    // 平行請求獲取 Email (supabase.auth.admin.getUserById)
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

    // 獲取統計數據 (僅在第一頁且無搜尋時，或總是獲取? 總是獲取雖然多兩個查詢但對 Admin 面板來說還好)
    // 為了效能，我們可以並行執行
    const [adminCountRes, userCountRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user')
    ]);

    // 5. 格式化資料並進行脫敏處理
    const formattedUsers = profiles.map(profile => {
      const email = emailMap[profile.id] || '';
      
      return {
        id: profile.id,
        studentId: profile.student_id || '',
        name: profile.username || '',
        // 電子信箱脫敏處理 (只顯示前3個字符和@後的網域)
        email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : '',
        emailFull: email, // 保留完整電子信箱供編輯使用
        role: profile.role || 'user',
        joinedAt: profile.created_at,
        avatarUrl: profile.avatar_url
      };
    });

    // 記錄成功操作
    logSuccessAction('GET_USERS', '/api/users', {
      adminId: authCheck.user.id,
      userCount: formattedUsers.length,
      page,
      search
    });

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      total: count,
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