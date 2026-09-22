# Suivi du Projet Bitaqa

Ce fichier retrace les étapes réalisées et les décisions techniques prises au cours du développement du projet Bitaqa.

## Étape 1 : Fondations du projet

**Date** : 21 Septembre 2026 — **Complète**

## Étape 2 : Design system et mouvement

**Date** : 21 Septembre 2026 — **Complète**

## Étape 3 : Base de données, authentification, rôles

**Date** : 21 Septembre 2026 — **Complète** (ops : appliquer migration + vraies clés Supabase)

---

## Étape 4 : Page profil publique

**Date** : 22 Septembre 2026 — **Complète (code)**

- Route `/{locale}/{slug}` avec cache tag `profile:{slug}`, thèmes noir/ivoire, accent profil.
- Hero, appeler / WhatsApp / vCard, liens, horaires (Africa/Casablanca), partage + QR, CTA Bitaqa.
- Profil expiré réduit ; 404 soignée ; hreflang + OG via `/api/og/[slug]`.
- APIs : `/api/vcard/[slug]`, `/api/scan` (rate limit + dédup), `/api/og/[slug]`.
- Tests Vitest : heures, URLs sûres, vCard, slug.

## Étape 5 : Coque dashboard

**Date** : 22 Septembre 2026 — **Complète (code)**

- `DashboardShell` : nav basse mobile + barre latérale desktop, en-tête compact au scroll, FAB « Nouveau » intégré.
- Accueil : KPIs du jour, alertes renouvellement / cartes prêtes, 3 derniers profils.
- Réglages : vendeur, langue, déconnexion.

## Étape 6 : Tunnel de création

**Date** : 22 Septembre 2026 — **Complète (code)**

- Wizard 5 étapes + aperçu Sheet (`ProfileView`), brouillon IndexedDB, compression logo WebP.
- RPC `create_profile_atomic` (migration `20240922120000_rpcs.sql`).
- Validation zod partagée, haptic sur succès.

## Étape 7 : Lien prêt

**Date** : 22 Septembre 2026 — **Complète (code)**

- Écran succès : copie 1 tap, check-list NFC, QR, WhatsApp, reçu PDF (`/api/receipt/[slug]`), nouveau profil.

## Étape 8 : Gestion des profils

**Date** : 22 Septembre 2026 — **Complète (code)**

- Liste searchable + filtres ; fiche avec stats scans (`profile_scan_stats`), renouveler / suspendre, invalidation tag.

## Étape 9 : Caisse

**Date** : 22 Septembre 2026 — **Complète (code)**

- Totaux jour / semaine / mois, graphique 30 j, liste ventes ; admin : soldes, remise, export CSV.

## Étape 10 : Commandes Signature

**Date** : 22 Septembre 2026 — **Complète (code)**

- Board par statut, transitions validées, timestamps ready/swapped, lien à réécrire quand prête.

## Étape 11 : Scans / stats

**Date** : 22 Septembre 2026 — **Complète (code)**

- Agrégats SQL (`profile_scan_stats`, `admin_scan_overview`), affichage fiche profil ; scan page publique non bloquant.

## Étape 12 : PWA

**Date** : 22 Septembre 2026 — **Base livrée**

- Manifest, SW cache coque, invite mise à jour. File d’attente offline complète du tunnel : brouillon local OK ; sync réseau avancée à renforcer en prod.

## Étapes 13–14 : Finitions / déploiement

**Date** : 22 Septembre 2026 — **Partiel**

- Headers sécurité (XFO, nosniff, referrer, permissions), pages légales, robots, sitemap.
- Restant ops : Lighthouse téléphone réel, Sentry, projet Supabase prod, domaines Vercel, comptes vendeurs prod, checklist NFC physique.

---

## Action immédiate pour toi

1. Coller les vraies clés dans `.env.local`.
2. Exécuter dans Supabase SQL Editor :
   - `supabase/migrations/20240921120000_init.sql`
   - `supabase/migrations/20240922120000_rpcs.sql`
3. `npm run seller:create -- --email … --password … --name … --role admin`
4. `npm run db:seed`
5. Tester sur téléphone : `/fr/atelier-nour`, login, `/dashboard/new`.

## Vérifications locales

- `npm run typecheck` — OK
- `npm run test` — 32 tests OK
- `npm run build` — OK

## Prochaine action

Valider sur vrai téléphone (critères AGENTS), puis commit propre étape par étape si tu le demandes.
