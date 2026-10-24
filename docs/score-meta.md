# Score de proximité méta

Le score indique **à quel point une liste ressemble aux listes Modern qui ont fait des résultats
récemment**. Il sert à classer et à repérer les listes « méta » ; il ne mesure ni le niveau de
jeu, ni les chances de gagner. Deux listes à 85/100 se ressemblent beaucoup : elles ne sont pas
pour autant aussi fortes l'une que l'autre.

Code : `src/lib/similarity.ts` (calcul), `src/lib/meta-match.ts` (comparaison au corpus),
`src/lib/meta-config.ts` (réglages), `scripts/import-meta.mjs` (import des listes de tournoi).
Tests : `tests/similarity.test.ts`.

## Listes de référence

Source unique : **résultats officiels MTGO** (mtgo.com/decklists), publiés par Wizards — Modern
Challenges (avec classement) et Modern Leagues (listes 5-0), en données structurées.

Pourquoi cette seule source : c'est le **risque légal le plus faible** (données publiques de
l'éditeur du jeu, aucune lecture de HTML d'un site tiers) et la plus **fraîche** (plusieurs
événements par jour). MTGTop8 (pas d'API, pas de conditions d'usage publiées), MTGGoldfish
(son `robots.txt` interdit le téléchargement des listes) et les caches communautaires (sans
licence) ont été écartés. Les tournois papier ne sont donc pas couverts : pour le Modern, le
méta MTGO en est un bon reflet.

- Fenêtre : 30 derniers jours (`META_WINDOW_DAYS`) ; les listes plus anciennes sont retirées.
- Import quotidien (GitHub Actions, `npm run import:meta`), **incrémental** : seuls les événements
  pas encore importés sont lus (quelques pages par jour). Les données ont au plus un jour de retard.
- L'import échoue (et le signale) si la page MTGO ne contient plus aucun événement : un changement
  de structure ne passe pas inaperçu.
- Une même liste (même date, mêmes cartes) n'est gardée qu'une fois ; une liste de moins de
  40 cartes au principal est ignorée.
- **Noms d'archétypes** : MTGO n'en donne pas. Chaque liste est nommée d'après les cartes types
  des archétypes du site (`src/lib/archetype-signatures.ts`, données propres) : l'archétype dont
  elle joue le plus de cartes clés, au-delà d'un minimum, sinon « non nommée ». Le nom ne sert
  qu'à l'affichage, jamais au score.

## Calcul

### 1. Normalisation des cartes

Chaque carte est réduite à une clé : nom de la première face, en minuscules, sans accents,
apostrophes uniformisées (`normalizeName`, déjà utilisé par l'estimation). « Wear/Tear »,
« Wear // Tear » et « wear // tear » donnent la même clé ; « Fable of the Mirror-Breaker » et sa
version recto-verso aussi. Pour une annonce, on prend le **nom officiel trouvé en base** quand la
carte est reconnue (variantes d'écriture corrigées) ; sinon le nom saisi, et la carte est
comptée comme inconnue.

### 2. Poids des cartes

Toutes les cartes ne se valent pas pour dire « ces deux listes jouent la même chose » :
partager des fetchlands ou Lightning Bolt (joués partout) est moins parlant que partager
Goryo's Vengeance. Chaque carte reçoit un poids d'après sa fréquence dans le corpus
(inverse de la fréquence documentaire) :

```
poids = ln(1 + N / df)      borné entre 0,35 et 4,5
```

`N` = nombre de listes du corpus, `df` = nombre de listes qui jouent la carte (principal ou
réserve). Les terres de base sont multipliées par 0,4 (interchangeables). Une carte qu'aucune
liste de tournoi ne joue prend le poids maximal : elle éloigne vraiment une liste du méta.

### 3. Similarité d'une partie du deck (principal ou réserve)

Similarité de Ruzicka pondérée (Jaccard pondéré sur les quantités), de 0 à 1 :

```
S = Σ poids(c) × min(qA(c), qB(c))  /  Σ poids(c) × max(qA(c), qB(c))
```

- les **cartes communes** et leurs **quantités** comptent (min) ;
- les **différences** comptent dans les deux sens (max) : une carte en plus d'un côté, ou en
  moindre quantité, fait baisser le score — ce n'est pas un simple nombre de cartes partagées ;
- 4 exemplaires contre 1 ne valent pas 4 contre 4.

### 4. Score global

```
score = 100 × (0,8 × S_principal + 0,2 × S_réserve)
```

Pondération 0,8 / 0,2 (`BOARD_WEIGHTS`, réglable) : le principal fait 60 cartes sur 75 (80 %)
et porte le plan de jeu ; la réserve répond au méta du moment et varie beaucoup, même entre deux
pilotes du même archétype. Si une réserve manque d'un côté, le score porte sur le principal seul
et l'affiche (« réserve absente ») : une réserve absente n'est pas comptée comme différente.

### 5. Comparaison au méta

La liste est comparée à toutes les listes du corpus ; **son score est celui de la liste la plus
proche** (pas une moyenne d'archétype). L'archétype ne remplace jamais la comparaison des listes :
il sert seulement à regrouper l'affichage (« proche aussi de… », la meilleure liste de chaque
autre archétype). Une annonce sans archétype renseigné est notée de la même façon.

À score égal, la liste la plus récente puis la mieux classée l'emporte.

## Lecture du score

| Score | Lecture | Sens |
|---|---|---|
| 75–100 | Liste méta | Très proche d'une liste récente de tournoi |
| 55–74 | Proche du méta | Même base, plusieurs choix différents |
| 35–54 | Variante | Un noyau commun, une construction personnelle |
| 0–34 | Hors méta | Aucune liste récente n'en est proche |

Paliers réglables dans `VERDICTS`. Le script d'import affiche une calibration (score de chaque
liste nommée avec sa plus proche voisine du même archétype et d'un autre) pour vérifier que les
paliers séparent bien les deux.

## Données manquantes et listes invalides

| Cas | Comportement |
|---|---|
| Liste absente ou principal < 40 cartes | Pas de score (« deck principal incomplet ») |
| Lignes illisibles (quantité mal formée…) | Ignorées par l'analyse, score « partiel » avec avertissement |
| Cartes non reconnues | Comparées par leur nom saisi, comptées ; au-delà de 20 % des exemplaires, score « fragile » (pas de badge) |
| Réserve absente | Score sur le principal seul, signalé |
| Corpus vide (pas encore d'import) | Aucun score enregistré (inconnu, pas zéro) |

Un score partiel ou fragile est toujours affiché comme tel ; il n'est jamais présenté comme fiable.

## Performance

~1 500 listes de référence × ~45 cartes : quelques millisecondes par annonce. Le corpus est lu en
cache (une heure) ; le score de chaque annonce est enregistré (`listings.meta_score`) à la
publication, à chaque changement de liste et après chaque import, pour les vignettes.
