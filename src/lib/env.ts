import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
});

const serverEnvSchema = envSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

export type PublicEnv = z.infer<typeof envSchema>;

function publicEnvInput() {
  const strip = (v: string | undefined) => v?.replace(/\/+$/, '') || v;
  return {
    NEXT_PUBLIC_SUPABASE_URL: strip(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: strip(process.env.NEXT_PUBLIC_SITE_URL),
  };
}

/** True when real Supabase credentials are present (not the .env.example placeholders). */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  if (url.includes('your-project') || key === 'your-anon-key') return false;
  const parsed = envSchema
    .pick({ NEXT_PUBLIC_SUPABASE_URL: true, NEXT_PUBLIC_SUPABASE_ANON_KEY: true })
    .safeParse({
      NEXT_PUBLIC_SUPABASE_URL: url,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: key,
    });
  return parsed.success;
}

export function getPublicEnv(): PublicEnv {
  return envSchema.parse(publicEnvInput());
}

/** Client-safe environment variables (NEXT_PUBLIC_ prefixed only). Parsed on first access. */
export const env: PublicEnv = new Proxy({} as PublicEnv, {
  get(_target, prop: string) {
    return getPublicEnv()[prop as keyof PublicEnv];
  },
});

/** Server-only environment variables — never import on the client */
export function getServerEnv() {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv must not be called on the client');
  }
  return serverEnvSchema.parse({
    ...publicEnvInput(),
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}
