-- Role migration for the existing public.profiles table.
-- Safe to run after 001_private_schema.sql: existing roles are preserved.

alter table public.profiles add column if not exists updated_at timestamptz not null default now();
update public.profiles set role = 'user' where role is null or role not in ('admin', 'user');
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'user'));

-- Backfill only missing profiles; never overwrite an existing role.
insert into public.profiles (id, email, full_name, role)
select id, email, raw_user_meta_data ->> 'full_name', 'user'
from auth.users
on conflict (id) do nothing;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name', 'user')
  on conflict (id) do update set email = excluded.email, full_name = excluded.full_name, updated_at = now();
  return new;
end;
$$;

create or replace function public.profiles_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.profiles_set_updated_at();

-- SECURITY DEFINER avoids recursive RLS evaluation when checking an admin.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

alter table public.profiles enable row level security;
drop policy if exists "users read own profile" on public.profiles;
drop policy if exists "admins read all profiles" on public.profiles;
drop policy if exists "users update own profile" on public.profiles;
create policy "users read own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "admins read all profiles" on public.profiles for select to authenticated using (public.is_admin());
-- No INSERT, UPDATE, or DELETE policy is granted to authenticated users.
-- Role changes are performed by the server with SUPABASE_SECRET_KEY.

revoke update (role) on public.profiles from authenticated, anon;
