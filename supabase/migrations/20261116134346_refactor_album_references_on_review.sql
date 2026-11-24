-- ==========================================
-- ALBUM REVIEW
-- ==========================================

-- Remove duplicated catalog metadata.
ALTER TABLE public.album_reviews
  DROP COLUMN IF EXISTS album_title,
  DROP COLUMN IF EXISTS cover_url;