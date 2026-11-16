import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabase/admin';
import { isAdmin } from '@/lib/supabase/auth';
import type { Role } from '@/lib/types';

const bucket = () => process.env.SUPABASE_STORAGE_BUCKET || 'property';
async function listAll(admin: any, path: string): Promise<string[]> { const { data, error } = await admin.storage.from(bucket()).list(path, { limit: 1000 }); if (error) return []; const out: string[] = []; for (const item of data || []) { const next = path ? `${path}/${item.name}` : item.name; if (item.id) out.push(next); else out.push(...await listAll(admin, next)); } return out; }

export async function POST(request: Request) {
  const auth = await isAdmin();
  if (!auth.authorized || !auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json(); const action = String(body.action || ''); const targetId = String(body.userId || '');
  if (targetId === auth.user.id && ['disable', 'enable', 'delete', 'reset', 'set-role'].includes(action)) return NextResponse.json({ error: 'You cannot manage your own account.' }, { status: 400 });
  const admin = getAdmin();
  if (action === 'create') {
    if (typeof body.email !== 'string' || typeof body.password !== 'string' || body.password.length < 8 || typeof body.full_name !== 'string' || !body.full_name.trim()) return NextResponse.json({ error: 'Enter a name, email, and password of at least 8 characters.' }, { status: 400 });
    const { data, error } = await admin.auth.admin.createUser({ email: body.email.trim(), password: body.password, email_confirm: true, user_metadata: { full_name: body.full_name.trim() } });
    return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true, user: { id: data.user.id, email: data.user.email, full_name: body.full_name.trim() } });
  }
  if (!targetId) return NextResponse.json({ error: 'Missing user.' }, { status: 400 });
  if (action === 'disable' || action === 'delete') {
    const { data: target } = await admin.from('profiles').select('role').eq('id', targetId).maybeSingle();
    if (target?.role === 'admin') {
      const { count, error } = await admin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin');
      if (error || (count || 0) <= 1) return NextResponse.json({ error: 'The final admin account cannot be disabled or deleted.' }, { status: 400 });
    }
  }
  if (action === 'set-role') {
    const role = body.role as Role;
    if (role !== 'admin' && role !== 'user') return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
    if (role === 'user') { const { count, error } = await admin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin'); if (error) return NextResponse.json({ error: 'Unable to verify admin count.' }, { status: 503 }); if ((count || 0) <= 1) return NextResponse.json({ error: 'The final admin account cannot be demoted.' }, { status: 400 }); }
    const { error } = await admin.from('profiles').update({ role, updated_at: new Date().toISOString() }).eq('id', targetId);
    return error ? NextResponse.json({ error: 'Unable to update role.' }, { status: 400 }) : NextResponse.json({ ok: true, role });
  }
  if (action === 'reset') { if (typeof body.password !== 'string' || body.password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 }); const { error } = await admin.auth.admin.updateUserById(targetId, { password: body.password }); return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true }); }
  if (action === 'disable' || action === 'enable') { const { error } = await admin.auth.admin.updateUserById(targetId, { ban_duration: action === 'disable' ? '876000h' : 'none' }); return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true }); }
  if (action === 'delete') { const paths = await listAll(admin, targetId); if (paths.length) await admin.storage.from(bucket()).remove(paths); const { error } = await admin.auth.admin.deleteUser(targetId); return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true }); }
  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}
