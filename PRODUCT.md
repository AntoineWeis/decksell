# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Joueurs de Magic: The Gathering au format Modern, en France et en Europe, à parts égales :

- **Vendeurs** : un joueur qui veut revendre un deck complet. Il colle sa decklist, découvre sa valeur, fixe son prix, publie l'annonce et suit la vente.
- **Acheteurs** : un joueur qui veut acheter un deck complet prêt à jouer, plutôt que réunir les cartes une par une.

## Product Purpose

decksell sert à revendre et acheter des decks Modern complets entre particuliers. L'estimation de la valeur d'une decklist (prix Cardmarket en euros) est le point d'entrée : elle donne aux deux côtés une référence de prix commune. Le succès : un deck change de main à un prix juste, sans être découpé carte par carte.

## Positioning

La revente de decks complets entre particuliers. Moxfield et MTGGoldfish servent à construire et estimer des decks ; Cardmarket vend des cartes à l'unité. decksell part de la decklist entière et va jusqu'à la vente du deck.

## Operating Context

- Les joueurs exportent leur liste depuis MTGO, Arena, Moxfield ou MTGGoldfish et la collent telle quelle.
- Les prix viennent de Cardmarket via Scryfall, en euros, datés ; ils sont indicatifs et ne sont pas un prix de revente.
- Le vendeur suit ses annonces depuis son espace membre : en vente, réservé, vendu, retiré.

## Capabilities and Constraints

- En place : estimation d'une decklist (impression non-foil la moins chère, cartes sans prix signalées et complétables), comptes membres (email et mot de passe), mise en vente depuis l'estimation, espace membre (annonces, statuts, prix, profil avec photo et liens Moxfield / Archidekt).
- Place de marché : index public des decks en vente et réservés (/decks), page de chaque deck avec sa valeur du jour carte par carte, la part de cartes en français / anglais déclarée par le vendeur (pourcentage saisi à la main, non vérifié) et le profil du vendeur.
- Pas encore construit : la mise en relation acheteur / vendeur (contact, messagerie), la recherche et les filtres de decks.
- Stack : Next.js 16 (App Router, Cache Components) sur Vercel, Supabase (Postgres, Auth, Storage), Tailwind CSS 4.
- Données de cartes et images : Scryfall. Contenu de fans non officiel, non approuvé par Wizards of the Coast ; les mentions légales Scryfall et Wizards restent visibles.
- Ouvert : modèle économique (gratuit, commission ou autre), non décidé.

## Brand Commitments

- Nom : decksell.
- Langue : français, avec tutoiement (« Combien vaut ton deck ? »).
- Le site suit le thème clair ou sombre de l'appareil.
- Direction visuelle familière, choisie par l'utilisateur : un outil « tech » bleuté au niveau de finition de Moxfield, avec MTGGoldfish comme seconde référence (densité des prix). Une direction plus illustrative (« booster scellé ») a été essayée puis refusée.

## Evidence on Hand

- Données réelles : prix Cardmarket de toutes les cartes via Scryfall, rafraîchis par import ; deck d'exemple Eldrazi Ramp (`src/lib/sample-deck.ts`).
- Aucun témoignage, chiffre d'usage, partenaire ou avis client : ne pas en inventer.

## Product Principles

1. La decklist entière est l'unité : on estime, vend et achète un deck, pas des cartes isolées.
2. Le prix doit être juste et compréhensible : source, date et cartes manquantes toujours visibles.
3. Acheteurs et vendeurs ont la même importance : chaque écran public doit servir les deux.
4. Coller sa liste suffit : aucun format à apprendre, aucune saisie carte par carte.
