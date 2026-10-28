---
name: decksell
description: Estimer, vendre et acheter des decks Modern et Commander complets, avec la finition d'un outil de deck façon Moxfield.
colors:
  action-blue: "#2563eb"
  action-blue-hover: "#1d4fd0"
  link-blue: "#2257d6"
  blue-soft: "#e5edff"
  logo-blue: "#5a90ff"
  modern-solid: "#2563eb"
  commander: "#a21caf"
  commander-soft: "#fae8ff"
  commander-solid: "#c026d3"
  mana-blue: "#7fb2ff"
  mana-violet: "#9d84ff"
  banner-night: "#0f1830"
  banner-deep: "#16244a"
  banner-glow: "#1d3a8a"
  banner-mist-share: "#aab6d6"
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
  logo:
    fontFamily: "Rajdhani, sans-serif"
    fontSize: "1.6875rem"
    fontWeight: 700
    lineHeight: 1
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
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
  tag-modern:
    backgroundColor: "{colors.modern-solid}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "2px 6px"
  tag-commander:
    backgroundColor: "{colors.commander-solid}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "2px 6px"
  chip-bracket:
    backgroundColor: "{colors.commander-soft}"
    textColor: "{colors.commander}"
    rounded: "{rounded.md}"
    padding: "2px 6px"
---

# Design System: decksell

## Overview

**Creative North Star: "L'outil de deck bien fini"**

decksell assume le standard de sa catégorie : il ressemble à un outil de joueur de la famille Moxfield, avec la densité de prix de MTGGoldfish. Une barre de navigation bleu nuit et, en haut de chaque page, un bandeau où une illustration de carte floutée passe sous un dégradé. Deux formats vivent côte à côte, à égalité : **Modern** en bleu, **Commander** en magenta. L'accueil présente le projet, ouvre une porte par format et rassure sur les prix ; les catalogues (/modern, /commander, /decks) sont des outils de recherche ; la page « Estimer » est l'outil lui-même : la decklist dans un panneau à gauche, le résultat et le tableau de cartes à droite. Ce choix a été fait par l'utilisateur après avoir refusé une direction plus illustrative ; il est donc exécuté sans ironie et sans décor ajouté.

La personnalité tient dans la précision : chiffres tabulaires, filets fins, un seul bleu vif pour agir, et quelques détails propres à Magic (gemmes de rareté, carte phare, médaillon du commandant, hachures pour les prix manquants). Densité moyenne : on lit vite, sans tasser.

**Key Characteristics:**
- Barre et bandeau bleu nuit, identiques dans les deux thèmes.
- Un seul bleu d'action pour les boutons, les liens et le focus.
- Une couleur d'identité par format, réservée au format : bleu Modern, magenta Commander.
- Panneaux plats aux coins de 12px, séparés par des filets.
- Tableau de cartes à en-têtes de colonnes, trié par valeur.
- Gemmes de rareté, carte phare en orange, hachures pour les manques.

## Colors

Palette restreinte : neutres gris-bleu, un bleu d'action, deux couleurs de format, et des couleurs de signal propres à Magic.

### Primary
- **Bleu action** (action-blue) : boutons principaux (« Estimer le deck », « Créer un compte », « Mettre en vente », « Publier », « Enregistrer », « Contacter le vendeur »), sélection de texte, curseur. En sombre : #3b7bff.

### Secondary
- **Bleu lien** (link-blue) : liens dans le texte, onglet actif, anneau de focus. En sombre : #7fa8ff.
- **Bleu doux** (blue-soft) : fond des pastilles d'étape, des archétypes et des initiales d'avatar.
- **Bleu logo** (logo-blue) : « sell » du logo et point de couleur de Modern dans la barre.

### Couleurs de format
- **Modern** (modern-solid, le bleu action) : étiquette MODERN pleine, onglet Modern actif, point de la barre. En sombre : #2f6bff.
- **Commander** (commander-solid #c026d3, plein ; commander #a21caf pour le texte ; commander-soft pour les fonds) : étiquette COMMANDER, pastille « Niveau 3 · Upgraded », encadré et échelle du niveau de puissance, médaillon et anneau du commandant, onglet Commander actif. En sombre : texte #f0abfc, fond doux #3a1740, plein inchangé.

### Tertiary
- **Orange phare** (star-orange) : liseré de la carte phare uniquement (Modern ; en Commander, le commandant prend sa place avec un liseré magenta).
- **Mana** (mana-blue, mana-violet) : dégradé du logo, de l'animation de mana de l'accueil et des médailles de badge.

### Neutral
- **Nuit bandeau** (banner-night), avec **encre bandeau** et **brume bandeau** : barre de navigation, bandeaux et appel final.
- **Images de partage et icônes** (banner-deep, banner-glow, banner-mist-share) : dégradé de fond et texte secondaire des images générées. Ces valeurs fixes, comme le bleu logo et le dégradé mana, vivent dans `src/lib/brand-colors.ts`.
- **Page**, **surface**, **creux**, **filet** : fond, panneaux, champs et en-têtes de colonnes, séparateurs. En sombre : #0e121b, #161c28, #1c2331, #283143.
- **Encre** et **muet** : texte principal et secondaire.
- **Gemmes** : rareté réelle de l'impression (commune, peu commune, rare, mythique).
- **États** : ok, warn, danger, chacun avec un fond doux.

### Named Rules
**The One Blue Rule.** Une seule teinte de bleu vif pour tout ce qui agit ; pas de second accent d'action.

**The Format Color Rule.** Le bleu de Modern et le magenta de Commander disent le format, jamais une action : étiquettes, onglets, niveau de puissance, commandant. Le magenta ne sert à rien d'autre. Le violet a été écarté : trop proche du bleu.

**The Star Rule.** L'orange ne marque que la carte phare ; la gemme mythique partage sa teinte parce qu'elle dit la même chose.

**The Hatch Rule.** Tout ce qui n'a pas de prix porte des hachures diagonales (6px de bande, 12px de pas, teinte warn à 14 %), partout la même marque.

**No Gold.** Pas de doré ni de jaune décoratif ; le gem-rare reste limité à la rareté et à l'étoile des favoris.

## Typography

**Display Font:** Sora (repli sans-serif), choisie par l'utilisateur
**Body Font:** Geist
**Label/Mono Font:** Geist Mono pour la decklist
**Logo Font:** Rajdhani 700, pour le seul mot « decksell »

**Character:** Sora, géométrique et nette, pour les grands titres ; Geist, neutre et technique, pour tout le reste.

### Hierarchy
- **Display** (Sora 650, 2.25rem à 3.75rem, interligne 1.1, -0.02em) : titres des bandeaux, titres de sections de l'accueil, montant estimé, prix demandé, chiffre du niveau de puissance.
- **Headline** (600, 1.125rem) : titres de panneaux (« Deck principal », « Commandant », « Niveau de puissance », « Tu veux vendre ce deck ? »).
- **Body** (400, 1rem, interligne 1.625) : texte courant, 60 à 75 caractères par ligne.
- **Label** (600 ou 700, 0.6875rem, capitales, 0.05em) : en-têtes de colonnes du tableau de cartes, étiquettes de format.
- **Data** (Geist Mono 0.8125rem) : contenu de la decklist uniquement.
- **Plancher** : 11px (0.6875rem) au minimum pour tout texte lisible.

### Named Rules
**The Tabular Price Rule.** Tout prix et toute quantité s'affichent en chiffres tabulaires, au format français (1 234,56 €).

## Layout

Conteneur de 72rem (1152px) centré, marges de 16px sur mobile et 24px au-delà de 640px. Barre de 56px collée en haut. Bandeau pleine largeur en tête de chaque page.

- **Accueil** : bandeau (titre, estimation, recherche par carte) ; « Deux formats, une même règle de prix » (deux portes de même poids côte à côte dès 768px) ; derniers decks (une carte vedette et des cartes compactes) ; sections d'explication et de réassurance ; appel final sur fond nuit.
- **Catalogues** : bandeau du format, onglets Tous · Modern · Commander avec leur nombre, panneau de filtres, grille de vignettes (1, 2 puis 3 colonnes), pagination par 24.
- **Fiche d'un deck** : dès 1024px, deux colonnes (7/11 et 4/11) : liste de cartes à gauche, encadré prix collé à droite ; sur mobile, l'encadré prix passe avant la liste et une barre d'achat reste en bas.
- **Estimer** : dès 1024px, deux colonnes (4/11 et 7/11) : la decklist à gauche, collée en haut pendant le défilement, le résultat à droite ; en dessous, une seule colonne et la page défile vers le résultat après l'estimation.
- Espacement de 24px entre panneaux.

## Elevation & Depth

Surfaces plates séparées par des filets ; le panneau de la decklist porte une ombre très légère (shadow-sm). Seules exceptions : l'aperçu agrandi d'une carte au survol, la carte phare ou le commandant de l'estimateur, qui ont une ombre portée douce, et l'ombre légère des vignettes au survol. La profondeur du bandeau vient de l'illustration floutée (6px, 70 % d'opacité) sous un dégradé de la nuit vers la transparence.

### Shadow Vocabulary
- **Carte** (`box-shadow: 0 18px 40px -16px rgba(0,0,0,0.55)`) : carte phare, commandant et aperçu de carte.

## Shapes

Coins de 12px pour les panneaux et vignettes, 16px pour les portes et la carte vedette de l'accueil, 8px pour les boutons, champs et étiquettes, 6px pour les puces et les liens de navigation, pilule pour les badges d'état. Les cartes Magic gardent leurs coins réels. Les gemmes sont des losanges de 9px. Le médaillon du commandant est un cercle de 56px.

## Components

### Buttons
- **Primaire** (button-primary) : bleu action, texte blanc demi-gras, 44px de haut dans les formulaires.
- **Navigation** : texte sur la barre nuit, fond blanc à 10 % au survol.
- **Discret** : texte simple, fond creux au survol (« Annuler », « Se déconnecter »).
- **Focus** : contour bleu lien de 2px, décalé de 2px.

### Format
- **Étiquette de format** (tag-modern, tag-commander) : capitales 11px grasses, texte blanc sur la couleur pleine du format, coins 8px ; anneau blanc à 25 % sur fond nuit.
- **Pastille de score** : « Méta 59 » aux couleurs du verdict (Modern) ; « Niveau 3 · Upgraded » en magenta doux (chip-bracket, Commander).
- **Onglets de catalogue** : 40px de haut ; l'onglet actif prend la couleur pleine de son format (Tous : contour encre) ; les autres montrent un carré de 10px de leur couleur et leur nombre de decks.
- **Porte de format (accueil)** : carte 16px de coins, illustration fixe du format (16/7 : Consign to Memory pour Modern, The Ur-Dragon pour Commander, illustrateur crédité) sous un dégradé nuit avec le nom du format en display, accroche, deux points du critère phare, nombre de decks et lien coloré.

### Cards / Containers
- **Panneau** : fond surface, filet de 1px, coins 12px, 20px de marge intérieure.
- **Résultat** : carte phare (180px, liseré orange de 3px) ou commandant (liseré magenta) à gauche, valeur rédigée en phrase à droite, étiquette du format au-dessus.
- **Niveau de puissance** : chiffre en display sur 5, nom et résumé du niveau, échelle de cinq cases (niveau en magenta plein, niveaux possibles en magenta doux, niveaux impossibles grisés), raisons listées, mention « indicatif » dans l'estimateur.
- **Vignette de deck** : illustration 16/9 (coupée au survol, sous son dégradé), étiquette de format et titre, couleurs, archétype et score, prix demandé et valeur estimée, langue en texte seul, vendeur.

### Inputs / Fields
- **Style** : fond creux, filet de 1px, coins 8px.
- **Focus** : bordure et halo bleu lien à 25 %.

### Navigation
- **Barre** : bleu nuit dans les deux thèmes ; logo (fiole de mana) et « decksell » en Rajdhani ; « Modern » et « Commander » avec leur carré de couleur, puis « Estimer un deck » ; sur mobile, « Decks » et « Estimer ». À droite : bouton de thème (soleil ou lune, masqué sur mobile où il passe dans le pied de page), « Connexion » et « Créer un compte » ; une fois connecté, « Mes annonces », favoris, messages et l'avatar.

### Sections de l'accueil
- **Fonctions** : icône au trait de 20px dans une pastille bleu doux, titre et texte, sur trois colonnes sans cadre.
- **Étapes** : numéro sur pastille bleu doux, titre et texte.
- **Réassurance** : liste à coche verte dans un panneau, chaque point vérifiable dans le produit.

### Tableau de cartes (signature)
En-tête de panneau (titre, nombre de cartes, total), ligne d'en-têtes de colonnes (Qté, Carte, Prix) sur fond creux, puis une ligne par carte : quantité, miniature 30×42, gemme, nom, état et langue déclarés, édition et numéro (avec « Foil » et « la moins chère » quand c'est le cas, ou un avertissement si l'édition demandée est introuvable), illustrateur, prix tabulaire. En Commander, un panneau « Commandant » précède le panneau « Deck ». Tri par valeur décroissante ; les lignes apparaissent de la moins chère à la plus chère (320ms, départ à 35 % d'opacité pour que la liste ne paraisse jamais vide, décalage de 15ms, plafond 300ms), et la carte phare se retourne en dernier. Aperçu agrandi au survol, ouvert par-dessus la colonne de gauche.

## Do's and Don'ts

### Do:
- **Do** rester au niveau de finition de Moxfield et MTGGoldfish : sobre, dense, net.
- **Do** traiter Modern et Commander à égalité : même poids, même place, chacun sa couleur.
- **Do** garder les sections d'explication et de réassurance de l'accueil, demandées par l'utilisateur, et n'y écrire que des faits vérifiables dans le produit.
- **Do** utiliser le seul bleu d'action pour agir, l'orange seulement pour la carte phare et le magenta seulement pour Commander.
- **Do** afficher la rareté réelle avec les gemmes et marquer tout manque de prix par les hachures.
- **Do** écrire la valeur comme une phrase (« Ce deck vaut environ… ») avec la source, la date et l'édition retenue.
- **Do** respecter « réduire les animations » : apparition des lignes et retournement désactivés.
- **Do** soigner les deux thèmes : celui de l'appareil par défaut, le choix du bouton ensuite.

### Don't:
- **Don't** revenir à une direction illustrative ou « objet » (sachet, parchemin) : l'utilisateur l'a refusée, comme une typographie « Magic ».
- **Don't** utiliser parchemins, enluminures ou polices médiévales (trop fantasy).
- **Don't** transformer les prix en tableau de bord financier froid sans les détails Magic.
- **Don't** ajouter un second accent d'action, de doré ni de jaune.
- **Don't** rapprocher les couleurs des formats (pas de violet pour Commander) ni encadrer les liens de la barre.
- **Don't** remettre la jauge de prix sur l'accueil ou l'index : elle reste sur la fiche d'un deck.
- **Don't** surcharger : le décor ne doit jamais noyer l'estimation ni les prix.
