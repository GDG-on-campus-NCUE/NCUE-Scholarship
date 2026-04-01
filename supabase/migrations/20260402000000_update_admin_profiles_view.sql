-- Update admin_profiles_view to include auth provider information
CREATE OR REPLACE VIEW public.admin_profiles_view AS
SELECT
  p.id,
  p.student_id,
  p.username,
  p.role,
  p.created_at,
  p.avatar_url,
  u.email,
  u.raw_app_meta_data->>'provider' AS provider,
  u.raw_app_meta_data->'providers' AS providers
FROM public.profiles p
JOIN auth.users u ON p.id = u.id;
