# Bitaqa

Plateforme Next.js (App Router) pour vendre des cartes NFC noir mat.

## Installation

```bash
npm install
cp .env.example .env.local
```

Renseignez les clés Supabase dans `.env.local`, puis appliquez la migration `supabase/migrations/20240921120000_init.sql` (SQL Editor ou CLI).

```bash
npm run dev
```

## Variables d’environnement

Voir `.env.example` : URL et clé anon publiques, `SUPABASE_SERVICE_ROLE_KEY` côté serveur uniquement, `NEXT_PUBLIC_SITE_URL`.

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
