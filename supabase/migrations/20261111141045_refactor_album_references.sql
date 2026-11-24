
-- ==========================================
-- LISTEN LATER
-- ==========================================

-- Remove duplicated catalog metadata.
ALTER TABLE public.listen_later
  DROP COLUMN IF EXISTS album_title,
  DROP COLUMN IF EXISTS artist_name,
  DROP COLUMN IF EXISTS cover_url;

-- Ensure provider has a default.
ALTER TABLE public.listen_later
  ALTER COLUMN provider SET DEFAULT 'deezer';

-- ==========================================
-- ALBUM REVIEWS
-- ==========================================

-- Ensure provider has a default.
ALTER TABLE public.album_reviews
  ALTER COLUMN provider SET DEFAULT 'deezer';


