# 待辦事項 (TODO List)

## 任務目標：於後台頁面新增系統金鑰管理功能 (System Keys Management)

此功能旨在讓管理員能夠在後台介面直接配置系統所需的 API Keys，優先級高於環境變數，且無需重新部署即可生效。
**需支援的金鑰：**
1. `SERP_API_KEY` (Server-side only): 用於 Google Search 增強 AI 回覆。
2. `NEXT_PUBLIC_GEMINI_API_KEY` (Client & Server): 用於 AI 聊天與摘要生成。
3. `NEXT_PUBLIC_TINYMCE_API_KEY` (Client only): 用於富文字編輯器。

### 1. 資料庫規劃 (Database)
- [ ] **建立 `system_settings` 資料表**
    - `key` (Text, Primary Key): 設定鍵名 (Enum: `SERP_API_KEY`, `NEXT_PUBLIC_GEMINI_API_KEY`, `NEXT_PUBLIC_TINYMCE_API_KEY`)
    - `value` (Text): 設定值 (加密或明文儲存，視需求而定，目前建議明文但限制存取)
    - `description` (Text): 設定說明
    - `updated_at` (Timestamp): 最後更新時間
    - `updated_by` (UUID): 最後更新者 (關聯至 auth.users)
- [ ] **設定 RLS (Row Level Security)**
    - 允許 `admin` 角色進行 SELECT, INSERT, UPDATE。
    - **禁止** `public` 角色直接讀取 (Client 端需透過特定 API 取得公開金鑰)。

### 2. 後端開發 (Backend)
- [ ] **建立設定存取庫 `src/lib/config.js`**
    - 實作 `getSystemConfig(key)`：優先讀取 DB，若無則回退至 `process.env`。
    - 實作 `getPublicSystemConfig()`：僅回傳允許公開的金鑰 (`NEXT_PUBLIC_*`)。
- [ ] **新增管理 API `src/app/api/admin/settings/route.js`**
    - `GET`: 回傳所有設定狀態 (金鑰值需遮蔽，如 `sk-******`，僅供確認是否有值)。
    - `POST`: 接收並更新設定值 (需驗證 Admin 權限)。
- [ ] **新增公開設定 API `src/app/api/settings/public/route.js`**
    - `GET`: 回傳前端需要的公開金鑰 (`NEXT_PUBLIC_GEMINI_API_KEY`, `NEXT_PUBLIC_TINYMCE_API_KEY`)。
    - 快取策略：可設定短暫 Cache 以減少 DB 負擔。
- [ ] **更新 Server-side 使用點**
    - `src/app/api/chat/route.js`: 使用 `getSystemConfig` 讀取 `SERP_API_KEY` 與 `NEXT_PUBLIC_GEMINI_API_KEY`。

### 3. 前端開發 (Frontend)
- [ ] **建立 Hook `src/hooks/useSystemSettings.js`**
    - 用於 Client Components 獲取公開金鑰。
    - 實作 Context 或 SWR 抓取 `/api/settings/public`。
- [ ] **更新 Client-side 使用點**
    - `src/components/TinyMCE.jsx`: 改用 Hook 取得 `NEXT_PUBLIC_TINYMCE_API_KEY`。
    - `src/components/CreateAnnouncementModal.jsx` & `UpdateAnnouncementModal.jsx`: 改用 Hook 取得 `NEXT_PUBLIC_GEMINI_API_KEY`。
- [ ] **新增元件 `src/components/admin/SettingsTab.jsx`**
    - 表單欄位：
        - SerpAPI Key
        - Gemini API Key
        - TinyMCE API Key
    - 狀態顯示：區分「使用環境變數」或「使用資料庫設定」。
    - 驗證與儲存功能。
- [ ] **整合至 `src/app/manage/page.jsx`**
    - 新增「系統設定」分頁。

### 4. 安全性考量 (Security Check)
- [ ] **權限控管**：`/api/admin/settings` 必須嚴格檢查 Admin 權限。
- [ ] **敏感資料隔離**：`SERP_API_KEY` 絕對不可透過 `/api/settings/public` 洩漏給前端。
- [ ] **遮蔽處理**：管理介面回傳金鑰時，務必進行遮蔽處理 (Masking)，避免管理員帳號被盜用時直接洩漏明碼。

### 5. 測試 (Testing)
- [ ] 驗證後台儲存後，API 回傳值是否更新。
- [ ] 驗證前端 TinyMCE 編輯器在無環境變數但有 DB 設定時能否正常載入。
- [ ] 驗證 Chat 功能 (Server-side) 是否能正確讀取 DB 中的 Gemini/Serp Key。
- [ ] 驗證非管理員無法存取 `/api/admin/settings`。


請幫我修改，要適配以下三個環境變數，並能夠安全傳輸、正確使用，並且後台新的 tab 中可以輸入這三個金鑰：
SERP_API_KEY=YOUR_SERP_API_KEY
NEXT_PUBLIC_GEMINI_API_KEY=YOUR_GEMINI_API_KEY
NEXT_PUBLIC_TINYMCE_API_KEY=YOUR_TINYMCE_API_KEY

---

以下是現有之 supabase 資料表結構，供參考：

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.announcements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title character varying NOT NULL,
  summary text,
  category character varying,
  application_start_date date,
  application_end_date date,
  target_audience text,
  application_limitations character varying,
  submission_method character varying,
  external_urls text,
  is_active boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT announcements_pkey PRIMARY KEY (id)
);
CREATE TABLE public.attachments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  announcement_id uuid,
  file_name character varying NOT NULL,
  stored_file_path character varying NOT NULL,
  uploaded_at timestamp with time zone DEFAULT now(),
  file_size integer,
  mime_type character varying,
  CONSTRAINT attachments_pkey PRIMARY KEY (id),
  CONSTRAINT attachments_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES public.announcements(id)
);
CREATE TABLE public.chat_history (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  session_id uuid DEFAULT uuid_generate_v4(),
  role character varying,
  message_content text,
  timestamp timestamp with time zone DEFAULT now(),
  is_read boolean DEFAULT false,
  CONSTRAINT chat_history_pkey PRIMARY KEY (id),
  CONSTRAINT chat_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  student_id text UNIQUE,
  username text,
  role text DEFAULT 'user'::text,
  created_at timestamp with time zone DEFAULT now(),
  avatar_url text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);