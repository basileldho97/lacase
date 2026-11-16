import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  let email = '';
  try {
    const body = await request.json();
    email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });

    const pendingCookies: Parameters<NonNullable<Parameters<typeof createClient>[0]>>[0] = [];
    const supabase = await createClient((cookiesToSet) => pendingCookies.push(...cookiesToSet));
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      console.warn('[auth/login] Supabase sign-in failed', {
        email,
        status: error?.status ?? null,
        code: error?.code ?? null,
        message: error?.message ?? 'No user returned',
      });
      return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
    if (profileError) return NextResponse.json({ error: 'profile_unavailable' }, { status: 503 });
    if (!profile) return NextResponse.json({ error: 'profile_missing' }, { status: 403 });
    const role = profile.role === 'admin' ? 'admin' : 'user';
    const response = NextResponse.json({ ok: true, role, redirect: role === 'admin' ? '/admin' : '/' });
    pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    console.info('[auth/login] Sign-in succeeded', {
      email,
      userId: data.user.id,
      role,
    });
    return response;
  } catch (error) {
    console.error('[auth/login] Unexpected server error', {
      email,
      message: error instanceof Error ? error.message : 'unknown error',
    });
    return NextResponse.json({ error: 'auth_service_unavailable' }, { status: 503 });
  }
}
