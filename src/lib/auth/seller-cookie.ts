/**
 * Cookie profil vendeur signé (HMAC-SHA256) — compatible Edge + Node.
 * Les clients ont aussi une session Supabase : sans signature, n'importe
 * lequel pourrait se fabriquer un cookie vendeur et ouvrir le dashboard.
 */

type SellerProfile = {
  id: string;
  full_name: string;
  role: 'admin' | 'seller';
  created_at: string;
};

const encoder = new TextEncoder();
let keyPromise: Promise<CryptoKey> | null = null;

function cookieSecret(): string {
  const secret = process.env.SELLER_COOKIE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('Missing SELLER_COOKIE_SECRET or SUPABASE_SERVICE_ROLE_KEY');
  return secret;
}

function hmacKey(): Promise<CryptoKey> {
  keyPromise ??= crypto.subtle.importKey(
    'raw',
    encoder.encode(`bitaqa-seller-cookie:${cookieSecret()}`),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
  return keyPromise;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(raw: string): Uint8Array<ArrayBuffer> {
  const padded = raw.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export async function encodeSellerProfile(seller: {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
}): Promise<string> {
  const payload = toBase64Url(
    encoder.encode(
      JSON.stringify({
        id: seller.id,
        full_name: seller.full_name,
        role: seller.role,
        created_at: seller.created_at,
      }),
    ),
  );
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(), encoder.encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function decodeSellerProfile(raw: string): Promise<SellerProfile | null> {
  const [payload, signature, extra] = raw.split('.');
  if (!payload || !signature || extra !== undefined) return null;

  try {
    const valid = await crypto.subtle.verify(
      'HMAC',
      await hmacKey(),
      fromBase64Url(signature),
      encoder.encode(payload),
    );
    if (!valid) return null;

    const parsed = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as Record<
      string,
      unknown
    >;
    if (
      typeof parsed.id === 'string' &&
      typeof parsed.full_name === 'string' &&
      (parsed.role === 'admin' || parsed.role === 'seller') &&
      typeof parsed.created_at === 'string'
    ) {
      return {
        id: parsed.id,
        full_name: parsed.full_name,
        role: parsed.role,
        created_at: parsed.created_at,
      };
    }
  } catch {
    return null;
  }
  return null;
}
