<div align="center">

# decksell

**Estime, vends et achète des decks Magic: The Gathering complets, Modern et Commander, au juste prix.**

Colle ou importe ta decklist : decksell la chiffre carte par carte d'après les prix Cardmarket en euros, édition par
édition, la compare au méta des tournois (Modern) ou mesure son niveau de puissance (Commander), puis t'aide à la
vendre ou à trouver le deck qu'il te faut.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20·%20Auth%20·%20Storage-3ecf8e?logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Déployé_sur-Vercel-000000?logo=vercel)

**[decksell.fr](https://decksell.fr)**

![Accueil de decksell](docs/screenshots/accueil.webp)

</div>

## Pourquoi decksell

Les outils existants savent construire et estimer des decks (Moxfield, Archidekt, MTGGoldfish) ou vendre des cartes à
l'unité (Cardmarket). decksell part de **la decklist entière** et va jusqu'à **la vente du deck complet entre
joueurs**, sans le découper carte par carte. L'estimation donne au vendeur et à l'acheteur le même point de départ, et
chaque format a son critère phare : le **MetaScore** en Modern, le **niveau de puissance** en Commander.

## Fonctionnalités

### Deux formats, à égalité

- **Modern** (60 cartes et réserve) et **Commander** (100 cartes menées par un commandant) ont chacun leur catalogue,
  leurs filtres, leurs archétypes et leur couleur : bleu pour Modern, magenta pour Commander.
- **Accueil à deux portes**, catalogues **`/modern`**, **`/commander`** et **`/decks`** (tous), avec onglets.
- **Format reconnu tout seul** d'après la liste (section « Commander », catégorie Archidekt, 100 cartes en un
  exemplaire avec le commandant à part), corrigeable à la mise en vente.

### Estimation d'un deck

- **Coller sa liste telle quelle** (Moxfield, Arena, MTGO, MTGGoldfish, Archidekt) ou **importer un deck Archidekt**
  par son lien.
- **Prix de l'impression indiquée** : édition, numéro de collection et foil sont lus dans la liste ; sans édition, la
  carte compte au prix de sa version la moins chère, et l'estimateur le signale.
- **Valeur carte par carte** en euros, avec rareté, édition, illustrateur et aperçu de la carte ; la carte phare (ou le
  commandant) est révélée en dernier.
- **Rien n'est compté en silence** : une carte introuvable ou sans prix est signalée, laissée hors du total, et le
  vendeur peut indiquer son propre prix.

![Estimation d'un deck](docs/screenshots/estimation.webp)

### Trouver un deck

- **Catalogues** : illustration du deck, prix demandé et valeur estimée, MetaScore ou niveau de puissance, langue des
  cartes.
- **Recherche par carte ou par commandant**, en anglais ou en français (« Foudre » trouve Lightning Bolt), toujours
  visible ; filtres repliables : couleurs, archétype, prix, photos, niveau de puissance (Commander).
- **Tris** par date, prix, meilleure affaire, proximité méta (Modern) ou puissance (Commander), pagination.
- **Favoris**, avec alerte par email quand un deck suivi baisse de prix.

### Page d'un deck

- **Liste aux prix du jour, groupée par type** avec sous-totaux, commandant à part en Commander.
- **Jauge du juste prix**, état et langue carte par carte, **photos réelles** (jusqu'à 6), **primer** du vendeur,
  **testeur de main** (mulligan de Londres).
- **Statistiques** : types de cartes, courbe de mana ; **MetaScore** (Modern) ou **niveau de puissance** (Commander).
- **Vendeur** : badges, ancienneté, nombre de decks en vente, lieu d'expédition, profils Moxfield et Archidekt.
- **Contacter le vendeur**, partager le lien, télécharger la liste en `.txt`, signaler l'annonce.

### Messagerie et offres

- **Une conversation par annonce et par acheteur**, avec notification par email.
- **Offres de prix** : l'acheteur propose, le vendeur accepte ou refuse et réserve l'annonce depuis la conversation.
- **Blocage et signalement**, quotas anti-spam, insultes repérées automatiquement.

### Espace vendeur

- **Mise en vente depuis l'estimation**, avec les règles du format contrôlées : Modern (60 cartes, 15 en réserve au
  plus), Commander (100 cartes, commandant, un exemplaire par carte, identité de couleur), aucune carte interdite.
- **Mes annonces** : statut en un clic (en vente, réservé, vendu, retiré), prix, liste, photos, primer, état et langue
  carte par carte, niveau de puissance annoncé.
- **Badges** calculés sur des faits (Réactif, Juste prix, Ancien…), avec animation de déblocage.
- **Profil** : pseudo, photo, lieu d'expédition, préférences d'emails et d'alertes.

### Modération

- **Signalements** de conversations et d'annonces, plus les messages repérés automatiquement.
- **Décisions** : classement, retrait de l'annonce, avertissement par email, suspension de 3 jours à définitive.

### Pour tous

- **Thème clair ou sombre**, celui de l'appareil par défaut, avec un bouton pour choisir.
- **Sans cookie de suivi** : pas de bandeau de consentement, mesure d'audience anonyme (Vercel Analytics).
- **Accessibilité** visée : WCAG 2.2 niveau AA (lien d'évitement, clavier, contrastes, animations réduites).
- Pages **Questions fréquentes**, **Accessibilité**, **Qui sommes-nous**, conditions et confidentialité.

## Comment les prix sont calculés

| Règle | Détail |
|---|---|
| Source | Prix Cardmarket en euros, via les données publiques de [Scryfall](https://scryfall.com) |
| Impression retenue | Celle indiquée dans la liste (édition, numéro, foil) ; sinon l'impression **non-foil la moins chère** |
| Fraîcheur | Prix réimportés chaque jour ; leur date est affichée avec chaque estimation |
| Cartes sans prix | Signalées et exclues du total ; le vendeur peut saisir un prix |
| Statut | Indicatif : c'est un repère, pas une offre de rachat |

## MetaScore (Modern)

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

## Niveau de puissance (Commander)

Échelle officielle des **brackets** Commander, de 1 (Exhibition) à 5 (cEDH), selon la mise à jour du 9 février 2026.
La liste fixe un **niveau minimum** ; le vendeur annonce son niveau, jamais en dessous, et peut le modifier.

| Critère | Effet sur le minimum |
|---|---|
| Game Changers (liste officielle, via Scryfall) | 1 à 3 : niveau 3 · plus de 3 : niveau 4 |
| Destruction massive de terrains | Niveau 4 |
| Combos à deux cartes ([Commander Spellbook](https://commanderspellbook.com)) | Tardif : niveau 3 · rapide : niveau 4 |
| Tours supplémentaires | Un seul : toléré · plusieurs : niveau 3 · beaucoup : niveau 4 |

Si Commander Spellbook ne répond pas, seuls les Game Changers sont comptés, et c'est signalé. Code :
[`src/lib/bracket.ts`](src/lib/bracket.ts).

## Stack technique

- **[Next.js 16](https://nextjs.org)** (App Router, Server Actions, Cache Components, Proxy) et **React 19**
- **[Supabase](https://supabase.com)** : Postgres (cartes, annonces, messagerie, méta), Auth (email et mot de passe),
  Storage (photos de profil et des decks)
- **Tailwind CSS 4**, polices Geist, Sora et Rajdhani
- **[Resend](https://resend.com)** pour les emails (inscription, mot de passe, nouveau message, baisse de prix,
  modération)
- **[Commander Spellbook](https://commanderspellbook.com)** (API publique) pour les combos du niveau de puissance
- **Vercel** pour l'hébergement et la mesure d'audience, déployé à chaque push sur `main`
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
   | `SITE_PASSWORD` | À choisir | Facultatif : tant qu'il est défini, tout le site renvoie vers la page « Bientôt » protégée par ce mot de passe |

2. Dans Supabase › **SQL Editor**, exécute tout le fichier [`supabase/schema.sql`](supabase/schema.sql). Il est
   réexécutable sans risque : relance-le après chaque mise à jour du dépôt.
3. Dans Supabase › **Authentication › URL Configuration**, mets `http://localhost:3000` en Site URL et ajoute
   `http://localhost:3000/**` aux Redirect URLs. Les modèles d'emails traduits sont dans
   [`supabase/email-templates/`](supabase/email-templates).
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
| [`import-prix.yml`](.github/workflows/import-prix.yml) | 10 h 23 | Cartes, prix, légalités, identité de couleur et Game Changers (Scryfall) |
| [`import-meta.yml`](.github/workflows/import-meta.yml) | 11 h 47 | Listes de tournoi MTGO, puis recalcul du MetaScore des annonces Modern |

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
| `npm test` | Tests (decklists et éditions, prix, formats, Commander, niveau de puissance, filtres, score méta…) |
| `npm run lint` | Vérification ESLint |
| `npm run import:scryfall` | Import des cartes et des prix Scryfall (`-- --limit 2000` pour un essai, `-- --force` pour réimporter le même fichier) |
| `npm run import:meta` | Import des listes de tournoi MTGO et recalcul du score méta (`-- --dry-run` pour simuler, `-- --only-rescore` pour recalculer seulement, `-- --days 45` pour changer la fenêtre) |
| `npm run check:supabase` | Test de connexion à Supabase |
| `npm run estimate -- deck.txt` | Estimation d'une decklist en ligne de commande |

## Structure du projet

```
src/
├── app/                   Pages, actions serveur et routes
│   ├── page.tsx           Accueil (deux portes Modern / Commander, derniers decks)
│   ├── estimer/           Estimation d'un deck
│   ├── modern/            Catalogue des decks Modern
│   ├── commander/         Catalogue des decks Commander
│   ├── decks/             Tous les decks, et page de chaque deck (/decks/[id])
│   ├── vendeurs/          Page publique de chaque vendeur
│   ├── espace/            Espace membre : annonces, messages, favoris, badges, profil, modération
│   ├── api/cartes/        Suggestions de noms de cartes (anglais et français)
│   └── …                  Connexion, inscription, FAQ, accessibilité, pages légales, sitemap, images de partage
├── components/            Composants d'interface (catalogue, filtres, liste de cartes, niveau de puissance…)
├── lib/                   Logique métier : decklists, prix, formats, niveau de puissance, score méta, messagerie, emails
└── proxy.ts               Session Supabase et page « Bientôt »
supabase/                  Schéma complet de la base (schema.sql) et modèles d'emails
scripts/                   Imports Scryfall et méta, estimation en ligne de commande, test de connexion
.github/workflows/         Imports quotidiens (GitHub Actions)
docs/                      Méthode du score méta, captures d'écran
tests/                     Tests unitaires
PRODUCT.md / DESIGN.md     Fiche produit et système de design
```

## Sécurité

- **Règles RLS** sur toutes les tables : un membre ne lit et ne modifie que son profil, ses annonces, ses
  conversations, ses favoris et ses photos.
- **La clé secrète Supabase ne quitte jamais le serveur** (modules `server-only`) ; la table des cartes et les listes
  de tournoi ne sont pas lisibles avec la clé publique.
- **Messagerie, offres et modération** passent par des fonctions SQL qui revérifient tout côté base (participants,
  quotas, blocages, droits d'admin, suspensions).
- **Chaque action serveur revérifie** le membre connecté, valide toutes les saisies et recalcule l'estimation, les
  règles du format et le niveau de puissance, sans se fier au navigateur.
- **L'index public** ne renvoie que les annonces en vente ou réservées de comptes non suspendus, et seulement leurs
  colonnes publiques.

## Feuille de route

- [x] Prise de contact entre acheteur et vendeur, offres de prix
- [x] Import automatique et quotidien des prix
- [x] Modération (signalements, sanctions)
- [x] Score de proximité méta et reconnaissance de l'archétype des listes de tournoi
- [x] Badges vendeur calculés sur des faits
- [x] Format Commander : règles, niveau de puissance, catalogue
- [x] Prix par édition, numéro et foil
- [ ] Paiement en ligne sécurisé (Stripe Connect), argent retenu jusqu'à la réception du deck
- [ ] Envoi suivi et gestion des litiges

## Mentions

Données de cartes, images et symboles de mana : [Scryfall](https://scryfall.com). Prix en euros issus de
Cardmarket, indicatifs et datés. Listes de tournoi : résultats officiels publiés sur
[mtgo.com](https://www.mtgo.com/decklists). Combos Commander : [Commander Spellbook](https://commanderspellbook.com).

decksell est un contenu de fans non officiel, non approuvé par Wizards of the Coast. Portions des éléments utilisés :
propriété de Wizards of the Coast. ©Wizards of the Coast LLC.
