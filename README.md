<div align="center">

# decksell

**Estime, vends et achète des decks Magic: The Gathering Modern complets, au juste prix.**

Colle ta decklist : decksell la chiffre carte par carte d'après les prix Cardmarket en euros, la compare aux listes
qui gagnent en tournoi, puis t'aide à la vendre ou à trouver le deck qu'il te faut.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20·%20Auth%20·%20Storage-3ecf8e?logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Déployé_sur-Vercel-000000?logo=vercel)

![Accueil de decksell](docs/screenshots/accueil.webp)

</div>

## Pourquoi decksell

Les outils existants savent construire et estimer des decks (Moxfield, MTGGoldfish) ou vendre des cartes à l'unité
(Cardmarket). decksell part de **la decklist entière** et va jusqu'à **la vente du deck complet entre joueurs**, sans
le découper carte par carte. L'estimation et la comparaison au méta donnent au vendeur et à l'acheteur le même point
de départ.

## Fonctionnalités

### Estimation d'un deck

- **Coller sa liste telle quelle** (MTGO, Arena, Moxfield, MTGGoldfish, réserve et compagnon compris) ou **importer
  un deck Archidekt** par son lien.
- **Valeur carte par carte** en euros, avec rareté, édition, illustrateur et aperçu de la carte.
- **Carte phare** révélée en dernier, total qui défile, part des 5 cartes les plus chères.
- **Rien n'est compté en silence** : une carte introuvable ou sans prix est signalée, laissée hors du total, et le
  vendeur peut indiquer son propre prix.

![Estimation d'un deck](docs/screenshots/estimation.webp)

### Trouver un deck

- **Index des decks en vente** : illustration de la carte phare, prix demandé, **jauge du juste prix** (bonne affaire,
  juste prix, au-dessus de la valeur) et **badge de proximité méta**.
- **Recherche par carte**, en anglais ou en français (« Foudre » trouve Lightning Bolt), avec suggestions.
- **Filtres** par couleurs, archétype et fourchette de prix, **tri** par date, prix ou meilleure affaire, pagination.
  Filtres repliables sur mobile, partageables par leur adresse.
- **Favoris**, avec alerte par email quand un deck suivi baisse de prix.

### Page d'un deck

- **Liste aux prix du jour, groupée par type** (créatures, éphémères, terrains…) avec sous-totaux, façon Moxfield.
- **Fenêtre « carte en grand »** au clic, navigation ← →, liens Scryfall et Cardmarket.
- **Statistiques** : types de cartes (cliquables), courbe de mana, état et langue carte par carte.
- **Proximité méta** : score de 0 à 100 face aux listes de tournoi récentes, liste la plus proche, cœur commun et
  différences (voir plus bas).
- **Vendeur** : ancienneté, nombre de decks en vente, lieu d'expédition, profils Moxfield et Archidekt.
- **Contacter le vendeur**, copier le lien, télécharger la liste en `.txt`, signaler l'annonce.

### Messagerie et offres

- **Une conversation par annonce et par acheteur**, avec notification par email (une seule tant qu'elle n'est pas lue).
- **Offres de prix** : l'acheteur propose, le vendeur accepte ou refuse ; le vendeur réserve l'annonce depuis la
  conversation.
- **Blocage et signalement** d'un membre, quotas anti-spam, insultes repérées automatiquement.

### Espace vendeur

- **Mise en vente depuis l'estimation**, contrôlée : 60 cartes minimum, 15 en réserve au plus, aucune carte interdite
  en Modern.
- **Mes annonces** : statut en un clic (en vente, réservé, vendu, retiré), bouton « Ajouter un deck ».
- **Page de chaque annonce** : un seul formulaire (nom, format, prix, statut, couleurs, archétype), état et langue
  carte par carte, modification de la liste.
- **Profil** : pseudo, photo, lieu d'expédition, préférences d'emails et d'alertes.

### Modération

- **Signalements** de conversations et d'annonces, plus les messages repérés automatiquement.
- **Décisions** : classement, retrait de l'annonce, avertissement par email, suspension de 3 jours à définitive (un
  compte suspendu ne peut plus écrire ni modifier ses annonces, qui disparaissent du site).

## Comment les prix sont calculés

| Règle | Détail |
|---|---|
| Source | Prix Cardmarket en euros, via les données publiques de [Scryfall](https://scryfall.com) |
| Impression retenue | L'impression **non-foil la moins chère** de chaque carte |
| Fraîcheur | Prix réimportés chaque jour ; leur date est affichée avec chaque estimation |
| Cartes sans prix | Signalées et exclues du total ; le vendeur peut saisir un prix |
| Statut | Indicatif : c'est un repère, pas une offre de rachat |

## Score de proximité méta

Le score indique **à quel point une liste ressemble aux listes Modern qui ont fait des résultats récemment**. Il sert
à classer, jamais à promettre un niveau de jeu.

| | |
|---|---|
| Référence | Résultats officiels MTGO (Modern Challenges, Leagues 5-0) des 30 derniers jours, importés chaque jour |
| Calcul | Similarité de Ruzicka pondérée sur les quantités ; les cartes rares dans le méta pèsent plus que les cartes jouées partout |
| Pondération | Principal 0,8 / réserve 0,2 (réglable dans `src/lib/meta-config.ts`) |
| Lecture | 75+ liste méta · 55–74 proche du méta · 35–54 variante · moins de 35 hors méta |
| Robustesse | Pas de score sous 40 cartes ; cartes inconnues, lignes illisibles et réserve absente signalées |

Méthode complète, justification des choix et calibration : [docs/score-meta.md](docs/score-meta.md).

## Stack technique

- **[Next.js 16](https://nextjs.org)** (App Router, Server Actions, Cache Components, Proxy) et **React 19**
- **[Supabase](https://supabase.com)** : Postgres (cartes, annonces, messagerie, méta), Auth (email et mot de passe),
  Storage (photos de profil)
- **Tailwind CSS 4**, polices Geist, Sora et Rajdhani
- **[Resend](https://resend.com)** pour les emails (nouveau message, baisse de prix, modération)
- **Vercel** pour l'hébergement, déployé à chaque push sur `main`
- **GitHub Actions** pour les imports quotidiens (prix, méta)
- Tests avec le lanceur intégré de Node (`node --test`)

## Démarrer en local

### Prérequis

- Node.js 24 : les tests et les scripts importent directement des fichiers TypeScript
- Un projet [Supabase](https://supabase.com) (l'offre gratuite suffit)

### Installation

```bash
git clone https://github.com/AntoineWeis/decksell.git
cd decksell
npm install
```

### Configuration

1. Copie `.env.example` vers `.env.local` et renseigne les clés :

   | Variable | Où la trouver | Usage |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase › Connect | Adresse du projet |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Settings › API Keys | Clé publique (navigateur) |
   | `SUPABASE_SECRET_KEY` | Settings › API Keys | Clé secrète, **serveur et scripts uniquement** |
   | `RESEND_API_KEY` | resend.com › API Keys | Emails du site (facultatif) |
   | `EMAIL_FROM` | Adresse d'un domaine vérifié chez Resend | Expéditeur, ex. `decksell <notifications@ton-domaine.fr>` |

2. Dans Supabase › **SQL Editor**, exécute tout le fichier [`supabase/schema.sql`](supabase/schema.sql). Il est
   réexécutable sans risque : relance-le après chaque mise à jour du dépôt.
3. Dans Supabase › **Authentication › URL Configuration**, mets `http://localhost:3000` en Site URL et ajoute
   `http://localhost:3000/**` aux Redirect URLs.
4. Pour accéder à la modération, nomme-toi admin une fois (SQL Editor) :

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'ton-email@exemple.fr'
   on conflict do nothing;
   ```

5. Importe les cartes et les prix (plusieurs minutes), puis les listes de tournoi :

   ```bash
   npm run import:scryfall
   npm run import:meta
   ```

### Imports quotidiens

| Workflow | Heure (UTC) | Rôle |
|---|---|---|
| [`import-prix.yml`](.github/workflows/import-prix.yml) | 10 h 23 | Cartes et prix Scryfall |
| [`import-meta.yml`](.github/workflows/import-meta.yml) | 11 h 47 | Listes de tournoi MTGO, puis recalcul du score méta de toutes les annonces |

Pour les activer sur ton dépôt, ajoute deux secrets dans GitHub › **Settings › Secrets and variables › Actions** :
`NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_SECRET_KEY`. Chacun se lance aussi à la main depuis l'onglet **Actions**.

### Lancer

```bash
npm run dev
```

Le site est alors disponible sur [http://localhost:3000](http://localhost:3000).

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm start` | Build et serveur de production |
| `npm test` | Tests (decklists, prix, filtres de l'index, score méta, contrôle qualité…) |
| `npm run lint` | Vérification ESLint |
| `npm run import:scryfall` | Import des cartes et des prix Scryfall (`-- --limit 2000` pour un essai, `-- --force` pour réimporter le même fichier) |
| `npm run import:meta` | Import des listes de tournoi MTGO et recalcul du score méta (`-- --dry-run` pour simuler, `-- --only-rescore` pour recalculer seulement, `-- --days 45` pour changer la fenêtre) |
| `npm run check:supabase` | Test de connexion à Supabase |
| `npm run estimate -- deck.txt` | Estimation d'une decklist en ligne de commande |

## Structure du projet

```
src/
├── app/                   Pages, actions serveur et routes
│   ├── page.tsx           Accueil
│   ├── estimer/           Estimation d'un deck
│   ├── decks/             Index des decks en vente et page de chaque deck
│   ├── vendeurs/          Page publique de chaque vendeur
│   ├── espace/            Espace membre : annonces, messages, favoris, profil, modération
│   ├── api/cartes/        Suggestions de noms de cartes (anglais et français)
│   └── …                  Connexion, inscription, mot de passe, pages légales, sitemap, images de partage
├── components/            Composants d'interface (liste de cartes, filtres, jauge, encadrés, formulaires…)
├── lib/                   Logique métier : decklists, prix, filtres, score méta, messagerie, modération, emails
└── proxy.ts               Rafraîchissement de la session Supabase
supabase/schema.sql        Schéma complet de la base (tables, règles RLS, fonctions, archétypes)
scripts/                   Imports Scryfall et méta, estimation en ligne de commande, test de connexion
.github/workflows/         Imports quotidiens (GitHub Actions)
docs/                      Méthode du score méta, captures d'écran
tests/                     Tests unitaires
PRODUCT.md / DESIGN.md     Fiche produit et système de design
```

## Sécurité

- **Règles RLS** sur toutes les tables : un membre ne lit et ne modifie que son profil, ses annonces, ses
  conversations et ses photos.
- **La clé secrète Supabase ne quitte jamais le serveur** (modules `server-only`) ; la table des cartes et les listes
  de tournoi ne sont pas lisibles avec la clé publique.
- **Messagerie, offres et modération** passent par des fonctions SQL qui revérifient tout côté base (participants,
  quotas, blocages, droits d'admin, suspensions).
- **Chaque action serveur revérifie** le membre connecté et valide toutes les saisies.
- **L'index public** ne renvoie que les annonces en vente ou réservées de comptes non suspendus, et seulement leurs
  colonnes publiques.

## Feuille de route

- [x] Prise de contact entre acheteur et vendeur, offres de prix
- [x] Import automatique et quotidien des prix
- [x] Mot de passe oublié
- [x] Modération (signalements, sanctions)
- [x] Score de proximité méta et reconnaissance de l'archétype des listes de tournoi
- [ ] Paiement en ligne (Stripe Connect), pour garder toute la vente sur decksell
- [ ] Badges vendeur fondés sur les ventes réalisées
- [ ] Formats au-delà du Modern

## Mentions

Données de cartes, images et symboles de mana : [Scryfall](https://scryfall.com). Prix en euros issus de
Cardmarket, indicatifs et datés. Listes de tournoi : résultats officiels publiés sur
[mtgo.com](https://www.mtgo.com/decklists).

decksell est un contenu de fans non officiel, non approuvé par Wizards of the Coast. Portions des éléments utilisés :
propriété de Wizards of the Coast. ©Wizards of the Coast LLC.
