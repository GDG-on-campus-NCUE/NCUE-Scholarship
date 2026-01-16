-- Create a view that joins profiles with auth.users to include email
-- This allows for efficient searching and filtering by email in admin panel
CREATE OR REPLACE VIEW public.admin_profiles_view AS
SELECT
  p.id,
  p.student_id,
  p.username,
  p.role,
  p.created_at,
  p.avatar_url,
  u.email
FROM public.profiles p
JOIN auth.users u ON p.id = u.id;

-- Ensure the view is accessible (though service role bypasses this, good practice)
-- Note: Depending on RLS settings, we might not want to grant SELECT to anon/authenticated
-- GRANT SELECT ON public.admin_profiles_view TO service_role;
