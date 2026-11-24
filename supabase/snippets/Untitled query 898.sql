create policy "Users can insert their own profile"
on public.profile
for insert
to authenticated
with check (
  firebase_uid = (auth.jwt() ->> 'sub')
);

create policy "Users can update their own profile"
on public.profile
for update
to authenticated
using (
  firebase_uid = (auth.jwt() ->> 'sub')
)
with check (
  firebase_uid = (auth.jwt() ->> 'sub')
);