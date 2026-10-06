# User stories — PixelCraft

Chaque critère d'acceptation porte un identifiant (`US6-2`…) repris dans le nom du test qui le vérifie. Un critère sans test est signalé comme tel : c'est une dette, pas un oubli.

| Où sont les tests | Lancer |
|---|---|
| `frontend/e2e/` — parcours complets dans un vrai navigateur (Playwright) | `npm run test:e2e` |
| `frontend/src/**/*.test.ts` — logique isolée (Vitest) | `npm test` |
| `backend/spec/` — API, modèles, statistiques (RSpec) | `bundle exec rspec` |

---

## Epic — Créer mes publications Instagram avec PixelCraft

**En tant que** créateur de contenu qui publie sur Instagram,
**je veux** préparer mes visuels (photo, texte, filtre) dans un seul outil en ligne,
**afin de** publier des posts soignés sans passer par un logiciel de retouche.

L'epic est la vision : il ne se teste pas directement. Il est découpé en six stories, chacune livrable et vérifiable seule.

---

## US1 — Importer ma photo

**En tant que** créateur de contenu,
**je veux** importer une photo depuis mon ordinateur,
**afin de** construire mon visuel à partir de mes propres images.

| ID | Critère | Vérifié par |
|---|---|---|
| US1-1 | Étant donné un PNG ou un JPG de moins de 10 Mo, quand je le dépose, alors il remplit tout le format choisi sans être déformé (rogné au centre si les proportions diffèrent). | e2e |
| US1-2 | Étant donné un fichier qui n'est pas une image, même renommé en `.png`, quand je le dépose, alors un message indique que seuls PNG et JPG sont acceptés et l'éditeur reste vide. | e2e |
| US1-3 | Étant donné un fichier de plus de 10 Mo, quand je le dépose, alors un message indique la limite. | e2e |

## US2 — Choisir le format de publication

**En tant que** créateur de contenu,
**je veux** choisir le format de ma publication avant ou pendant la retouche,
**afin que** mon visuel corresponde à l'endroit où je le publie (fil, grille, story).

| ID | Critère | Vérifié par |
|---|---|---|
| US2-1 | Les formats proposés sont : carré 1:1, portrait 4:5, portrait 3:4, story 9:16, paysage 16:9. | e2e |
| US2-2 | Étant donné une photo avec des textes et un filtre, quand je change de format, alors les textes, les stickers et le filtre sont conservés. | e2e |

## US3 — Écrire un texte lisible

**En tant que** créateur de contenu,
**je veux** écrire un texte sur ma photo,
**afin de** faire passer un message dans ma publication.

| ID | Critère | Vérifié par |
|---|---|---|
| US3-1 | Avec l'outil Texte, un clic sur la photo place un texte modifiable, blanc avec une ombre portée, lisible sur fond clair comme sur fond sombre. | e2e |
| US3-2 | Je peux changer la police, la taille, la couleur, l'opacité, le gras, l'italique et l'alignement. | manuel |
| US3-3 | En story, les zones recouvertes par l'interface d'Instagram (≈ 14 % en haut, 20 % en bas) sont signalées. En publication, les bords rognés par la grille du profil (affichée en 3:4) le sont aussi. | e2e + unitaire |
| US3-4 | Ces repères n'apparaissent jamais dans l'image exportée. | e2e |

## US4 — Appliquer un filtre

**En tant que** créateur de contenu,
**je veux** comparer les filtres sur ma propre photo,
**afin de** choisir une ambiance sans essayer à l'aveugle.

| ID | Critère | Vérifié par |
|---|---|---|
| US4-1 | Chaque filtre est prévisualisé avec ma photo, pas avec une image d'exemple. | e2e |
| US4-2 | Appliquer un filtre modifie la photo, jamais les textes. | e2e |

## US5 — Enregistrer et reprendre un projet

**En tant que** créateur de contenu,
**je veux** enregistrer mon visuel et le rouvrir plus tard,
**afin de** le terminer en plusieurs fois.

| ID | Critère | Vérifié par |
|---|---|---|
| US5-1 | Étant donné un projet enregistré, quand je le rouvre, alors le format, le filtre et chaque texte sont restaurés, chaque texte une seule fois. | e2e |
| US5-2 | La photo rouverte a la même résolution qu'à l'import. | e2e |
| US5-3 | Une autre personne, depuis un autre navigateur, ne voit pas mes projets. | e2e + RSpec |

## US6 — Exporter pour Instagram

**En tant que** créateur de contenu qui publie sur Instagram,
**je veux** exporter mon image aux dimensions qu'Instagram attend pour chaque type de publication,
**afin qu'**elle soit publiée telle que je l'ai composée, sans recadrage ni perte de netteté.

Dimensions vérifiées en octobre 2026 dans plusieurs guides de référence (Instagram ne publie pas de grille officielle unique) :

| Format | Fichier exporté |
|---|---|
| Carré 1:1 | 1080 × 1080 px |
| Portrait 4:5 | 1080 × 1350 px |
| Portrait 3:4 (entier dans la grille du profil) | 1080 × 1440 px |
| Story 9:16 | 1080 × 1920 px |
| Paysage 16:9 | 1920 × 1080 px |

| ID | Critère | Vérifié par |
|---|---|---|
| US6-1 | Étant donné un format, quand j'exporte, alors le fichier a exactement les dimensions du tableau. | e2e + unitaire |
| US6-2 | Étant donné que je travaille sur un petit écran, quand j'exporte, alors les dimensions sont les mêmes que sur un grand écran. | e2e |
| US6-3 | Ce que j'exporte est ce que je vois : ni poignées de sélection, ni repères. | e2e |
| US6-4 | Je choisis JPEG (léger) ou PNG (sans perte) ; sur un appareil qui le permet, je peux partager directement vers une application. | manuel (le partage natif n'existe pas dans un navigateur de test) |
