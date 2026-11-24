-- Artist
create table public.artist (
  id uuid primary key default gen_random_uuid(),

  provider text not null,
  artist_id text not null,
  artist_name text not null,
  picture_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint artist_provider_artist_id_key
    unique (provider, artist_id)
);

alter table public.artist enable row level security;

create policy "Authenticated users can see artists"
on public.artist
for select
to authenticated
using (true);


-- Album Catalog
create table public.album_catalog (
  id uuid primary key default gen_random_uuid(),

  provider text not null,
  album_id text not null,

  album_title text not null,
  cover_url text,
  link_url text,
  share_url text,

  genre_id text,
  artist_id text,

  contributors text[],

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint album_catalog_provider_album_id_key
    unique (provider, album_id),

  constraint album_catalog_artist_fkey
    foreign key (provider, artist_id)
    references public.artist (provider, artist_id)
);

alter table public.album_catalog enable row level security;

create policy "Authenticated users can see albums"
on public.album_catalog
for select
to authenticated
using (true);