import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (items) => items.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
      },
    },
  );
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) console.warn('[auth/middleware] Session check failed', { path: request.nextUrl.pathname, message: error.message });

  const path = request.nextUrl.pathname;
  const isAuthApi = path.startsWith('/api/auth/');
  const isStatic = path.startsWith('/_next') || path.startsWith('/favicon') || path === '/robots.txt';
  const redirectWithCookies = (destination: string) => {
    const redirect = NextResponse.redirect(new URL(destination, request.url));
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  if (!user && path !== '/login' && !isAuthApi && !isStatic) return redirectWithCookies('/login');
  if (isAuthApi || isStatic) return response;
  let role: 'admin' | 'user' | undefined;
  if (user) {
    const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (!profileError && profile) role = profile.role === 'admin' ? 'admin' : 'user';
  }
  if (user && path === '/login') return redirectWithCookies(role === 'admin' ? '/admin' : '/');
  if (user && path.startsWith('/admin') && role !== 'admin') return redirectWithCookies('/');
  if (user && role === 'admin' && (path === '/' || path === '/new' || path.startsWith('/listings/') || path.startsWith('/account/'))) return redirectWithCookies('/admin');
  return response;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
