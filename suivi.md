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

**Prochaine étape** : Validation de l'étape 1 (build, lint, et exécution des tests unitaires et e2e) pour s'assurer que les fondations sont solides, puis passage à l'étape 2 (Design system).

