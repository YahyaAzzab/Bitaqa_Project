// The login link is a one-time credential: it never goes in the URL and is read only once.
const KEY_PREFIX = 'bitaqa:owner-link:';

export function stashOwnerLink(slug: string, link: string): void {
  try {
    sessionStorage.setItem(KEY_PREFIX + slug, link);
  } catch {
    /* sessionStorage indisponible : le vendeur génère un nouveau lien */
  }
}

export function takeOwnerLink(slug: string): string | null {
  try {
    const link = sessionStorage.getItem(KEY_PREFIX + slug);
    sessionStorage.removeItem(KEY_PREFIX + slug);
    return link;
  } catch {
    return null;
  }
}
