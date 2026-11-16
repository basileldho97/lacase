create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'user' check (role in ('admin','user')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name', 'user')
  on conflict (id) do update set email = excluded.email, full_name = excluded.full_name;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  type text not null check (type in ('Flat','House','Shop','Warehouse','Godown')),
  location text not null,
  area_sqft integer not null,
  rent integer not null,
  floor text not null check (floor in ('Ground floor','1st floor','2nd floor','3rd floor')),
  furnishing text not null check (furnishing in ('Furnished','Semi-furnished','Unfurnished')),
  mezzanine_height numeric,
  keywords text[] not null default '{}',
  photo_paths text[] not null default '{}',
  owner_name text not null,
  phone text not null,
  search_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.properties_set_search_text()
returns trigger language plpgsql as $$
begin
  new.search_text := lower(concat_ws(' ', new.title, new.type, new.location, new.floor, new.furnishing, new.owner_name, new.phone, array_to_string(new.keywords, ' ')));
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists properties_search_text_trigger on public.properties;
create trigger properties_search_text_trigger before insert or update on public.properties for each row execute function public.properties_set_search_text();
create index if not exists properties_search_text_trgm_idx on public.properties using gin (search_text gin_trgm_ops);

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
drop policy if exists "users read own profile" on public.profiles;
drop policy if exists "admins read all profiles" on public.profiles;
create policy "users read own profile" on public.profiles for select to authenticated using (id = auth.uid());
-- Admin-wide profile reads are added by 002_database_roles.sql using a database role lookup.
drop policy if exists "owners manage own properties" on public.properties;
create policy "owners manage own properties" on public.properties for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

insert into storage.buckets (id, name, public) values ('property', 'property', false) on conflict (id) do update set public = false;
drop policy if exists "users read own property photos" on storage.objects;
drop policy if exists "users upload own property photos" on storage.objects;
drop policy if exists "users update own property photos" on storage.objects;
drop policy if exists "users delete own property photos" on storage.objects;
create policy "users read own property photos" on storage.objects for select to authenticated using (bucket_id = 'property' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users upload own property photos" on storage.objects for insert to authenticated with check (bucket_id = 'property' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users update own property photos" on storage.objects for update to authenticated using (bucket_id = 'property' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'property' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users delete own property photos" on storage.objects for delete to authenticated using (bucket_id = 'property' and (storage.foldername(name))[1] = auth.uid()::text);
