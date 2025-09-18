-- ===============================
-- 安全清除舊資料（表存在時才刪除）
-- ===============================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_history') THEN
    DELETE FROM public.chat_history;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'attachments') THEN
    DELETE FROM public.attachments;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'announcements') THEN
    DELETE FROM public.announcements;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    DELETE FROM public.profiles;
  END IF;
END $$;

-- ===============================
-- 建立 profiles 表
-- ===============================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id TEXT UNIQUE,
  username TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  avatar_url TEXT
);
COMMENT ON TABLE public.profiles IS 'Stores public user profile information, extending the auth.users table.';

-- ===============================
-- 建立 announcements 表
-- ===============================
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  summary TEXT,
  full_content TEXT,
  category VARCHAR(50),
  application_start_date DATE,
  application_end_date DATE,
  target_audience TEXT,
  application_limitations VARCHAR(255),
  submission_method VARCHAR(255),
  external_urls TEXT,
  source_type JSONB,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  views_count INT DEFAULT 0,
  likes_count INT DEFAULT 0,
  tags TEXT[]
);

-- ===============================
-- 建立 attachments 表
-- ===============================
CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  stored_file_path VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  file_size INT,
  mime_type VARCHAR(255)
);

-- ===============================
-- 建立 chat_history 表
-- ===============================
CREATE TABLE IF NOT EXISTS public.chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID DEFAULT uuid_generate_v4(),
  role VARCHAR(50),
  message_content TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_read BOOLEAN DEFAULT FALSE
);

-- ===============================
-- 設定 Row Level Security（RLS）
-- ===============================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ===============================
-- 建立觸發函式：handle_new_user()
-- ===============================
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, student_id)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'student_id');

  RETURN NEW;
END;
$$;
-- ===============================
-- 建立觸發器：on_auth_user_created
-- ===============================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();