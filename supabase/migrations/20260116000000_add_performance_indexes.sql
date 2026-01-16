-- Enable pg_trgm extension for GIN indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index for announcements application_end_date (sorting and filtering)
CREATE INDEX IF NOT EXISTS idx_announcements_end_date ON public.announcements (application_end_date);

-- Index for announcements category (filtering)
CREATE INDEX IF NOT EXISTS idx_announcements_category ON public.announcements (category);

-- GIN Index for announcements text search (title, summary, target_audience)
CREATE INDEX IF NOT EXISTS idx_announcements_search ON public.announcements USING GIN (title gin_trgm_ops, summary gin_trgm_ops, target_audience gin_trgm_ops);

-- Index for profiles username (search)
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);
