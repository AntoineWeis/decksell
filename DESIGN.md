---
name: decksell
description: Estimer, vendre et acheter des decks Modern complets, avec la finition d'un outil de deck façon Moxfield.
colors:
  action-blue: "#2563eb"
  action-blue-hover: "#1d4fd0"
  link-blue: "#2257d6"
  blue-soft: "#e5edff"
  banner-night: "#0f1830"
  banner-ink: "#f3f6fc"
  banner-mist: "#b4c0d8"
  page: "#f3f5f9"
  surface: "#ffffff"
  sunken: "#eef1f6"
  rule: "#dde3ec"
  ink: "#111827"
  muted: "#586378"
  star-orange: "#e2511f"
  gem-common: "#2a2d34"
  gem-uncommon: "#8d98a6"
  gem-rare: "#c3961a"
  gem-mythic: "#e2511f"
  ok: "#157a3a"
  warn: "#8f5200"
  danger: "#b42318"
typography:
  display:
    fontFamily: "Sora, sans-serif"
    fontSize: "3.75rem"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Geist, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Geist, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Geist, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    letterSpacing: "0.05em"
  data:
    fontFamily: "Geist Mono, monospace"
    fontSize: "0.8125rem"
    lineHeight: 1.85
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  pill: "9999px"
spacing:
  section: "24px"
  inset: "20px"
  row: "8px"
components:
  button-primary:
    backgroundColor: "{colors.action-blue}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.action-blue-hover}"
  nav-bar:
    backgroundColor: "{colors.banner-night}"
    textColor: "{colors.banner-ink}"
    height: "56px"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "20px"
  input-field:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  chip-meta:
    rounded: "{rounded.sm}"
    padding: "4px 10px"
---

# Design System: decksell

## Overview

**Creative North Star: "L'outil de deck bien fini"**

decksell assume le standard de sa catégorie : il ressemble à un outil de joueur de la famille Moxfield, avec la densité de prix de MTGGoldfish. Une barre de navigation bleu nuit et, en haut de chaque page, un bandeau de page de deck où une illustration de carte floutée passe sous un dégradé. L'accueil présente le projet et rassure sur les prix ; la page « Estimer » est l'outil lui-même : la decklist dans un panneau à gauche, le résultat et le tableau de cartes à droite. Ce choix a été fait par l'utilisateur après avoir refusé une direction plus illustrative ; il est donc exécuté sans ironie et sans décor ajouté.

La personnalité tient dans la précision : chiffres tabulaires, filets fins, un seul bleu vif pour agir, et quelques détails propres à Magic (gemmes de rareté, carte phare, hachures pour les prix manquants). Densité moyenne : on lit vite, sans tasser.

**Key Characteristics:**
- Barre et bandeau bleu nuit, identiques dans les deux thèmes.
- Un seul bleu d'action pour les boutons, les liens et le focus.
- Panneaux plats aux coins de 12px, séparés par des filets.
- Tableau de cartes à en-têtes de colonnes, trié par valeur.
- Gemmes de rareté, carte phare en orange, hachures pour les manques.

## Colors

Palette restreinte : neutres gris-bleu, un bleu d'action, et des couleurs de signal propres à Magic.

### Primary
- **Bleu action** (action-blue) : boutons principaux (« Estimer le deck », « Créer un compte », « Mettre en vente », « Publier », « Enregistrer »), sélection de texte, curseur. En sombre : #3b7bff.

### Secondary
- **Bleu lien** (link-blue) : liens dans le texte, onglet actif, anneau de focus. En sombre : #7fa8ff.
- **Bleu doux** (blue-soft) : fond des pastilles d'étape et des initiales d'avatar.

### Tertiary
- **Orange phare** (star-orange) : liseré de la carte phare uniquement.

### Neutral
- **Nuit bandeau** (banner-night), avec **encre bandeau** et **brume bandeau** : barre de navigation et bandeau d'accueil.
- **Page**, **surface**, **creux**, **filet** : fond, panneaux, champs et en-têtes de colonnes, séparateurs. En sombre : #0e121b, #161c28, #1c2331, #283143.
- **Encre** et **muet** : texte principal et secondaire.
- **Gemmes** : rareté réelle de l'impression (commune, peu commune, rare, mythique).
- **États** : ok, warn, danger, chacun avec un fond doux.

### Named Rules
**The One Blue Rule.** Une seule teinte de bleu vif pour tout ce qui agit ; pas de second accent.

**The Star Rule.** L'orange ne marque que la carte phare ; la gemme mythique partage sa teinte parce qu'elle dit la même chose.

**The Hatch Rule.** Tout ce qui n'a pas de prix porte des hachures diagonales (6px de bande, 12px de pas, teinte warn à 14 %), partout la même marque.

## Typography

**Display Font:** Sora (repli sans-serif), choisie par l'utilisateur
**Body Font:** Geist
**Label/Mono Font:** Geist Mono pour la decklist

**Character:** Sora, géométrique et nette, pour les grands titres ; Geist, neutre et technique, pour tout le reste.

### Hierarchy
- **Display** (Sora 650, 2.25rem à 3.75rem, interligne 1.1, -0.02em) : titres des bandeaux, titres de sections de l'accueil, montant estimé.
- **Headline** (600, 1.125rem) : titres de panneaux (« Deck principal », « Comment ça marche », « Tu veux vendre ce deck ? »).
- **Body** (400, 1rem, interligne 1.625) : texte courant, 60 à 75 caractères par ligne.
- **Label** (600, 0.6875rem, capitales, 0.05em) : en-têtes de colonnes du tableau de cartes.
- **Data** (Geist Mono 0.8125rem) : contenu de la decklist uniquement.

### Named Rules
**The Tabular Price Rule.** Tout prix et toute quantité s'affichent en chiffres tabulaires, au format français (1 234,56 €).

## Layout

Conteneur de 72rem (1152px) centré, marges de 16px sur mobile et 24px au-delà de 640px. Barre de 56px collée en haut. Bandeau pleine largeur en tête de chaque page. L'accueil enchaîne des sections de 64 à 80px de haut en alternant le fond de page et la surface : présentation et trois fonctions, mode d'emploi en quatre étapes, réassurance sur les prix (texte à gauche, liste à droite), vendeurs et acheteurs côte à côte, appel final sur fond nuit. Sur la page « Estimer », dès 1024px, deux colonnes (4/11 et 7/11) : la decklist à gauche, collée en haut pendant le défilement, le résultat à droite ; en dessous, une seule colonne et le résultat se place sous la decklist, vers lequel la page défile après l'estimation. Espacement de 24px entre panneaux.

## Elevation & Depth

Surfaces plates séparées par des filets ; le panneau de la decklist porte une ombre très légère (shadow-sm). Seules exceptions : l'aperçu agrandi d'une carte au survol et la carte phare, qui ont une ombre portée douce. La profondeur du bandeau vient de l'illustration floutée (6px, 70 % d'opacité) sous un dégradé de la nuit vers la transparence.

### Shadow Vocabulary
- **Carte** (`box-shadow: 0 18px 40px -16px rgba(0,0,0,0.55)`) : carte phare et aperçu de carte.

## Shapes

Coins de 12px pour les panneaux, 8px pour les boutons et champs, 6px pour les puces et les liens de navigation, pilule pour les badges d'état. Les cartes Magic gardent leurs coins réels. Les gemmes sont des losanges de 9px.

## Components

### Buttons
- **Primaire** (button-primary) : bleu action, texte blanc demi-gras, 44px de haut dans les formulaires.
- **Navigation** : texte sur la barre nuit, fond blanc à 10 % au survol.
- **Discret** : texte simple, fond creux au survol (« Annuler », « Se déconnecter »).
- **Focus** : contour bleu lien de 2px, décalé de 2px.

### Cards / Containers
- **Panneau** : fond surface, filet de 1px, coins 12px, 20px de marge intérieure.
- **Résultat** : carte phare (180px, liseré orange de 3px) à gauche, valeur rédigée en phrase à droite.

### Inputs / Fields
- **Style** : fond creux, filet de 1px, coins 8px.
- **Focus** : bordure et halo bleu lien à 25 %.

### Navigation
- **Barre** : bleu nuit dans les deux thèmes ; logo (deux cartes sur un carré bleu) et nom en demi-gras ; « Estimer un deck » ; à droite « Connexion » et « Créer un compte », qui devient « S'inscrire » sous 640px ; une fois connecté, « Mes annonces » et l'avatar.

### Sections de l'accueil
- **Fonctions** : icône au trait de 20px dans une pastille bleu doux, titre et texte, sur trois colonnes sans cadre.
- **Étapes** : numéro blanc sur pastille bleu action, titre et texte, quatre colonnes.
- **Réassurance** : liste à coche verte dans un panneau, chaque point vérifiable dans le produit.
- **Vendeurs / acheteurs** : deux panneaux ; tout ce qui n'existe pas encore porte la puce « En préparation ».

### Tableau de cartes (signature)
En-tête de panneau (titre, nombre de cartes, total), ligne d'en-têtes de colonnes (Qté, Carte, Prix) sur fond creux, puis une ligne par carte : quantité, miniature 30×42, gemme, nom, édition et illustrateur, prix tabulaire. Tri par valeur décroissante ; les lignes apparaissent de la moins chère à la plus chère (320ms, décalage de 20ms, plafond 500ms), et la carte phare se retourne en dernier. Aperçu agrandi au survol, ouvert par-dessus la colonne de gauche.

## Do's and Don'ts

### Do:
- **Do** rester au niveau de finition de Moxfield et MTGGoldfish : sobre, dense, net.
- **Do** garder les sections d'explication et de réassurance de l'accueil, demandées par l'utilisateur, et n'y écrire que des faits vérifiables dans le produit.
- **Do** utiliser le seul bleu d'action pour agir, et l'orange seulement pour la carte phare.
- **Do** afficher la rareté réelle avec les gemmes et marquer tout manque de prix par les hachures.
- **Do** écrire la valeur comme une phrase (« Ce deck vaut environ… ») avec la source et la date des prix.
- **Do** respecter « réduire les animations » : apparition des lignes et retournement désactivés.

### Don't:
- **Don't** revenir à une direction illustrative ou « objet » (sachet, parchemin) : l'utilisateur l'a refusée.
- **Don't** utiliser parchemins, enluminures ou polices médiévales (trop fantasy).
- **Don't** transformer les prix en tableau de bord financier froid sans les détails Magic.
- **Don't** ajouter un second accent de couleur ni de jaune.
- **Don't** surcharger : le décor ne doit jamais noyer l'estimation ni les prix.
