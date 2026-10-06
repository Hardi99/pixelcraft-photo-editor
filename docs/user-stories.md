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

L'epic est la vision : il ne se teste pas directement. Il est découpé en neuf stories, chacune livrable et vérifiable seule.

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
| US2-3 | Étant donné qu'aucune photo n'est importée, quand je choisis un format, alors le format change et le sélecteur de fichier ne s'ouvre pas à la place. | e2e (régression) |

## US3 — Écrire un texte qui a du style

**En tant que** créateur de contenu,
**je veux** ajouter des textes déjà mis en forme puis les personnaliser comme dans Canva,
**afin d'**obtenir un visuel soigné sans être graphiste.

| ID | Critère | Vérifié par |
|---|---|---|
| US3-1 | Avec l'outil Texte, je choisis « Titre », « Sous-titre » ou « Corps de texte » : le texte apparaît au centre de la photo, déjà mis en forme (police, taille, ombre), prêt à être modifié. | e2e |
| US3-2 | Je choisis parmi une quinzaine de polices adaptées aux réseaux ; chaque police est affichée dans sa propre fonte dans le menu, et le texte se redessine dès qu'elle est chargée. | e2e |
| US3-3 | Je règle la taille, la couleur, l'opacité, le gras, l'italique et l'alignement. | e2e |
| US3-4 | J'ajoute des effets : contour (couleur, épaisseur), ombre (couleur, flou, distance), surlignage derrière chaque ligne, espacement des lettres, interligne, passage en majuscules. | e2e |
| US3-5 | Étant donné un texte avec police et effets, quand j'enregistre puis rouvre le projet, alors la police et tous les effets sont restaurés. | e2e |

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
| US6-3 | Ce que j'exporte est ce que je vois : ni poignées de sélection, ni repères, ni guides magnétiques. | e2e |
| US6-4 | Je choisis JPEG (léger) ou PNG (sans perte) ; sur un appareil qui le permet, je peux partager directement vers une application. | manuel (le partage natif n'existe pas dans un navigateur de test) |

## US7 — Vérifier le rendu sur Instagram et X

**En tant que** créateur de contenu qui publie sur Instagram et X (Twitter),
**je veux** voir dans l'éditeur ce que chaque réseau masquera ou rognera,
**afin de** ne pas placer un texte important là où il sera coupé.

| ID | Critère | Vérifié par |
|---|---|---|
| US7-1 | Deux boutons, avec le logo de chaque réseau, activent l'aperçu Instagram ou l'aperçu X ; un seul aperçu à la fois. | e2e |
| US7-2 | Aperçu Instagram : en story, le haut (≈ 14 %) et le bas (≈ 20 %) recouverts par l'interface sont signalés ; en publication, les bords rognés par la grille du profil (affichée en 3:4). | e2e + unitaire |
| US7-3 | Aperçu X : la partie hors du cadrage 16:9 du fil est signalée (X recadre lui-même les images non 16:9 ; le repère montre un cadrage centré, à titre indicatif). | e2e + unitaire |
| US7-4 | Les repères ne font jamais partie de l'image exportée. | e2e |

## US8 — Mettre en page les éléments

**En tant que** créateur de contenu,
**je veux** placer et organiser précisément textes et stickers,
**afin d'**obtenir une composition propre, alignée et équilibrée.

| ID | Critère | Vérifié par |
|---|---|---|
| US8-1 | Quand je déplace un élément près du centre ou d'un bord de la photo, il s'y aimante et un guide s'affiche ; le guide disparaît au relâchement et n'est jamais exporté. | e2e |
| US8-2 | J'aligne l'élément sélectionné sur la page : gauche, centre, droite, haut, milieu, bas. | e2e |
| US8-3 | Je passe un élément au premier plan ou à l'arrière-plan des autres éléments (la photo reste toujours dessous). | e2e |
| US8-4 | Je duplique un élément (bouton ou Ctrl+D) ; la copie apparaît décalée et sélectionnée. | e2e |
| US8-5 | Un élément verrouillé ne peut être ni déplacé, ni redimensionné, ni modifié, ni supprimé, jusqu'à ce que je le déverrouille ; le verrou est conservé à l'enregistrement. | e2e |
| US8-6 | Un élément sélectionné n'affiche que quatre poignées d'angle (redimensionnement proportionnel, sans déformer le texte) ; au survol, le curseur devient une main, qui se ferme pendant le déplacement. | e2e |
| US8-7 | Juste à l'extérieur d'un coin, le curseur devient une flèche de rotation : en glissant, l'élément tourne autour de son centre, et s'aimante tous les 45° quand on s'en approche. | e2e |

## US9 — Utiliser PixelCraft sur l'écran adapté

**En tant que** créateur de contenu,
**je veux** une interface confortable sur ordinateur et tablette, et un message clair sur téléphone,
**afin de** ne pas me retrouver face à un éditeur inutilisable.

| ID | Critère | Vérifié par |
|---|---|---|
| US9-1 | De 1024 × 768 à 1920 × 1080, l'éditeur s'affiche sans défilement horizontal, la photo et ses panneaux restent visibles et aucun bouton n'est coupé. | e2e |
| US9-2 | Sur un écran de moins de 900 px de large, l'éditeur est remplacé par un message indiquant que PixelCraft s'utilise sur ordinateur ou tablette ; Mes projets et Statistiques restent consultables. | e2e |

