-- One "band" is a shared workspace. Its entire app data (members, events,
-- yearly costs) is stored as a single JSON blob in band_data, mirroring the
-- client's AppData shape 1:1 — the whole point is that DataRepository.save()
-- can upsert this blob without needing a normalized multi-table sync.

create table if not exists public.bands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  created_at timestamptz not null default now()
);

create table if not exists public.band_members (
  band_id uuid not null references public.bands(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (band_id, user_id)
);

create table if not exists public.band_data (
  band_id uuid primary key references public.bands(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.bands enable row level security;
alter table public.band_members enable row level security;
alter table public.band_data enable row level security;

-- Membership is the access-control root: you can see a band, its members,
-- and its data only if you have a row in band_members for it.
create or replace function public.is_band_member(target_band_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.band_members
    where band_id = target_band_id and user_id = auth.uid()
  );
$$;

create policy "members can read their bands"
  on public.bands for select
  using (public.is_band_member(id));

create policy "members can read their membership rows"
  on public.band_members for select
  using (public.is_band_member(band_id));

create policy "members can read their band data"
  on public.band_data for select
  using (public.is_band_member(band_id));

create policy "members can write their band data"
  on public.band_data for update
  using (public.is_band_member(band_id))
  with check (public.is_band_member(band_id));

create policy "members can insert their band data row"
  on public.band_data for insert
  with check (public.is_band_member(band_id));

-- Creating a band and joining one by invite code both need to bypass RLS
-- for the very first insert (there's no membership yet to check against),
-- so they're security-definer functions rather than raw table policies.

create or replace function public.create_band(band_name text)
returns public.bands
language plpgsql
security definer
set search_path = public
as $$
declare
  new_band public.bands;
begin
  insert into public.bands (name) values (band_name) returning * into new_band;
  insert into public.band_members (band_id, user_id) values (new_band.id, auth.uid());
  insert into public.band_data (band_id, data) values (new_band.id, '{}'::jsonb);
  return new_band;
end;
$$;

create or replace function public.join_band_by_code(code text)
returns public.bands
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.bands;
begin
  select * into target from public.bands where invite_code = code;
  if target.id is null then
    raise exception 'Invalid invite code';
  end if;
  insert into public.band_members (band_id, user_id)
  values (target.id, auth.uid())
  on conflict (band_id, user_id) do nothing;
  return target;
end;
$$;

revoke all on function public.create_band(text) from public;
grant execute on function public.create_band(text) to authenticated;
revoke all on function public.join_band_by_code(text) from public;
grant execute on function public.join_band_by_code(text) to authenticated;
