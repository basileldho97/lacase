import { redirect } from 'next/navigation';
import { createClient } from './server';
import type { Role } from '../types';
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null };
  const { data: profile } = await supabase.from('profiles').select('id,email,full_name,role,created_at,updated_at').eq('id', user.id).maybeSingle();
  return { supabase, user, profile: profile as { id: string; email: string; full_name: string | null; role: Role; created_at: string; updated_at: string } | null };
}
export async function requireUser(role?: Role) {
  const auth = await getCurrentUser();
  if (!auth.user) redirect('/login');
  const actual = auth.profile?.role;
  if (role === 'admin' && actual !== 'admin') redirect('/');
  if (role === 'user' && actual === 'admin') redirect('/admin');
  return { ...auth, role: actual || 'user' as Role };
}
export async function isAdmin() {
  const auth = await getCurrentUser();
  return { ...auth, authorized: auth.user !== null && auth.profile?.role === 'admin' };
}
