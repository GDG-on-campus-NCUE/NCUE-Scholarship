-- Migration to add has_agreed_to_terms to profiles table

-- 1. 新增 has_agreed_to_terms 欄位到 profiles 表
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_agreed_to_terms boolean DEFAULT false;

-- 2. 更新 handle_new_user 函數以包含此欄位
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, email, role, has_agreed_to_terms)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    new.email,
    'user',
    false
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    username = EXCLUDED.username,
    avatar_url = EXCLUDED.avatar_url,
    email = EXCLUDED.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
