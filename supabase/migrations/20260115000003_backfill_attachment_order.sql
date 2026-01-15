-- Backfill display_order for existing attachments based on uploaded_at
WITH ordered_attachments AS (
  SELECT 
    id, 
    ROW_NUMBER() OVER (PARTITION BY announcement_id ORDER BY uploaded_at ASC, id ASC) - 1 as new_order
  FROM 
    public.attachments
)
UPDATE 
  public.attachments
SET 
  display_order = ordered_attachments.new_order
FROM 
  ordered_attachments
WHERE 
  public.attachments.id = ordered_attachments.id;