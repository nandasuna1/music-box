alter table public.album_catalog
add column cached_at timestamptz not null default now(),
add column source text not null default 'deezer';