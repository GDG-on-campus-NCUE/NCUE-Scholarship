import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyUserAuth, checkRateLimit, validateRequestData, handleApiError, logSuccessAction } from '@/lib/apiMiddleware';

export async function PUT(request, { params }) {
  const { id } = await params;
  const endpoint = `/api/users/${id}`;

  try {
    // 1. Rate limiting 檢查
    const rateLimitCheck = checkRateLimit(request, 'users-put', 10, 60000); // 每分鐘10次
    if (!rateLimitCheck.success) {
      return rateLimitCheck.error;
    }

    // 2. 用戶身份驗證（需要管理員權限）
    const authCheck = await verifyUserAuth(request, {
      requireAuth: true,
      requireAdmin: true,
      endpoint
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

    // 4. 驗證 id 格式
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: '無效的用戶 ID' },
        { status: 400 }
      );
    }

    // 5. 防止管理員意外移除自己的管理員權限，或變更自己的資料 (應在 Profile 頁面變更)
    if (id === authCheck.user.id) {
        if (role && role !== 'admin') {
            return NextResponse.json({ error: '不能移除自己的管理員權限' }, { status: 400 });
        }
        // 如果只是想透過此 API 變更自己的 username，也可以允許，但通常管理員管理他人
    }

    // 6. 更新用戶資料
    const supabase = supabaseServer;
    const updateData = {};
    if (role !== undefined) {
        if (!['user', 'admin'].includes(role)) {
            return NextResponse.json({ error: '無效的角色權限' }, { status: 400 });
        }
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
      .eq('id', id)
      .select('id, student_id, username, role, created_at, avatar_url')
      .single();

    if (error) {
      console.error('Error updating user:', error);
      throw new Error('更新用戶資料失敗');
    }

    // 7. 獲取對應的電子信箱 (從 auth.admin)
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(id);
    const email = authUser?.user?.email || '';

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
    logSuccessAction('USER_UPDATED', endpoint, {
      adminId: authCheck.user.id,
      targetUserId: id,
      changes: updateData
    });

    return NextResponse.json({
      success: true,
      data: formattedUser,
      message: '使用者資料更新成功'
    });

  } catch (error) {
    return handleApiError(error, endpoint);
  }
}

export async function DELETE(request, { params }) {
    const { id } = await params;
    const endpoint = `/api/users/${id}`;

    try {
        const authCheck = await verifyUserAuth(request, {
            requireAuth: true,
            requireAdmin: true,
            endpoint
        });
        if (!authCheck.success) return authCheck.error;

        // 避免刪除自己
        if (authCheck.user.id === id) {
            return NextResponse.json({ error: '無法刪除目前的登入帳號' }, { status: 403 });
        }

        const { error } = await supabaseServer.auth.admin.deleteUser(id);

        if (error) throw error;

        logSuccessAction('USER_DELETED', endpoint, { adminId: authCheck.user.id, targetUserId: id });

        return NextResponse.json({ success: true, message: '使用者已成功刪除' });

    } catch (err) {
        return handleApiError(err, endpoint);
    }
}
