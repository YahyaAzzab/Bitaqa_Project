# Suivi du Projet Bitaqa

Ce fichier retrace les étapes réalisées et les décisions techniques prises au cours du développement du projet Bitaqa.

## Étape 1 : Fondations du projet

**Date** : 21 Septembre 2026

**Tâches accomplies** :

- Initialisation du projet avec Next.js 15 (App Router), React 19, TypeScript strict, et Tailwind CSS v4.
- Configuration des dossiers principaux (`src/app/[locale]`, `src/features`, `src/components/ui`, `src/lib`, `src/messages`, `src/tests`).
- Configuration de `next-intl` pour la gestion bilingue (fr, ar) avec basculement automatique et support de la direction RTL.
- Configuration du client Supabase avec `@supabase/ssr` en incluant des séparations claires entre client, serveur et middleware (gestion de session).
- Création de `src/lib/env.ts` avec `zod` pour garantir la validation des variables d'environnement au démarrage et éviter d'exposer accidentellement la clé service role sur le front.
- Création des fichiers de configuration globaux : `.prettierrc`, `.env.example`, `vitest.config.ts`, `playwright.config.ts`, et `README.md`.
- Ajout de tests de fumée pour la configuration de la langue et le rendu RTL.

**Choix techniques et Déviations par rapport au plan initial** :

- Le plan suggérait une version non spécifiée, j'ai opté pour les toutes dernières versions stables et performantes (Next.js 15, React 19, Tailwind CSS v4).
- J'ai ajouté une validation stricte des variables d'environnement avec Zod dès le début du projet pour empêcher tout problème de déploiement par la suite.
- L'arborescence des fichiers met l'accent sur le répertoire `src/` pour une structure plus propre du code source, en séparant la logique applicative de la configuration racine.

## Étape 2 : Design system et mouvement

**Date** : 21 Septembre 2026

**Tâches accomplies** :

- Tokens CSS (noir / ivoire), accent surchargeable, rayons, ombres discrètes, courbes et durées.
- Polices Instrument Sans (latin) et IBM Plex Sans Arabic via `next/font`.
- Composants `components/ui` : Button, IconButton, Input, Textarea, PhoneInput, Select, Switch, Chip, Card, Sheet, Dialog, Toast, Tabs, Skeleton, EmptyState, Badge, Avatar, SegmentedControl.
- Utilitaires de mouvement, hook `useReducedMotion`, `MotionConfig reducedMotion="user"`.
- Page `/design` bilingue, `noindex`, masquée en production.
- Tests Vitest du numéro marocain et e2e de `/design` FR/AR.

**Choix techniques** :

- Select natif (meilleur clavier mobile) plutôt qu’une listbox custom.
- `cn()` via `clsx` + `tailwind-merge` ; variantes via `class-variance-authority`.

**Prochaine étape** : Étape 3 — base de données, authentification, rôles (après validation visuelle sur téléphone).

## Étape 3 : Base de données, authentification, rôles

**Date** : 21 Septembre 2026

**Tâches accomplies** :

- Migration versionnée `supabase/migrations/20240921120000_init.sql` (copie du `schema.sql` source de vérité).
- Types TypeScript générés à la main depuis le schéma (`src/lib/supabase/database.types.ts`) et clients Supabase génériques.
- Helpers de rôles alignés sur la RLS : ventes du vendeur vs admin, lecture publique hors profils suspendus.
- Auth e-mail / mot de passe, sans inscription publique. Script `scripts/create-seller.ts`.
- Middleware : `/dashboard` exige une session **et** une ligne `sellers`, sinon redirection vers `/login`.
- Page `/login` mobile bilingue (clavier, visualViewport, erreurs claires).
- Seed `scripts/seed.ts` : Atelier Nour, Studio Lina, Cuivre & Fil, logos SVG locaux uploadés dans le bucket `logos`.
- Tests Vitest des helpers de rôles ; Playwright : login FR/AR et redirection dashboard.

**Écarts** :

- Les types ne sont pas générés via `supabase gen types` (pas de projet CLI lié) ; ils suivent le SQL à la main.
- L’écran dashboard est volontairement minimal (protection + déconnexion). La coque native est l’étape 5.
- La page profil public n’est pas encore construite (étape 4) ; la lisibilité sans connexion est garantie par la politique RLS `profiles_public_read`.

---

## Où en est le code (21 septembre 2026, soir)

**Étape courante** : fin de l’étape 3 + correctifs de runtime. **Étape 4 (profil public) pas commencée.**

### Fait dans le code

- Étapes 1–3 : fondations, design system, SQL, types, login, middleware auth, scripts vendeur/seed, tests rôles/paths/auth e2e.
- **Hydratation `/design`** : `data-theme` n’est plus un prop React sur `<html>`. `AppProviders` l’écrit après paint via `useEffect` ; `suppressHydrationWarning` sur `<html>`. Accent via `--accent` sur `documentElement`.
- **Crash Zod du middleware** : `env.ts` ne parse plus au chargement du module. Le middleware Edge **n’importe plus** `env.ts`. Sans vraies clés Supabase, i18n continue ; `/dashboard` redirige quand même vers `/login`.
- `.env.local` créé depuis l’exemple (placeholders `your-project` / `your-anon-key`). **Gitignored.** À remplacer par le projet Supabase réel.

### Pas encore validé

- Typecheck / lint / build après ces correctifs.
- `/design` dans le navigateur : thème noir/ivoire, sheet, dialog, toast, locale AR.
- Login réel + RLS (impossible tant que `.env.local` n’a pas l’URL et les clés du projet).
- `npm run seller:create` / `npm run db:seed`.

### Fichiers touchés récemment

- `src/lib/env.ts`, `src/lib/supabase/middleware.ts`, `src/middleware.ts`
- `src/components/providers.tsx`, `src/app/[locale]/layout.tsx`
- `src/app/[locale]/design/design-gallery.tsx`
- `.env.local` (local seulement)

### Prochaine action concrète

1. Relancer `npm run dev`, vérifier `/fr/design` puis `/ar/design`.
2. Coller les vraies clés Supabase dans `.env.local`, appliquer `supabase/migrations/20240921120000_init.sql`.
3. Alors seulement : tester login / dashboard, puis **étape 4 — page profil publique**.
