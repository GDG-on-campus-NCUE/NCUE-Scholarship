# 公告瀏覽計數器開發規劃書

## 1. 功能概述
實作公告瀏覽計數功能，具備 IP 防刷機制（1小時內重複進入不重複計算），並在首頁公告詳情與管理後台顯示。

## 2. 資料庫設計 (Database Schema)
將建立新的 Migration 檔案 `supabase/migrations/20260107_add_view_counter.sql`：

```sql
-- 1. 在 announcements 表中新增計數欄位
ALTER TABLE public.announcements 
ADD COLUMN view_count INTEGER DEFAULT 0 NOT NULL;

-- 2. 建立瀏覽記錄表（防刷用途）
CREATE TABLE public.announcement_views (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    announcement_id uuid NOT NULL,
    ip_address inet NOT NULL,
    viewed_at timestamp with time zone DEFAULT now(),
    CONSTRAINT announcement_views_pkey PRIMARY KEY (id),
    CONSTRAINT announcement_views_announcement_id_fkey FOREIGN KEY (announcement_id) 
        REFERENCES public.announcements(id) ON DELETE CASCADE
);

-- 建立索引加速查詢
CREATE INDEX idx_announcement_views_check 
ON public.announcement_views (announcement_id, ip_address, viewed_at);

-- 3. 自動更新計數的 Trigger
CREATE OR REPLACE FUNCTION public.increment_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.announcements
    SET view_count = view_count + 1
    WHERE id = NEW.announcement_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_view_created
AFTER INSERT ON public.announcement_views
FOR EACH ROW
EXECUTE FUNCTION public.increment_view_count();
```

## 3. 後端 API 實作
- **路徑**: `src/app/api/announcements/view/route.js`
- **邏輯**: 
    1. 獲取 Client IP (`x-forwarded-for`)。
    2. 檢查 `announcement_views` 在過去 1 小時內是否有相同 IP 與 ID 的紀錄。
    3. 若無紀錄，則插入新紀錄（觸發 Trigger 更新總數）。

## 4. 前端介面規劃

### A. 公開首頁 (Public)
- **檔案**: `src/components/AnnouncementDetailModal.jsx`
- **位置**: 於 Modal Footer 的「下載按鈕」左方顯示。
- **樣式**: 「瀏覽數：X 次」，搭配灰色系文字或小圖示。
- **觸發**: Modal 開啟時呼叫 API。

### B. 管理後台 (Admin)
- **檔案**: `src/components/admin/AnnouncementsTab.jsx`
- **RWD 設計**:
    - **桌面版**: 於表格中新增「瀏覽數」獨立直欄，支援點擊標題排序。
    - **手機版**: 為了節省空間，瀏覽數將顯示在「公告標題」下方的副標題區域（例如：標題下方的灰色小字或 Badge 標籤），確保不擠壓表格寬度。

## 5. 實作步驟
1. [x] 執行資料庫 Migration。
2. [x] 建立後端計數 API。
3. [x] 實作前端 Public Modal 的計數觸發與顯示。
4. [x] 實作 Admin 後台表格的瀏覽數顯示與排序功能。

---

### 附錄：原始需求與參考結構
> 幫我規劃並新增公告瀏覽計數器的功能，並且要能避免同一個 IP 在短時間內開啟導致的重複計數，該記數要顯示在首頁的公告列表點開單一公告後，下載按鈕的左方，顯示內容為「瀏覽數：X 次」，X 為該公告的瀏覽次數。
> 並且在管理後台>公告管理頁面中，也要能看到每則公告的瀏覽次數，方便管理者了解每則公告的受歡迎程度。至於要放置的地方，請幫我規劃並且要有良好的 RWD，最好是可以在手機版與桌面版都能有良好的顯示效果。

#### 現有 Table 參考
- `public.announcements`: 主表
- `public.attachments`: 附件表
- `public.profiles`: 用戶表
