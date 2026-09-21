# Prompts agent : plateforme cartes NFC

## Mode d'emploi

1. Fais les étapes **dans l'ordre**, une par session. Ne passe à la suivante que si tous les critères d'acceptation sont validés sur un vrai téléphone.
2. À l'étape 3, joins le fichier `schema.sql`.
3. Après chaque étape, demande un commit propre avec un message clair.

---

## Contexte permanent (à coller une seule fois)

```
Tu construis Bitaqa, une plateforme web pour vendre des cartes NFC noir mat (format carte bancaire) qui remplacent les cartes de visite.

FONCTIONNEMENT MÉTIER
- Deux vendeurs vont chez des commerçants (boutiques de vêtements, maquillage, tout business). Ils créent le profil du client depuis leur téléphone en moins de 5 minutes.
- Le vendeur écrit ensuite l'URL du profil sur la carte avec l'app NFC Tools et remet la carte immédiatement. La plateforme ne pilote pas l'écriture NFC.
- L'URL est courte et stable : (on laisse l url a la fin). Le contenu du profil reste modifiable sans réécrire la carte.
- Paiement uniquement en cash, enregistré dans la plateforme.
- Deux plans : Essentiel et Signature (carte personnalisée). Pour Signature, le client reçoit d'abord une carte standard, puis le vendeur revient échanger contre la carte imprimée et réécrit le même lien.
- Profils bilingues français et arabe (RTL), le visiteur peut basculer.

PRIORITÉ ABSOLUE
Le rendu mobile. Chaque écran doit sembler conçu par un studio de design produit senior, pas généré. Le vendeur utilise l'app devant un client : elle doit être rapide, fluide et impressionnante. Le visiteur qui scanne la carte doit voir un profil qui donne envie d'acheter la carte.

STACK
Dernières versions stables de : Next.js (App Router), React, TypeScript en mode strict, Tailwind CSS, Motion (framer-motion), next-intl, Supabase (Postgres, Auth, Storage, RLS) via @supabase/ssr, zod, react-hook-form, Vitest, Playwright. Déploiement Vercel.

QUALITÉ DE CODE
- TypeScript strict, aucun `any`, aucun `@ts-ignore`.
- Organisation par fonctionnalité (features/), composants UI génériques dans components/ui.
- Validation zod partout (formulaires, server actions, routes API). Types partagés.
- Server actions et routes API : vérifier l'auth et le rôle, ne jamais faire confiance au client, ne jamais exposer la clé service role au navigateur.
- Gestion d'erreurs explicite avec messages utilisateur en français et en arabe. Pas de console.log restant.
- Commentaires rares et utiles (le pourquoi, jamais le quoi). Pas de TODO, pas de code mort, pas de fichiers de démonstration.
- Nommage cohérent, fonctions courtes, composants à responsabilité unique.
- ESLint + Prettier configurés, le build doit passer sans warning.

DESIGN (aucun aspect "template IA")
- Direction : noir mat profond, ivoire chaud, un seul accent laiton discret. Cohérent avec l'objet physique.
- Interdits : dégradés violet/bleu, glassmorphism partout, ombres génériques, cartes arrondies identiques empilées, emojis comme icônes, illustrations génériques, textes lorem, libellés génériques du type "Bienvenue".
- Une échelle d'espacement stricte (4/8 px), une échelle typographique à hiérarchie marquée, des rayons cohérents, des bordures fines à faible contraste plutôt que des ombres lourdes.
- Icônes : un seul jeu cohérent (Lucide ou Phosphor), trait uniforme.
- Micro-textes soignés, écrits comme par un rédacteur produit, en français et en arabe naturel (pas de traduction mot à mot).
- États complets partout : chargement (skeletons à la forme du contenu), vide, erreur, succès, hors ligne.

MOUVEMENT
- Uniquement transform et opacity. Courbe principale cubic-bezier(0.22, 1, 0.36, 1), durées 150 à 350 ms, ressorts pour les feuilles et sheets.
- Feedback tactile visuel sur chaque élément pressable (léger scale). Transitions de page fluides (View Transitions API ou équivalent). Listes avec apparition échelonnée.
- Respecter prefers-reduced-motion.
- Aucune animation gratuite : chaque mouvement clarifie un changement d'état ou guide l'œil.

MOBILE D'ABORD
- Conçu à 375 px, testé de 320 à 430 px, puis adapté aux tablettes et desktop.
- Cibles tactiles 48 px minimum, zone du pouce pour les actions principales, gestion du clavier virtuel (visualViewport), safe areas iOS, inputmode et enterkeyhint corrects, aucun zoom involontaire (police d'input 16 px minimum).

ARABE ET RTL
- Propriétés logiques CSS uniquement (margin-inline, padding-inline, start/end), jamais left/right.
- Icônes directionnelles inversées en RTL. Numéros de téléphone, URLs et e-mails toujours en dir="ltr" isolés. Chiffres occidentaux.
- Polices arabes de qualité (ex. IBM Plex Sans Arabic ou Readex Pro), interlignage adapté, poids équilibrés avec la police latine.

PERFORMANCE
- Page profil publique : LCP sous 1,5 s sur Android milieu de gamme en 4G, CLS proche de 0, moins de 90 Ko de JS gzip. Rendu statique avec revalidation à la demande.
- Polices auto-hébergées via next/font avec sous-ensembles latin et arabe. Images via next/image, logos en WebP.

SÉCURITÉ
- Liens de profil : n'accepter que les schémas https, tel, mailto. Refuser javascript: et data:.
- Échapper tout contenu utilisateur. Valider type et taille des fichiers uploadés. Limiter le débit des routes publiques. En-têtes de sécurité (CSP, etc.).

MÉTHODE DE TRAVAIL
À la fin de chaque étape : résumer ce qui a été fait, lister les fichiers créés, vérifier les critères d'acceptation un par un, signaler tout écart. Ne pas anticiper les étapes suivantes.
```

---

## Étape 1 : Fondations du projet

```
Initialise le projet.

TÂCHES
- Crée l'app Next.js (App Router, TypeScript strict, Tailwind, ESLint, Prettier) avec la structure : app/[locale]/, features/, components/ui/, lib/, messages/, tests/.
- Configure next-intl avec les locales fr (défaut) et ar. La direction (dir) est posée sur <html> selon la locale. Middleware de locale : détecter la langue du navigateur, mémoriser le choix.
- Configure les variables d'environnement avec validation zod au démarrage (fichier lib/env.ts) et un .env.example.
- Configure Vitest et Playwright (un test de fumée qui ouvre la page d'accueil en FR et AR).
- Ajoute des scripts npm : dev, build, lint, typecheck, test, test:e2e.
- Crée les clients Supabase (navigateur, serveur, service role côté serveur uniquement) avec @supabase/ssr.
- README court : installation, variables, commandes.

CRITÈRES D'ACCEPTATION
- npm run build, lint, typecheck passent sans warning.
- /fr et /ar répondent, /ar est en RTL.
- Aucune clé secrète accessible côté client.
```

---

## Étape 2 : Design system et mouvement

```
Construis le design system avant toute page.

TÂCHES
- Tokens dans des variables CSS : couleurs (noir mat, surfaces étagées, ivoire, accent laiton, états succès/erreur/avertissement), rayons, espacements, ombres très discrètes, z-index, durées et courbes de mouvement. Deux thèmes : "noir" (défaut) et "ivoire". Prévois la couleur d'accent surchargeable par profil.
- Typographie : police latine premium sobre (ex. Geist ou Instrument Sans) et police arabe équilibrée (ex. IBM Plex Sans Arabic), via next/font. Échelle typographique complète avec styles pour titres, corps, légendes, chiffres tabulaires.
- Composants dans components/ui, tous accessibles et animés avec finesse : Button (variantes, état chargement avec spinner intégré sans changer la largeur), IconButton, Input, Textarea, PhoneInput (préfixe +212, normalisation), Select, Switch, Chip, Card, Sheet (bottom sheet avec geste de glissement et ressort), Dialog, Toast, Tabs (indicateur animé), Skeleton, EmptyState, Badge, Avatar, SegmentedControl.
- Utilitaire de mouvement partagé (variants, transitions, stagger) et hook de respect de prefers-reduced-motion.
- Une page /design (protégée en production) qui présente tous les composants et états en FR et AR.

CRITÈRES D'ACCEPTATION
- Chaque composant fonctionne au clavier, a un état focus visible, et ne casse pas en RTL.
- Contraste AA minimum.
- Cohérence visuelle : l'ensemble doit sembler issu d'un vrai design system, pas d'une collection de composants par défaut.
```

---

## Étape 3 : Base de données, authentification, rôles

```
Mets en place la base de données et l'accès. Le fichier C:\Users\HP\Documents\NFC_Project\schema.sql est joint : il est la source de vérité.

TÂCHES
- Applique schema.sql dans Supabase (migration versionnée dans supabase/migrations).
- Génère les types TypeScript depuis le schéma et expose des helpers typés.
- Authentification par e-mail + mot de passe pour les vendeurs (pas d'inscription publique). Un script scripts/create-seller.ts crée un vendeur avec son rôle (admin ou seller).
- Middleware : toute route sous /dashboard exige une session et une ligne dans sellers. Redirection propre vers /login sinon.
- Page /login mobile, soignée, bilingue, avec états d'erreur clairs et gestion du clavier.
- Script de seed : 3 profils de démonstration réalistes (un magasin de vêtements, un salon de maquillage, un artisan), avec noms FR et AR, liens, et logos placeholder générés localement.
- Tests Vitest sur les helpers de rôles.

CRITÈRES D'ACCEPTATION
- Un utilisateur non connecté ne peut rien lire sous /dashboard, ni écrire en base.
- Un vendeur ne voit que ses propres ventes, l'admin voit tout (vérifié par test).
- Le profil public est lisible sans connexion.
```

---

## Étape 4 : Page profil publique (la vitrine)

```
Construis la page publique /{locale}/{slug}. C'est ce que le client final et ses propres clients verront en scannant la carte : elle doit être irréprochable.

CONTENU ET COMPORTEMENT
- Hero : logo (avatar soigné avec fallback typographique élégant si absent), nom du business, accroche, adresse. Entrée animée en séquence courte et élégante.
- Boutons d'action principaux en zone du pouce : Appeler, WhatsApp, Enregistrer le contact.
- Liste des liens (Instagram, Facebook, TikTok, site, Maps, e-mail, personnalisés) avec icônes cohérentes, apparition échelonnée, état pressé tactile.
- Horaires d'ouverture avec indication "Ouvert maintenant / Fermé" calculée à l'heure du Maroc.
- Bascule FR/AR discrète avec transition fluide, sans rechargement visible. La langue par défaut suit le profil, puis le navigateur.
- Deux thèmes (noir mat, ivoire) et couleur d'accent du profil appliquée avec parcimonie.
- Bouton de partage (Web Share API, avec repli copier le lien) et petit QR code affiché dans une sheet.
- Pied de page discret {{NOM_MARQUE}} avec appel à l'action pour commander sa propre carte.
- Profil expiré : affichage réduit propre (nom et bouton d'appel seulement) avec message neutre, jamais une page d'erreur.
- Profil inexistant : 404 soignée dans la langue courante.

TECHNIQUE
- Rendu statique avec revalidation à la demande (tag par slug), invalidée à chaque modification du profil.
- Motion en chargement léger (LazyMotion, composants "m"). Budget JS respecté.
- Route /api/vcard/[slug] : génère un fichier vCard 3.0 en UTF-8 (nom FR et AR, téléphone, e-mail, site, adresse, logo si possible), téléchargement direct correct sur iPhone et Android.
- Image Open Graph dynamique par profil (next/og), avec logo, nom et couleur d'accent, pour un aperçu réussi dans WhatsApp.
- Route /api/scan : enregistre un scan de façon asynchrone sans ralentir l'affichage (pays via en-tête, type d'appareil), avec limitation de débit. L'ouverture de la page ne doit jamais dépendre de cet appel.
- Métadonnées, balise hreflang, robots adaptés.
- Tests Vitest : générateur vCard, validation des schémas d'URL, calcul ouvert/fermé.

CRITÈRES D'ACCEPTATION
- Lighthouse mobile : performance 95 et plus, accessibilité 100, sur les profils de seed.
- Rendu impeccable en FR et AR de 320 à 430 px.
- Le contact s'enregistre correctement sur iOS et Android, noms arabes compris.
- L'aperçu du lien dans WhatsApp affiche l'image OG.
```

---

## Étape 5 : Coque du dashboard mobile

```
Construis la structure de l'application vendeur, pensée comme une app native.

TÂCHES
- Layout /dashboard mobile d'abord : barre de navigation basse (Accueil, Profils, Caisse, Commandes) avec indicateur animé, en-tête contextuel avec titre qui se réduit au défilement, safe areas gérées.
- Bouton d'action principal "Nouveau profil" toujours accessible (bouton flottant intégré à la barre, pas un FAB générique).
- Transitions de page fluides entre sections, avec conservation de la position de défilement au retour.
- Écran Accueil : chiffres du jour (profils créés, encaissé), 3 derniers profils, alertes utiles (renouvellements proches, cartes prêtes à échanger). Skeletons pendant le chargement, états vides soignés.
- Pull-to-refresh discret. Sélecteur de langue FR/AR dans les réglages, page Réglages minimale (profil du vendeur, déconnexion).
- Sur desktop : mise en page adaptée (barre latérale) sans casser l'expérience mobile.

CRITÈRES D'ACCEPTATION
- Navigation à une main, fluide à 60 fps sur téléphone milieu de gamme.
- Aucun décalage de mise en page au chargement.
- Fonctionne en RTL complet.
```

---

## Étape 6 : Tunnel de création de profil (le cœur du produit)

```
Construis /dashboard/new : créer un profil complet en moins de 5 minutes, chez le client, sur un téléphone, souvent avec un réseau moyen. C'est l'écran le plus important : il doit être rapide, guidé et agréable.

STRUCTURE
Parcours en étapes avec barre de progression animée, retour possible à tout moment, action principale fixe en bas au-dessus du clavier.
1. L'activité : nom du business (FR), nom en arabe (optionnel), accroche courte. Le slug se génère automatiquement (translittération des accents et de l'arabe, minuscules, tirets), vérification de disponibilité en direct avec debounce, modifiable, suggestions si pris.
2. Contact : téléphone (format marocain, normalisation en +212, validation), case "même numéro pour WhatsApp", e-mail optionnel, adresse optionnelle avec lien Maps optionnel.
3. Liens : ajout rapide par puces (Instagram, Facebook, TikTok, site, autre) ; champ intelligent qui accepte un @pseudo ou une URL et reconstruit le lien correct ; réordonnement par glisser-déposer tactile.
4. Identité visuelle : logo par appareil photo ou galerie, recadrage carré, compression côté client en WebP (200 Ko max), couleur d'accent proposée automatiquement depuis le logo, choix du thème.
5. Plan et encaissement : choix Essentiel ou Signature avec prix affichés, montant cash pré-rempli et modifiable, confirmation "Espèces encaissées". Si Signature, saisie des notes de design et du logo pour la commande d'impression.

APERÇU EN DIRECT
Un aperçu du vrai profil se met à jour pendant la saisie, accessible via un bouton "Aperçu" ouvrant une sheet plein écran (et aperçu fixe à côté du formulaire sur grand écran). Il utilise exactement les mêmes composants que la page publique.

ROBUSTESSE
- Brouillon sauvegardé automatiquement (IndexedDB) à chaque champ, reprise proposée si l'app est fermée en cours de route.
- Envoi tolérant au réseau : nouvelle tentative automatique, état clair "En attente de connexion", aucune perte de données.
- Création atomique côté serveur : profil, liens, vente, et commande éventuelle dans une seule transaction (fonction SQL ou RPC). Le slug est revérifié côté serveur.
- Validation zod partagée client et serveur, erreurs affichées au champ concerné dans la langue courante.
- Retour haptique léger sur mobile compatible (navigator.vibrate) aux moments clés.

DÉTAILS DE FINITION
- Chaque étape apparaît avec une transition directionnelle (inversée en RTL).
- Focus automatique sur le premier champ, bon clavier (tel, url, email), touche Entrée qui avance.
- Aucun champ inutile : tout ce qui n'est pas indispensable est optionnel et repliable.

CRITÈRES D'ACCEPTATION
- Un profil complet se crée en moins de 3 minutes une fois l'utilisateur habitué.
- Aucune perte de saisie en cas de coupure réseau ou de fermeture de l'app.
- Tests Vitest : translittération du slug, normalisation des numéros, extraction des pseudos. Test Playwright du parcours complet sur viewport mobile, en FR et en AR.
```

---

## Étape 7 : Écran "Lien prêt" (passage à NFC Tools)

```
Après la création, construis l'écran de succès qui permet de finir la vente en 30 secondes.

TÂCHES
- Animation de validation sobre et élégante (pas de confettis).
- Lien complet affiché en grand, lisible, avec bouton "Copier le lien" au retour visuel immédiat (le bouton confirme la copie).
- Petit guide en 4 lignes pour NFC Tools : Écrire, Ajouter un enregistrement, URL, coller, Écrire, approcher la carte. Rendu comme une mini check-list interactive que le vendeur coche.
- Bouton "Tester le profil" (ouvre la page publique dans un nouvel onglet) et rappel de scanner la carte avec le téléphone avant de la remettre.
- Actions secondaires : afficher le QR code plein écran, partager le lien par WhatsApp au client, imprimer ou télécharger le reçu PDF.
- Génération du reçu PDF côté serveur : nom du client, plan, montant en MAD, date, vendeur, numéro de reçu séquentiel. Mise en page propre et professionnelle avec {{NOM_MARQUE}}.
- Bouton "Nouveau profil" pour enchaîner.

CRITÈRES D'ACCEPTATION
- Depuis la fin du tunnel jusqu'au lien copié : un seul tap.
- Le reçu PDF est propre, bilingue selon la langue du profil, et se télécharge sur mobile.
```

---

## Étape 8 : Gestion des profils

```
Construis la gestion des profils existants.

TÂCHES
- Liste /dashboard/profiles : recherche instantanée, filtres (statut, plan, vendeur pour l'admin), tri, défilement fluide, cartes compactes avec logo, nom, plan, statut et date d'expiration. Balayage latéral pour actions rapides (appeler, ouvrir, copier le lien).
- Fiche profil : aperçu, statistiques de scans, historique des ventes, statut de commande éventuel, actions (modifier, copier le lien, renouveler, suspendre pour l'admin).
- Édition : réutilise les composants du tunnel, enregistre avec revalidation immédiate de la page publique.
- Renouvellement : action "Renouveler 1 an" qui crée une vente de type renewal avec montant cash et repousse expires_at d'un an à partir de la date d'expiration si le profil est encore actif, sinon à partir d'aujourd'hui.
- Mise à niveau vers Signature depuis la fiche : crée la vente custom_upgrade et la commande d'impression.
- Statut expiré calculé automatiquement (tâche planifiée Supabase ou vérification à la lecture).
- Confirmation avant toute action destructive ou sensible.

CRITÈRES D'ACCEPTATION
- Recherche instantanée sur 500 profils sans lenteur.
- Toute modification se voit sur la page publique en quelques secondes.
```

---

## Étape 9 : Ventes cash et caisse

```
Construis le suivi financier simple.

TÂCHES
- Écran Caisse : pour le vendeur connecté, total encaissé du jour, de la semaine, du mois ; liste des ventes avec type (initiale, personnalisation, renouvellement), profil, montant.
- Vue admin : solde de chaque vendeur (encaissé, remis, à remettre) depuis la vue seller_cash_balance, historique des remises d'espèces, formulaire d'enregistrement d'une remise.
- Graphique sobre des encaissements sur 30 jours (composant léger, animé à l'apparition, accessible avec alternative textuelle).
- Export CSV des ventes par période (admin).
- Formatage MAD cohérent en FR et AR.

CRITÈRES D'ACCEPTATION
- Les totaux correspondent exactement aux lignes de ventes.
- Un vendeur ne voit jamais les ventes de l'autre.
- Aucun jargon comptable inutile dans l'interface.
```

---

## Étape 10 : Commandes de cartes personnalisées

```
Construis le suivi de l'échange de cartes Signature.

FLUX MÉTIER
Le client reçoit d'abord une carte standard avec son lien. La carte imprimée est fabriquée ensuite. Quand elle est prête, le vendeur revient, échange les cartes, réécrit le même lien sur la nouvelle carte avec NFC Tools, et clôture la commande.

TÂCHES
- Écran Commandes : colonnes ou onglets par statut (commandée, en production, prête, échangée), cartes de commande avec client, logo, notes de design, date et vendeur.
- Changement de statut par geste ou bouton avec animation de transition, horodatage automatique (ready_at, swapped_at, swapped_by).
- À l'étape "prête", afficher le lien à réécrire avec bouton copier et rappel du guide NFC Tools.
- Coordonnées du client accessibles en un tap (appel, WhatsApp) pour convenir de l'échange.
- Notification dans l'accueil pour les cartes prêtes à échanger.
- Les deux vendeurs peuvent traiter n'importe quelle commande.

CRITÈRES D'ACCEPTATION
- Impossible de sauter un statut sans confirmation explicite.
- L'historique de chaque commande est consultable depuis la fiche du profil.
```

---

## Étape 11 : Scans et statistiques

```
Ajoute les statistiques d'usage.

TÂCHES
- Sur la fiche profil : scans sur 7 et 30 jours, courbe légère, répartition par pays, appareils, pics horaires.
- Tableau de bord admin : profils les plus scannés, scans totaux, profils sans aucun scan depuis 14 jours (utile pour relancer un client).
- Déduplication des scans rapprochés du même visiteur (fenêtre de quelques minutes) sans stocker de données personnelles identifiantes.
- Requêtes agrégées côté SQL (vues ou fonctions), pas de calcul lourd côté client.

CRITÈRES D'ACCEPTATION
- Les chiffres se chargent instantanément et restent lisibles sur petit écran.
- Aucun impact sur le temps d'affichage de la page publique.
```

---

## Étape 12 : PWA et mode hors ligne

```
Transforme l'espace vendeur en application installable.

TÂCHES
- Manifeste complet (nom, icônes maskable, couleurs, orientation portrait), écran de lancement soigné, invite d'installation discrète et bien placée.
- Service worker : mise en cache de la coque de l'app et des polices, lecture hors ligne des dernières listes consultées, bandeau clair quand le réseau est absent.
- File d'attente hors ligne pour la création de profil : le tunnel fonctionne sans réseau, les données partent dès le retour de la connexion, avec un état visible "en attente de synchronisation" et gestion des conflits de slug (proposer une alternative).
- Mise à jour de l'app sans friction (notification "nouvelle version disponible").

CRITÈRES D'ACCEPTATION
- Installation testée sur Android et iPhone.
- Un profil créé hors ligne est bien synchronisé au retour du réseau, sans doublon.
```

---

## Étape 13 : Finitions, accessibilité, performance

```
Passe d'audit et de finition sur l'ensemble.

TÂCHES
- Revue visuelle écran par écran, de 320 à 430 px, en FR et AR, thèmes noir et ivoire : alignements, espacements, hiérarchie, cohérence des rayons et des icônes, troncatures de texte, cas extrêmes (noms très longs, très courts, sans logo).
- Revue des animations : durées, courbes, cohérence, suppression de tout mouvement superflu, vérification de prefers-reduced-motion.
- Accessibilité : navigation clavier, lecteurs d'écran (labels, rôles, annonces des changements d'état), contrastes, cibles tactiles, focus visible.
- Performance : analyse du bundle, découpage du code, images, polices, budget JS de la page publique respecté. Lighthouse mobile sur les pages clés.
- Sécurité : relecture des politiques RLS, des routes API, des uploads, des en-têtes, du rate limiting.
- Textes : relecture de tous les messages FR et AR (ton cohérent, vocabulaire naturel, aucune traduction littérale gênante).
- Tests : compléter Vitest et Playwright sur les parcours critiques (création, échange de carte, caisse).

CRITÈRES D'ACCEPTATION
- Lighthouse mobile : performance 95 et plus et accessibilité 100 sur la page publique, 90 et plus sur le dashboard.
- Aucune erreur console, aucun warning de build.
- Rapport final listant ce qui a été corrigé et ce qui reste à surveiller.
```

---

## Étape 14 : Déploiement et lancement

```
Prépare la mise en production.

TÂCHES
- Configuration Vercel (variables, domaine {{DOMAINE}}, redirections www, HTTPS), projet Supabase de production séparé du développement, migrations appliquées proprement.
- Sauvegardes de la base activées, journalisation des erreurs (Sentry ou équivalent) sans données personnelles.
- Pages légales minimales (mentions, confidentialité) en FR et AR.
- Favicon, icônes, image OG par défaut, sitemap et robots.
- Création des deux comptes vendeurs en production via le script.
- Checklist de lancement : test complet sur un vrai iPhone et un vrai Android (création de profil, écriture NFC Tools, scan de la carte, enregistrement du contact, reçu, échange Signature), test en réseau lent simulé, test hors ligne.
- Documentation courte pour les vendeurs : guide d'une page du parcours de vente.

CRITÈRES D'ACCEPTATION
- Le parcours complet de vente est réalisé de bout en bout sur la production avec une vraie carte NFC.
- Les deux vendeurs peuvent se connecter et vendre sans assistance.
```
