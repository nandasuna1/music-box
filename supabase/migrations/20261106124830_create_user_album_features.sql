-- Albums saved for later
create table public.listen_later (
  user_id text not null
    default (auth.jwt() ->> 'sub')
    references public.profile(firebase_uid)
    on delete cascade,

  provider text not null default 'deezer',
  album_id text not null,

  created_at timestamptz not null default now(),

  primary key (user_id, provider, album_id)
);

-- User album reviews
create table public.album_reviews (
  id uuid primary key default gen_random_uuid(),

  user_id text not null
    default (auth.jwt() ->> 'sub')
    references public.profile(firebase_uid)
    on delete cascade,

  provider text not null default 'deezer',
  album_id text not null,

  rating smallint not null
    check (rating between 1 and 5),

  comment varchar(256),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint unique_user_album_review
    unique (user_id, provider, album_id)
);

-- Useful for querying reviews by album
create index album_reviews_album_idx
  on public.album_reviews (provider, album_id);

-- Enable RLS
alter table public.listen_later enable row level security;
alter table public.album_reviews enable row level security;

-- Listen later: users can only access their own records
create policy "Users can view their own listen later"
on public.listen_later
for select to authenticated
using (user_id = (auth.jwt() ->> 'sub'));

create policy "Users can add their own listen later"
on public.listen_later
for insert to authenticated
with check (user_id = (auth.jwt() ->> 'sub'));

create policy "Users can remove their own listen later"
on public.listen_later
for delete to authenticated
using (user_id = (auth.jwt() ->> 'sub'));

-- Reviews: all authenticated users can read reviews
create policy "Authenticated users can view album reviews"
on public.album_reviews
for select to authenticated
using (true);

-- Users can only create their own reviews
create policy "Users can create their own album reviews"
on public.album_reviews
for insert to authenticated
with check (user_id = (auth.jwt() ->> 'sub'));

create policy "Users can update their own album reviews"
on public.album_reviews
for update to authenticated
using (user_id = (auth.jwt() ->> 'sub'))
with check (user_id = (auth.jwt() ->> 'sub'));

create policy "Users can delete their own album reviews"
on public.album_reviews
for delete to authenticated
using (user_id = (auth.jwt() ->> 'sub'));