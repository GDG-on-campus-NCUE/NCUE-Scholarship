# SEO Optimization Plan (Query Parameter Strategy)

## 1. Basic Configuration (Site-wide)
- [ ] **`src/app/robots.ts`**:
    - Allow `/`
    - Disallow `/api/`, `/manage/`
    - Point to sitemap
- [ ] **`src/app/layout.jsx`**:
    - Set `metadataBase` to `process.env.NEXT_PUBLIC_APP_URL` (critical for OG images).
    - Set default `title` template and `openGraph` configuration.

## 2. Dynamic Sitemap
- [ ] **`src/app/sitemap.ts`**:
    - Static routes: `/`, `/terms-and-privacy`
    - Dynamic routes: Fetch all published announcement IDs from Supabase.
    - Generate URLs in the format: `${baseUrl}/?announcement_id=${id}`.

## 3. Homepage Dynamic Metadata (Server-Side)
- [ ] **`src/app/page.jsx`**:
    - Implement `generateMetadata({ searchParams })`.
    - If `searchParams.announcement_id` exists:
        - Fetch announcement details.
        - Return specific `title`, `description`, `openGraph`.
    - Else:
        - Return default homepage metadata.

## 4. Structured Data (JSON-LD)
- [ ] **`src/components/JsonLd.jsx`**:
    - Create component to render `<script type="application/ld+json">`.
    - Schema type: `NewsArticle` or `Article`.
- [ ] **Integrate into `src/app/page.jsx`**:
    - Inject `JsonLd` component when an announcement is active.

## 5. Client-Side UX
- [ ] Ensure `src/app/page.jsx` (Client Logic) automatically opens the modal when `?announcement_id` is present in the URL on initial load.


  1. 更新 TODO.md
  已將原本的規劃更新為針對「URL Query Parameter (?announcement_id=...)」的 SEO 策略。

  2. 基礎設定 (Phase 1)
   * `src/app/robots.ts`: 建立了爬蟲規則檔，允許索引首頁，排除 API 與管理後台，並指向 Sitemap。
   * `src/app/layout.jsx`: 更新了 metadata，加入了 metadataBase (這對 Open Graph 圖片顯示非常重要) 以及預設的 openGraph 設定。

  3. 動態網站地圖 (Phase 2)
   * `src/app/sitemap.ts`: 實作了動態 Sitemap 生成邏輯。它會透過 supabaseServer 撈取所有 is_active = true 的公告 ID，並生成帶有參數的網址 (例如 https://.../?announcement_id=123)，讓 Google
     能夠爬取這些「隱藏」在參數後的頁面。

  4. 首頁動態 Metadata 與結構化數據 (Phase 3 & 4)
   * 重構首頁結構:
       * 將原本的客戶端首頁邏輯搬移至 `src/components/HomePageClient.jsx`。
       * 將 `src/app/page.jsx` 改寫為 Server Component。
   * SEO 實作:
       * 在 src/app/page.jsx 中使用 generateMetadata，當網址帶有 announcement_id 時，伺服器端會先撈取資料並回傳該公告專屬的 title 與 description。
       * 加入了 `src/components/JsonLd.jsx`，並在 Server Component 中注入 NewsArticle 類型的結構化資料 (Schema.org)，幫助搜尋引擎理解這是一則公告。

  5. 使用者體驗 (Phase 5)
   * 保留了 AnnouncementList 中的客戶端邏輯，確保使用者（或透過連結進入的人）點開網址時，會自動觸發 Modal 彈出顯示詳細內容，維持了 SPA 的流暢體驗。

  現在您的平台已經具備了兼顧 SEO 與 SPA 體驗的架構。Googlebot 可以透過 Sitemap 找到網址，透過 Server Component 讀取 Meta 標籤，而使用者則能享受不換頁的流暢操作。