-- Check for announcements where the maximum display_order does not match the count of attachments - 1
-- Ideally, if an announcement has N attachments, the display_order should range from 0 to N-1.
-- So MAX(display_order) should be equal to COUNT(*) - 1.

WITH attachment_stats AS (
    SELECT
        announcement_id,
        COUNT(*) as total_attachments,
        MAX(display_order) as max_order,
        MIN(display_order) as min_order,
        COUNT(DISTINCT display_order) as unique_orders
    FROM
        public.attachments
    GROUP BY
        announcement_id
)
SELECT
    a.title,
    s.announcement_id,
    s.total_attachments,
    s.max_order,
    s.min_order,
    s.unique_orders
FROM
    attachment_stats s
JOIN
    public.announcements a ON s.announcement_id = a.id
WHERE
    s.max_order != s.total_attachments - 1
    OR s.unique_orders != s.total_attachments;
