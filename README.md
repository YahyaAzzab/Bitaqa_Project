# Bitaqa

Plateforme Next.js (App Router) pour vendre des cartes NFC noir mat.

## Installation

```bash
npm install
cp .env.example .env.local
```

Renseignez les clés Supabase dans `.env.local`, puis appliquez **dans l’ordre** :

1. `supabase/migrations/20240921120000_init.sql`
2. `supabase/migrations/20240922120000_rpcs.sql`
3. `supabase/migrations/20260928120000_client_accounts.sql`
4. `supabase/migrations/20260928150000_owner_credentials.sql`
5. `supabase/migrations/20260928170000_admin_delete_profile.sql`
6. `supabase/migrations/20260928180000_suspension_reason.sql`

(SQL Editor Supabase ou CLI).

Dans Supabase › Authentication › URL Configuration : Site URL = `NEXT_PUBLIC_SITE_URL`, et ajoutez `{NEXT_PUBLIC_SITE_URL}/api/auth/confirm` aux Redirect URLs (liens de connexion des clients).

```bash
npm run dev
```

## Parcours vendeur

- `/fr/login` — connexion
- `/fr/dashboard` — accueil
- `/fr/dashboard/new` — créer un profil
- `/fr/dashboard/ready/{slug}` — lien NFC + reçu PDF
- `/fr/{slug}` — profil public (ce que le client scanne)

## Espace client

- `/fr/account/login` — connexion du commerçant (mot de passe ou lien par e-mail)
- `/fr/account` — édition de sa page : liens (glisser pour réordonner), infos, horaires, thème, statistiques, aperçu en direct

Le vendeur ouvre l’accès depuis la fiche profil (carte « Espace client ») : il saisit l’e-mail du client et lui envoie le lien de connexion unique par WhatsApp. Le client ne peut jamais modifier le lien, le plan, le statut ni l’expiration (RPC `owner_update_profile`).

Mots de passe : l’admin voit et change, depuis la fiche profil, le mot de passe attribué par l’équipe (chiffré AES-256-GCM dans `owner_credentials`, lisible uniquement par la clé service role). Dès que le commerçant choisit le sien, la copie est supprimée : il reste secret et l’admin peut seulement le réinitialiser.

## Variables d’environnement

Voir `.env.example` : URL et clé anon publiques, `SUPABASE_SERVICE_ROLE_KEY` côté serveur uniquement, `NEXT_PUBLIC_SITE_URL`, et `SELLER_COOKIE_SECRET` (optionnel, signe le cookie de rôle vendeur ; à défaut la clé service role est utilisée) et `OWNER_PASSWORD_KEY` (optionnel, chiffre les mots de passe commerçants ; à ne jamais changer une fois en production, sinon les mots de passe enregistrés deviennent illisibles) et `REVALIDATE_SECRET` (optionnel, identique en local et en production ; à défaut la clé service role est utilisée).

Les cartes pointent toujours vers le domaine de production. Une modification faite depuis un autre environnement (local, preview) appelle donc aussi `/api/revalidate` en production, avec une requête signée, pour que la page publique se mette à jour immédiatement.

La suppression d’un profil (admin uniquement) efface aussi ses liens, scans et commandes, son logo et le compte du commerçant s’il n’a pas d’autre profil. Les ventes restent en caisse avec le nom du commerce.

## Comptes vendeurs

Pas d’inscription publique. Création d’un vendeur (admin ou seller) :

```bash
npm run seller:create -- --email ada@bitaqa.ma --password "********" --name "Ada" --role seller
```

Seed de 3 profils de démonstration (après au moins un vendeur) :

```bash
npm run db:seed
# optionnel : --seller-email ada@bitaqa.ma
```

## Commandes

- `npm run dev` — développement
- `npm run build` — compilation
- `npm run lint` — ESLint + Prettier
- `npm run typecheck` — TypeScript
- `npm run test` — Vitest
- `npm run test:e2e` — Playwright
- `npm run seller:create` — créer un vendeur
- `npm run db:seed` — profils de démonstration
