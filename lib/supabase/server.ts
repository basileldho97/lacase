import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

type CookieChange = { name: string; value: string; options?: Record<string, unknown> };

function getSupabaseConfig() {
  const url = process.env.NEXT_SUPABASE_URL;
  const key = process.env.NEXT_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Supabase server configuration is incomplete.');
  return { url, key };
}

export async function createClient(onCookies?: (cookiesToSet: CookieChange[]) => void) {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseConfig();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot mutate cookies; Route Handlers can.
        }
        onCookies?.(cookiesToSet);
      },
    },
  });
}
