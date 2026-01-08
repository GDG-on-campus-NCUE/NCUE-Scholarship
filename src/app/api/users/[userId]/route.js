import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyUserAuth, checkRateLimit, validateRequestData, handleApiError, logSuccessAction } from '@/lib/apiMiddleware';

export async function PUT(request, { params }) {
  try {
    const { userId } = await params;

    // 1. Rate limiting 檢查
    const rateLimitCheck = checkRateLimit(request, 'users-put', 5, 60000); // 每分鐘5次
    if (!rateLimitCheck.success) {
      return rateLimitCheck.error;
    }

    // 2. 用戶身份驗證（需要管理員權限）
    const authCheck = await verifyUserAuth(request, {
      requireAuth: true,
      requireAdmin: true,
      endpoint: '/api/users/[userId]'
    });
    
    if (!authCheck.success) {
      return authCheck.error;
    }

    // 3. 驗證請求資料
    const body = await request.json();
    const dataValidation = validateRequestData(
      body,
      [], // 沒有必填欄位
      ['role', 'username'] // 可選欄位
    );
    
    if (!dataValidation.success) {
      return dataValidation.error;
    }

    const { role, username } = dataValidation.data;

    // 4. 驗證 userId 格式
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: '無效的用戶 ID' },
        { status: 400 }
      );
    }

    // 5. 防止管理員意外移除自己的管理員權限
    if (userId === authCheck.user.id && role && role !== 'admin') {
      return NextResponse.json(
        { error: '不能移除自己的管理員權限' },
        { status: 400 }
      );
    }

    // 6. 更新用戶資料
    const supabase = supabaseServer;
    const updateData = {};
    if (role !== undefined) {
      updateData.role = role;
    }
    if (username !== undefined) {
      updateData.username = username;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '沒有提供要更新的資料' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select('id, student_id, username, role, created_at, avatar_url')
      .single();

    if (error) {
      console.error('Error updating user:', error);
      throw new Error('更新用戶資料失敗');
    }

    // 7. 獲取對應的電子信箱
    const { data: authUsers, error: emailFetchError } = await supabase.auth.admin.listUsers();
    let email = '';
    if (authUsers?.users) {
      const authUser = authUsers.users.find(u => u.id === data.id);
      email = authUser?.email || '';
    }

    // 8. 格式化回傳資料
    const formattedUser = {
      id: data.id,
      studentId: data.student_id || '',
      name: data.username || '',
      email: email,
      role: data.role,
      createdAt: data.created_at,
      avatarUrl: data.avatar_url
    };

    // 記錄成功操作
    logSuccessAction('UPDATE_USER', '/api/users/[userId]', {
      adminId: authCheck.user.id,
      targetUserId: userId,
      changes: updateData
    });

    return NextResponse.json({
      success: true,
      data: formattedUser
    });

  } catch (error) {
    return handleApiError(error, '/api/users/[userId]');
  }
}
