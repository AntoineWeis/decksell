---
version: 1
slug: "src-app-estimer-page-tsx"
primary_target: "src/app/estimer/page.tsx"
related_targets: ["src/components/estimator.tsx","src/components/card-list.tsx"]
---

# Surface : estimation (/estimer)

Mode : Operate. Visiteurs : vendeurs et acheteurs de decks Modern complets. Action : coller une decklist et l'estimer, puis la mettre en vente. Preuve : l'estimation réelle (prix Cardmarket datés, cartes manquantes visibles). Contraintes : français, tutoiement, thèmes clair et sombre, rien d'inventé (ni avis, ni chiffres d'usage).

## Direction contract

THESIS : decksell est un outil de deck de la famille Moxfield / MTGGoldfish, exécuté sans compromis : on colle sa liste et on lit un prix fiable, carte par carte. Choix assumé du standard de la catégorie (sortie « canon » de la page de décision) ; refuse le décor illustratif et le hero marketing générique.

OWN-WORLD : Interface d'outil bleutée. Fond bleu nuit en sombre, gris-bleu très clair en clair ; panneaux légèrement plus clairs séparés par des filets fins ; un bleu vif unique pour les actions, les liens et le focus. Titres en Sora (géométrique, demi-gras), texte en Geist, chiffres tabulaires. Bandeau d'en-tête façon page de deck Moxfield : illustration de carte floutée et assombrie sous un dégradé. Gemmes de rareté aux vraies couleurs Magic, hachures pour ce qui n'a pas de prix, orange mythique pour la carte phare.

STORY : Le visiteur colle sa liste dans le panneau de gauche, lit la valeur et le détail à droite comme sur une page de deck, croit le prix parce que source, date et manques sont visibles, puis met le deck en vente sans changer de page.

FIRST VIEWPORT : Header bleu nuit. Bandeau compact avec illustration floutée, titre « Estime la valeur de ton deck » et puces d'information. Dessous, deux colonnes : à gauche le panneau decklist (champ, exemple, bouton bleu « Estimer le deck ») ; à droite le résultat, ou le mode d'emploi avant estimation.

FORM : Standard de la catégorie (canon), choisi par l'utilisateur après refus de la direction tirée « booster scellé » ; références de finition : Moxfield, MTGGoldfish. seed:d7f024e2f4fdb963. Signature : les lignes de cartes apparaissent en cascade de la moins chère à la plus chère et la carte phare se retourne en dernier ; tableau de cartes à en-têtes de colonnes façon MTGGoldfish.

FINISH : unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Décisions ouvertes

- La page publique des annonces (côté acheteurs) n'existe pas encore ; elle héritera de ce monde.
