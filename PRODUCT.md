# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Joueurs de Magic: The Gathering en France et en Europe, sur deux formats traités à égalité : **Modern** (decks de tournoi de 60 cartes et 15 en réserve) et **Commander** (decks de 100 cartes en un exemplaire, menés par un commandant). Vendeurs et acheteurs comptent autant :

- **Vendeurs** : un joueur qui veut revendre un deck complet. Il colle ou importe sa decklist, découvre sa valeur, fixe son prix, publie l'annonce et suit la vente depuis son espace.
- **Acheteurs** : un joueur qui veut acheter un deck complet prêt à jouer, plutôt que réunir les cartes une par une. Il compare le prix demandé à la valeur du jour, pose ses questions au vendeur et fait une offre.

## Product Purpose

decksell sert à revendre et acheter des decks Modern et Commander complets entre particuliers. L'estimation de la valeur d'une decklist (prix Cardmarket en euros, carte par carte) est le point d'entrée : elle donne aux deux côtés une référence de prix commune. Le succès : un deck change de main à un prix juste, sans être découpé carte par carte.

## Positioning

La revente de decks complets entre particuliers. Moxfield, Archidekt et MTGGoldfish servent à construire et estimer des decks ; Cardmarket vend des cartes à l'unité ; les groupes Facebook vendent des decks sans protection. decksell part de la decklist entière et va jusqu'à la vente du deck, avec un critère propre à chaque format : le MetaScore en Modern, le niveau de puissance en Commander.

## Operating Context

- Les joueurs collent leur liste telle qu'exportée (MTGO, Arena, Moxfield, MTGGoldfish, Archidekt) ou importent un deck Archidekt par son lien. Moxfield bloque l'import automatique : on conseille « Exporter › Copier pour Moxfield ».
- Le format est reconnu d'après la liste (section « Commander », catégorie Archidekt, 100 cartes en un exemplaire avec le commandant à part) ; le vendeur peut le corriger et choisir son commandant.
- Les prix viennent de Cardmarket via Scryfall, en euros, datés, rafraîchis chaque jour ; ils sont indicatifs et ne sont pas un prix de revente.
- Le vendeur suit ses annonces depuis son espace membre : en vente, réservé, vendu, retiré ; il y modifie le prix, la liste, les photos, le primer, l'état et la langue des cartes, et le niveau de puissance (Commander).
- Le site est en production sur decksell.fr, derrière une page « Bientôt » protégée par mot de passe jusqu'à l'ouverture.

## Capabilities and Constraints

- **Estimation** : chaque carte compte au prix de l'impression indiquée dans la liste (édition, numéro de collection, foil) ; sans édition, au prix de son impression la moins chère, et l'estimateur le signale. Cartes introuvables ou sans prix signalées et complétables à la main.
- **Règles de format contrôlées à la publication** : Modern (60 cartes au moins, 15 en réserve au plus, cartes légales) ; Commander (100 cartes commandant compris, un ou deux commandants, un exemplaire par carte hors terrains de base, cartes légales, identité de couleur du commandant).
- **MetaScore (Modern)** : proximité de la liste avec les listes de tournoi récentes (résultats officiels MTGO, import quotidien), de 0 à 100. Mesure la ressemblance, jamais le niveau de jeu.
- **Niveau de puissance (Commander)** : échelle officielle des brackets (1 Exhibition à 5 cEDH, règles du 9 février 2026). La liste fixe un minimum (Game Changers, destruction massive de terrains, tours supplémentaires, combos à deux cartes repérés par Commander Spellbook) ; le vendeur annonce son niveau, jamais en dessous, et peut le modifier ensuite.
- **Place de marché** : catalogues publics /modern, /commander et /decks (tous), avec onglets ; filtres couleurs, archétype (liste propre à chaque format), carte ou commandant (anglais ou français), prix, photos, et niveau en Commander ; tris par date, prix, bonnes affaires, méta (Modern) ou puissance (Commander).
- **Fiche d'un deck** : valeur du jour carte par carte, état et langue par carte, photos réelles, primer (comment jouer le deck), testeur de main, courbe de mana, MetaScore ou niveau de puissance, médaillon du commandant, profil et badges du vendeur, partage et export .txt.
- **Comptes et échanges** : email et mot de passe, profil avec photo et liens Moxfield / Archidekt, favoris, messagerie privée liée à l'annonce, offres, signalement, badges de vendeur calculés sur des faits.
- **Pas encore construit** : le paiement sécurisé (Stripe Connect, argent retenu jusqu'à la réception), le suivi d'envoi, les litiges. Pas de remise en main propre : la vente est en ligne.
- Stack : Next.js 16 (App Router, Cache Components) sur Vercel, Supabase (Postgres, Auth, Storage), Tailwind CSS 4, emails via Resend.
- Données de cartes et images : Scryfall. Combos : Commander Spellbook. Contenu de fans non officiel, non approuvé par Wizards of the Coast ; les mentions légales Scryfall et Wizards restent visibles.
- Ouvert : la commission et les frais de la future vente sécurisée (environ 3 %, minimum par vente, frais côté acheteur), non tranchés.

## Brand Commitments

- Nom : decksell.
- Langue : français, avec tutoiement (« Combien vaut ton deck ? »).
- Thème clair ou sombre : celui de l'appareil par défaut, modifiable avec le bouton de l'en-tête (pied de page sur mobile), choix gardé dans le navigateur.
- Direction visuelle familière, choisie par l'utilisateur : un outil « tech » bleuté au niveau de finition de Moxfield, avec MTGGoldfish comme seconde référence (densité des prix). Une direction plus illustrative (« booster scellé ») a été essayée puis refusée, comme un essai de typographie « Magic ».
- Une couleur par format : bleu pour Modern, magenta pour Commander. Pas de doré.
- Sans cookie de suivi : pas de bandeau de consentement, mesure d'audience anonyme (Vercel Analytics).

## Evidence on Hand

- Données réelles : prix Cardmarket de toutes les cartes via Scryfall ; listes de tournoi Modern (MTGO) ; Game Changers et légalité Commander (Scryfall) ; deck d'exemple Eldrazi Ramp (`src/lib/sample-deck.ts`).
- Quelques annonces de test, Modern et Commander, publiées par l'équipe et des testeurs.
- Aucun témoignage, chiffre d'usage, partenaire ou avis client : ne pas en inventer.

## Product Principles

1. La decklist entière est l'unité : on estime, vend et achète un deck, pas des cartes isolées.
2. Le prix doit être juste et compréhensible : source, date, édition retenue et cartes manquantes toujours visibles.
3. Acheteurs et vendeurs ont la même importance : chaque écran public doit servir les deux.
4. Coller ou importer sa liste suffit : aucun format à apprendre, aucune saisie carte par carte.
5. Modern et Commander à égalité : chacun a sa porte, son catalogue et son critère phare ; aucun n'est une option de l'autre.
