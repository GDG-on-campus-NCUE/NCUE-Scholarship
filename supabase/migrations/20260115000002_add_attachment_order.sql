ALTER TABLE public.attachments ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;
