-- 1. 新增欄位到 profiles 表 (移除 year 與 department)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- 2. 建立或更新處理新用戶的函數
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    new.email,
    'user'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    username = EXCLUDED.username,
    avatar_url = EXCLUDED.avatar_url,
    email = EXCLUDED.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 建立觸發器 (如果尚不存在)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;
