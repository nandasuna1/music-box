alter table public.album_catalog
  add column if not exists last_fetched_at timestamptz;

drop policy if exists "Authenticated users can insert artists" on public.artist;
create policy "Authenticated users can insert artists"
on public.artist
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update artists" on public.artist;
create policy "Authenticated users can update artists"
on public.artist
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can insert albums" on public.album_catalog;
create policy "Authenticated users can insert albums"
on public.album_catalog
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update albums" on public.album_catalog;
create policy "Authenticated users can update albums"
on public.album_catalog
for update
to authenticated
using (true)
with check (true);
