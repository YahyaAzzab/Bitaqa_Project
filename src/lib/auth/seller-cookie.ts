/** Encodage cookie profil vendeur — compatible Edge + Node. */

export function encodeSellerProfile(seller: {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
}): string {
  const json = JSON.stringify(seller);
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(json, 'utf8').toString('base64url');
  }
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeSellerProfile(raw: string): {
  id: string;
  full_name: string;
  role: 'admin' | 'seller';
  created_at: string;
} | null {
  try {
    let json: string;
    if (typeof Buffer !== 'undefined') {
      json = Buffer.from(raw, 'base64url').toString('utf8');
    } else {
      const padded = raw.replace(/-/g, '+').replace(/_/g, '/');
      const binary = atob(padded);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      json = new TextDecoder().decode(bytes);
    }
    const parsed = JSON.parse(json) as Record<string, unknown>;
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
