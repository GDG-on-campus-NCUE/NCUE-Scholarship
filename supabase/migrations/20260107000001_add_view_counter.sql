-- 1. Add view_count column to announcements table
ALTER TABLE public.announcements 
ADD COLUMN view_count INTEGER DEFAULT 0 NOT NULL;

-- 2. Create table for tracking views (for de-duplication)
CREATE TABLE public.announcement_views (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    announcement_id uuid NOT NULL,
    ip_address inet NOT NULL,
    viewed_at timestamp with time zone DEFAULT now(),
    CONSTRAINT announcement_views_pkey PRIMARY KEY (id),
    CONSTRAINT announcement_views_announcement_id_fkey FOREIGN KEY (announcement_id) 
        REFERENCES public.announcements(id) ON DELETE CASCADE
);

-- Create index to speed up de-duplication queries
CREATE INDEX idx_announcement_views_check 
ON public.announcement_views (announcement_id, ip_address, viewed_at);

-- 3. Trigger Function to auto-increment view_count
CREATE OR REPLACE FUNCTION public.increment_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.announcements
    SET view_count = view_count + 1
    WHERE id = NEW.announcement_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Bind Trigger
CREATE TRIGGER on_view_created
AFTER INSERT ON public.announcement_views
FOR EACH ROW
EXECUTE FUNCTION public.increment_view_count();
