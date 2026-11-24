SELECT user_id, provider, album_id, COUNT(*)
FROM public.album_reviews
GROUP BY user_id, provider, album_id
HAVING COUNT(*) > 1;