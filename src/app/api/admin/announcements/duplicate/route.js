import { NextResponse } from 'next/server';
import { copyFile, constants } from 'fs/promises';
import path from 'path';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyUserAuth, handleApiError, logSuccessAction } from '@/lib/apiMiddleware';

export async function POST(request) {
  // 1. 安全性檢查：確保只有已登入的管理員可以呼叫此 API
  const authCheck = await verifyUserAuth(request, {
    requireAuth: true,
    requireAdmin: true,
    endpoint: '/api/admin/announcements/duplicate'
  });
  if (!authCheck.success) return authCheck.error;

  try {
    const { announcementId } = await request.json();

    if (!announcementId) {
      return NextResponse.json({ error: '未提供公告 ID' }, { status: 400 });
    }

    // 2. 取得原始公告資料
    const { data: original, error: fetchError } = await supabaseServer
      .from('announcements')
      .select('*')
      .eq('id', announcementId)
      .single();

    if (fetchError || !original) {
      return NextResponse.json({ error: '找不到原始公告' }, { status: 404 });
    }

    // 3. 準備新公告資料 (排除 id, created_at, updated_at)
    // 並強制將 is_active 設為 false
    const { id: _id, created_at: _created, updated_at: _updated, ...dataToCopy } = original;
    
    // 生成標題後綴 _MMDD_副本
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const newTitle = `${dataToCopy.title}_${month}${day}_副本`;

    const newAnnouncementData = {
      ...dataToCopy,
      title: newTitle,
      is_active: false,
      updated_at: now.toISOString(),
    };

    // 4. 新增公告記錄
    const { data: newAnnouncement, error: insertError } = await supabaseServer
      .from('announcements')
      .insert(newAnnouncementData)
      .select()
      .single();

    if (insertError) throw insertError;

    // 5. 處理附件複製
    const { data: attachments } = await supabaseServer
      .from('attachments')
      .select('*')
      .eq('announcement_id', announcementId);

    if (attachments && attachments.length > 0) {
      const newAttachments = [];
      const publicDir = path.join(process.cwd(), 'public');

      for (const att of attachments) {
        try {
          // 解析檔案路徑
          // stored_file_path 通常是 "/storage/attachments/filename.ext"
          const relativePath = att.stored_file_path.startsWith('/') ? att.stored_file_path.slice(1) : att.stored_file_path;
          const sourcePath = path.join(publicDir, relativePath);
          
          // 生成新的實體檔名
          // 保留原始副檔名
          const physicalExt = path.extname(att.stored_file_path); 
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          const timestamp = Date.now();
          
          // 為了避免檔名衝突，我們使用時間戳記 + 隨機字串
          const newPhysicalName = `${timestamp}-copy-${randomSuffix}${physicalExt}`;
          
          // 設定新的儲存路徑
          const newRelativePathSegment = path.join('storage', 'attachments', newPhysicalName);
          const targetPath = path.join(publicDir, newRelativePathSegment);

          // 執行實體檔案複製
          await copyFile(sourcePath, targetPath, constants.COPYFILE_EXCL);

          // 準備資料庫記錄
          // 確保 DB 中的路徑使用正斜線 (/)
          const dbStoredPath = '/' + newRelativePathSegment.split(path.sep).join('/');

          newAttachments.push({
            announcement_id: newAnnouncement.id,
            file_name: att.file_name, // 保持原始顯示名稱
            stored_file_path: dbStoredPath,
            file_size: att.file_size,
            mime_type: att.mime_type,
          });
        } catch (fileErr) {
          console.error(`複製檔案失敗 ${att.file_name}:`, fileErr);
          // 若實體檔案複製失敗 (例如檔案遺失)，則略過該附件，不中斷整體流程
        }
      }

      if (newAttachments.length > 0) {
        const { error: attInsertError } = await supabaseServer
          .from('attachments')
          .insert(newAttachments);
        
        if (attInsertError) {
            console.error('插入附件記錄失敗:', attInsertError);
            // 這裡可以選擇是否要回滾，但通常保留公告本體即可
        }
      }
    }

    // 6. 記錄操作日誌
    logSuccessAction('DUPLICATE_ANNOUNCEMENT', '/api/admin/announcements/duplicate', {
      originalId: announcementId,
      newId: newAnnouncement.id,
      userId: authCheck.user.id
    });

    return NextResponse.json({ success: true, newAnnouncement });

  } catch (error) {
    return handleApiError(error, '/api/admin/announcements/duplicate');
  }
}
