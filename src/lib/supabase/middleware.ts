import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/database.types';
import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

function readSupabasePublicConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  if (url.includes('your-project') || anonKey === 'your-anon-key') return null;
  return { url, anonKey };
}

export function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.includes('auth-token'));
}

/** Uniquement pour les chemins qui doivent vraiment valider l’Auth (login / 1ʳᵉ entrée dashboard). */
export async function updateSession(
  request: NextRequest,
  response: NextResponse,
  options: { remote: true },
) {
  const config = readSupabasePublicConfig();
  if (!config) {
    return { supabase: null, user: null as User | null, response };
  }

  const supabase = createServerClient<Database>(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser = contact Auth serveur — volontaire ici seulement (pas le chemin chaud).
  void options;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user, response };
}

export function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
}

export type SessionUser = User | null;
export type MiddlewareSupabase = SupabaseClient<Database> | null;
