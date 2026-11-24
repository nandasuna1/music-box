create table public.profile (
  firebase_uid text primary key,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profile enable row level security;

create policy "Users can view their own profile"
on public.profile
for select
to authenticated
using (firebase_uid = (auth.jwt()->>'sub'));

create policy "Users can create their own profile"
on public.profile
for insert
to authenticated
with check (firebase_uid = (auth.jwt()->>'sub'));

create policy "Users can update their own profile"
on public.profile
for update
to authenticated
using (firebase_uid = (auth.jwt()->>'sub'))
with check (firebase_uid = (auth.jwt()->>'sub'));