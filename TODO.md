# 待辦事項 (TODO List)

## 系統效能優化 (System Performance Optimization)

為了提升整體系統效能，特別是針對列表資料量增長後的載入速度，規劃進行以下重構與優化：

### 1. 前台公告列表 (Frontend Announcement List)
- **目標**: 減少列表 API 回傳的資料量，加快初始載入速度。
- [x] **優化 API 查詢 (`AnnouncementList.jsx`)**:
    - 目前列表查詢會 `join` `attachments`，這在資料量大時會造成不必要的負擔。
    - **行動**: 修改 Supabase 查詢，僅選取列表顯示所需的欄位 (如 `id`, `title`, `category`, `semester`, `dates`, `view_count`)。排除 `attachments`, `target_audience` (如果過長), `summary` (如果過長)。
- [x] **按需讀取詳細資料 (`AnnouncementDetailModal.jsx`)**:
    - **行動**: 修改 Modal 元件。當 Modal 開啟時，透過 `useEffect` 根據 `announcement.id` 重新從後端獲取完整的公告資料 (包含 `attachments`, `external_urls`, 完整 HTML 內容)。
    - **狀態**: 在讀取期間顯示 Loading 狀態。

### 2. 後台公告管理 (Admin Announcement Management)
- **目標**: 解決目前「一次載入所有公告」導致的效能瓶頸，改為伺服器端分頁。
- [x] **伺服器端分頁與搜尋 (`AnnouncementsTab.jsx`)**:
    - 目前使用 Client-side pagination (`slice` + `filter`)。
    - **行動**: 重構 `fetchAnnouncements`，改為傳送 `page`, `perPage`, `search`, `sort` 參數給 Supabase (類似前台的實作方式)。
    - 使用 `query.range()`, `query.ilike()`, `query.order()` 進行後端處理。
- [x] **PDF 下載與編輯優化**:
    - 由於列表不再回傳完整資料，點擊「編輯」或「下載 PDF」時，需確保取得完整資料。
    - **行動**: 在點擊這些按鈕時，若資料不完整，先呼叫 API 獲取單筆完整資料後再執行後續動作。

### 3. 後台使用者管理 (Admin User Management)
- **目標**: 解決使用者列表一次載入所有資料 (包含跨資料表整合 Email) 的效能問題。
- [x] **API 路由優化 (`src/app/api/users/route.js`)**:
    - 目前邏輯：Fetch All Profiles -> Fetch All Auth Users (Pagination Loop) -> Merge in Memory。這在使用者增加後會極慢。
    - **行動**: 
        1. 修改 API 支援 Query Parameters: `page`, `limit`, `search`。
        2. **優先查詢 Profiles**: 先對 `profiles` 表進行分頁與搜尋 (針對姓名、學號)。
        3. **延遲獲取 Email**: 僅針對 *當前頁面* 的 `profiles` (例如 10 筆)，去查詢對應的 Auth Email (或是如果搜尋條件是 Email，則先查 Auth 再查 Profiles，但建議以 Profiles 為主)。
- [x] **元件重構 (`UsersTab.jsx`)**:
    - **行動**: 配合 API 修改，將分頁與搜尋狀態 (`currentPage`, `searchTerm`) 透過 API 請求傳送，而非在前端過濾。

### 4. 資料庫索引優化 (Database Indexing)
- **目標**: 針對頻繁查詢與排序的欄位建立索引，減少資料庫掃描時間。
- [x] **新增索引 (`migrations`)**:
    - **`announcements` 表**:
        - 針對 `application_end_date` 建立索引 (用於排序與過濾過期公告)。
        - 針對 `category` 建立索引 (用於分類篩選)。
        - 針對 `title`, `summary`, `target_audience` 建立 GIN 索引 (Trigram)，大幅提升 `ilike` 模糊搜尋效能。
    - **`profiles` 表**:
        - 針對 `username` 建立索引 (用於後台使用者搜尋)。

### 5. 前端資源載入優化 (Code Splitting & Bundle Size)
- **目標**: 減少主應用程式 Bundle 大小，加快首頁載入速度。
- [x] **PDF 生成套件 Lazy Loading (`DownloadPDFButton.jsx`)**:
    - 目前 `@react-pdf/renderer` 是靜態引入，這是一個非常龐大的函式庫。即使使用者不下載 PDF，該程式碼仍可能被載入。
    - **行動**: 改用 `import()` 動態載入 `@react-pdf/renderer` 與 `AnnouncementPDF` 元件，僅在使用者點擊按鈕時才下載相關程式碼。


---
   1. 資料庫索引優化
       * 新增了 supabase/migrations/20260116000000_add_performance_indexes.sql，建立了關鍵索引：
           * announcements: application_end_date, category，以及針對 title, summary, target_audience 的 GIN (Trigram) 索引。
           * profiles: username 索引。

   2. 前台公告列表 (Frontend List) 優化
       * API 查詢瘦身：修改 src/components/AnnouncementList.jsx，將列表查詢從 select('*') 改為僅選取必要欄位，移除了 attachments 與 summary 等重型資料。
       * 按需讀取：修改 src/components/AnnouncementDetailModal.jsx，當使用者點擊公告開啟 Modal 時，會自動檢查資料完整性。若發現缺少 attachments
         或詳細內容，會即時從伺服器獲取完整資料並顯示載入狀態。

   3. 後台公告管理 (Admin Announcements) 優化
       * 伺服器端分頁：重寫 src/components/admin/AnnouncementsTab.jsx，完全移除前端分頁與過濾邏輯，改由後端 API 透過 range 與 ilike
         進行處理。現在僅會載入當前頁面的 10-20 筆資料。
       * 編輯與下載優化：點擊「編輯」或「下載 PDF」時，會先確保取得完整資料後再執行後續動作。

   4. 後台使用者管理 (Admin Users) 優化
       * API 改造：重寫 src/app/api/users/route.js。
           * 支援 page, limit, search 參數，利用資料庫分頁取代記憶體處理。
           * 改為「先查詢 Profiles，再並行獲取 Email」，大幅減少對 Supabase Auth 的請求量。
           * 新增 stats 回傳 (Admin/User 總數)，採用高效的 count 查詢。
       * 群發郵件優化：重寫 src/app/api/send-bulk-email/route.js，支援伺服器端根據 role 自動撈取目標 Email，前端不再需要傳送巨大的 Email 列表。
       * 前端整合：更新 src/components/admin/UsersTab.jsx 以配合新的 API 分頁與群發邏輯。

   5. 程式碼拆分 (Code Splitting)
       * PDF 套件 Lazy Loading：重構 src/components/admin/DownloadPDFButton.jsx。現在 @react-pdf/renderer 與 AnnouncementPDF
         元件僅在使用者真正點擊下載按鈕時才會被載入，這將顯著減少 Admin 頁面的初始 Bundle 大小與載入時間。