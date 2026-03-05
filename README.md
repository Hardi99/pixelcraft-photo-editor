# 🎨 PixelCraft — Éditeur de photos

![Rails](https://img.shields.io/badge/Ruby_on_Rails-7.1-CC0000?logo=rubyonrails&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)
![Fabric.js](https://img.shields.io/badge/Fabric.js-5.3-FF6B35?logoColor=white)
![Docker](https://img.shields.io/badge/Docker_Compose-3.9-2496ED?logo=docker&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)

Éditeur de photos en ligne type Instagram — ajoutez du texte, des filtres et des stickers sur vos photos PNG/JPG.
Réalisé dans le cadre d'un test technique pour un poste en alternance.

---

## 🎯 Objectif du test technique

Ce projet démontre :
- Architecture **API Rails + React** découplée, propre et maintenable
- Maîtrise de **Fabric.js** pour la manipulation canvas côté client
- Accent mis sur les **KPIs et insights** (dashboard dédié avec Recharts)
- **Docker Compose** pour un environnement 100% reproductible
- Code concis, structuré, explicable au premier coup d'œil

---

## ✨ Fonctionnalités

### Éditeur (core)
- ✅ **Upload** PNG/JPG par glisser-déposer ou file picker
- ✅ **Canvas Fabric.js** — image affichée, redimensionnée au ratio choisi
- ✅ **Texte interactif** — draggable, redimensionnable, rotatif, éditable en double-clic
- ✅ **Propriétés texte** — police, taille, couleur, opacité, gras/italique, alignement, ombre
- ✅ **Réglages image** — luminosité, contraste, saturation, flou (sliders temps réel)
- ✅ **Ratios Instagram** — 1:1, 4:5, 16:9, 9:16
- ✅ **Export PNG** — haute résolution (2×)

### Bonus (différenciation)
- 🎨 **11 filtres Instagram** (Clarendon, Gingham, Moon, Lark, Reyes, Juno, Slumber, Crema, Ludwig, Aden…)
- ↩️ **Undo/Redo** multi-niveaux (50 états) + raccourcis clavier Ctrl+Z / Ctrl+Y
- 😊 **Stickers/Emojis** — 12 emojis cliquables, positionnables sur le canvas
- 💾 **Sauvegarde projet** — layers JSON + image → backend Rails + PostgreSQL
- 🖼️ **Galerie** — liste des projets avec miniatures, temps d'édition, exports
- 📊 **KPI Dashboard** — uploads, exports, outil le plus utilisé (bar chart), funnel de conversion
- 🤖 **Assistant Bot** — conseils contextuels selon l'outil actif, chatbot simulé
- 🌑 **Dark mode** par défaut

---

## 🚀 Démarrage rapide

### Prérequis
- **Docker Desktop** installé et démarré — c'est tout !

### Lancement

```bash
git clone <votre-repo>
cd TT_CLIKING
docker-compose up --build
```

| Service     | URL                        |
|-------------|----------------------------|
| Frontend    | http://localhost:5173      |
| Backend API | http://localhost:3000      |

Pour peupler les stats du dashboard :
```bash
docker-compose exec backend bundle exec rails db:seed
```

---

## 🏗️ Architecture

```
TT_CLIKING/
├── docker-compose.yml
├── backend/                          # Rails 7.1 API
│   ├── app/
│   │   ├── controllers/api/v1/
│   │   │   ├── projects_controller.rb   # CRUD + ActiveStorage
│   │   │   ├── stats_controller.rb      # KPI agrégés
│   │   │   └── events_controller.rb     # Tracking actions
│   │   └── models/
│   │       ├── project.rb               # has_one_attached :image
│   │       └── event.rb                 # action_name + metadata jsonb
│   └── db/migrate/                      # 3 migrations
└── frontend/                         # React 18 + TypeScript
    └── src/
        ├── components/
        │   ├── Editor/
        │   │   ├── Canvas.tsx           # Fabric.js — cœur éditeur
        │   │   ├── TextToolbar.tsx      # Propriétés texte
        │   │   └── FilterPresets.tsx    # Strip filtres Instagram
        │   ├── Sidebar/
        │   │   ├── LeftSidebar.tsx      # Outils + stickers + ratios
        │   │   └── RightSidebar.tsx     # Réglages image + raccourcis
        │   ├── Gallery.tsx              # Projets sauvegardés
        │   ├── KPIDashboard.tsx         # Stats + charts Recharts
        │   └── AssistantBot.tsx         # Chatbot flottant
        ├── stores/editorStore.ts        # Zustand + undo/redo
        ├── hooks/
        │   ├── useCanvas.ts             # API Fabric.js wrappée
        │   └── useProjects.ts           # TanStack Query v5
        └── lib/
            ├── api.ts                   # Client REST
            └── filters.ts               # 11 presets Instagram
```

---

## 📡 API REST

| Méthode | Route                | Description                          |
|---------|----------------------|--------------------------------------|
| GET     | /api/v1/projects     | Liste des projets avec image_url     |
| POST    | /api/v1/projects     | Création + upload image (multipart)  |
| GET     | /api/v1/projects/:id | Détail + layers_json                 |
| PATCH   | /api/v1/projects/:id | Sauvegarde layers + temps d'édition  |
| DELETE  | /api/v1/projects/:id | Suppression                          |
| GET     | /api/v1/stats        | KPIs agrégés (dashboard)             |
| POST    | /api/v1/events       | Tracking d'actions utilisateur       |

---

## 📦 Stack technique

| Technologie         | Version | Rôle                              |
|---------------------|---------|-----------------------------------|
| Ruby on Rails       | 7.1     | API REST + ActiveStorage          |
| PostgreSQL          | 15      | Base de données                   |
| React               | 18      | UI frontend                       |
| TypeScript          | 5.3     | Typage statique                   |
| Vite                | 5       | Build tool                        |
| Fabric.js           | 5.3     | Canvas éditeur (manipulation)     |
| Tailwind CSS        | 3.4     | Styles utilitaires                |
| shadcn/ui           | —       | Composants UI (Button, Slider…)   |
| Zustand             | 4.4     | State global + undo/redo          |
| TanStack Query      | 5       | Cache API + mutations             |
| Recharts            | 2.10    | Graphiques KPI                    |
| Docker Compose      | 3.9     | Environnement dev complet         |

---

## 💡 Choix techniques

### Rails API mode
- **Pourquoi ?** Séparation claire frontend/backend, stateless, facilite le déploiement découplé
- ActiveStorage pour l'upload : intégré Rails, zero dépendance externe en dev

### Fabric.js 5.x
- **Pourquoi ?** La référence pour la manipulation canvas : gestion native de la sélection, transformation, filtres WebGL, undo/redo via `toJSON/loadFromJSON`
- Les filtres Instagram sont des combinaisons de `Brightness`, `Contrast`, `Saturation`, `Sepia`, `HueRotation` appliqués sur l'image de fond

### Zustand + historique manuel
- **Pourquoi ?** Plus léger que Redux, API minimaliste, snapshot JSON du canvas stocké dans un tableau (50 états max)
- Pas de `zundo` (dépendance supplémentaire) — l'historique est géré nativement avec `canvas.loadFromJSON`

### TanStack Query v5
- **Pourquoi ?** Cache automatique, invalidation sur mutation, `refetchInterval` pour les stats dashboard en temps réel

### Pas de Repository Pattern / Service Layer
- YAGNI — les controllers Rails restent à moins de 50 lignes, Eloquent-like avec `Project.order(...)`

---

## 🎨 Interface

### Layout
```
┌─────────────────────────────────────────┐
│              Header                     │ ← Logo, titre projet, Undo/Redo, Save, Export
├──────┬──────────────────────┬───────────┤
│      │   TextToolbar        │           │ ← Affiché si texte sélectionné
│ Left │──────────────────────│  Right    │
│ Side │                      │  Side     │ ← Réglages image + raccourcis
│ bar  │   Canvas Fabric.js   │  bar      │
│      │                      │           │
├──────┴──────────────────────┴───────────┤
│         FilterPresets Strip             │ ← 11 filtres Instagram
└─────────────────────────────────────────┘
                              🤖  ← AssistantBot flottant
```

### Raccourcis clavier
| Touche    | Action           |
|-----------|-----------------|
| `V`       | Outil sélection |
| `T`       | Outil texte     |
| `S`       | Stickers        |
| `R`       | Ratio/Format    |
| `Delete`  | Supprimer objet |
| `Ctrl+Z`  | Annuler         |
| `Ctrl+Y`  | Rétablir        |

---

## 📊 KPI Dashboard

Le dashboard met en avant les métriques clés :
- **Projets créés** / **Exports totaux** / **Actions tracées** / **Temps moyen d'édition**
- **Bar chart** des outils les plus utilisés (Recharts)
- **Funnel de conversion** Upload → Édition → Export avec taux de conversion
- Mise à jour automatique toutes les 30 secondes

---

## 🚧 Améliorations possibles

### Fonctionnalités
- [ ] Authentification utilisateur (Devise + JWT)
- [ ] Upload vers S3/Cloudinary pour la production
- [ ] Couche de formes (rectangles, cercles, flèches)
- [ ] Mode collaboratif temps réel (WebSockets)
- [ ] Templates prédéfinis (Story, Post, Bannière)

### Technique
- [ ] Tests backend (RSpec + FactoryBot)
- [ ] Tests frontend (Vitest + Testing Library)
- [ ] CI/CD GitHub Actions
- [ ] Rate limiting API (Rack::Attack)

---

## 📄 Licence

MIT
