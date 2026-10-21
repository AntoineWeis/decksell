---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: []
---

# Surface : accueil (/)

Mode : Persuade. Visiteurs : vendeurs et acheteurs de decks Modern complets. Action : coller une decklist et l'estimer, puis la mettre en vente. Preuve : l'estimation réelle (prix Cardmarket datés, cartes manquantes visibles). Contraintes : français, tutoiement, thèmes clair et sombre, rien d'inventé (ni avis, ni chiffres d'usage).

## Direction contract

THESIS : decksell est un outil de deck de la famille Moxfield / MTGGoldfish, exécuté sans compromis : on colle sa liste et on lit un prix fiable, carte par carte. Choix assumé du standard de la catégorie (sortie « canon » de la page de décision) ; refuse le décor illustratif et le hero marketing générique.

OWN-WORLD : Interface d'outil bleutée. Fond bleu nuit en sombre, gris-bleu très clair en clair ; panneaux légèrement plus clairs séparés par des filets fins ; un bleu vif unique pour les actions, les liens et le focus. Titres en Sora (géométrique, demi-gras), texte en Geist, chiffres tabulaires. Bandeau d'en-tête façon page de deck Moxfield : illustration de carte floutée et assombrie sous un dégradé. Gemmes de rareté aux vraies couleurs Magic, hachures pour ce qui n'a pas de prix, orange mythique pour la carte phare.

STORY : Le visiteur comprend en une ligne que decksell chiffre un deck entier en euros puis aide à le vendre ; il voit ce que fait le site, comment, et pourquoi croire les prix (source, règle, manques signalés) ; il clique sur « Estimer mon deck » ou crée un compte vendeur.

FIRST VIEWPORT : Header bleu nuit compact. Bandeau pleine largeur avec illustration floutée : titre Sora « Combien vaut ton deck Modern ? », une phrase d'explication, bouton bleu « Estimer mon deck » (action principale, vers /estimer) et bouton secondaire « Créer un compte vendeur ». Puis sections : ce que fait decksell (trois fonctions), comment ça marche (quatre étapes), des prix vérifiables (réassurance), vendeurs et acheteurs (côté acheteurs marqué « En préparation »), appel final.

FORM : Standard de la catégorie (canon), choisi par l'utilisateur après refus de la direction tirée « booster scellé » ; références de finition : Moxfield, MTGGoldfish. seed:d7f024e2f4fdb963. Signature : les lignes de cartes apparaissent en cascade de la moins chère à la plus chère et la carte phare se retourne en dernier ; tableau de cartes à en-têtes de colonnes façon MTGGoldfish.

FINISH : unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Décisions ouvertes

- La page publique des annonces (côté acheteurs) n'existe pas encore ; elle héritera de ce monde.
