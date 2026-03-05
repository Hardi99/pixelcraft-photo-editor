# 🎨 PixelCraft — Éditeur de photos

![Rails](https://img.shields.io/badge/Ruby_on_Rails-7.1-CC0000?logo=rubyonrails&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)
![Fabric.js](https://img.shields.io/badge/Fabric.js-5.3-FF6B35?logoColor=white)
![Docker](https://img.shields.io/badge/Docker_Compose-2496ED?logo=docker&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-deployed-000000?logo=vercel&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-deployed-0B0D0E?logo=railway&logoColor=white)

Éditeur de photos en ligne type Instagram — ajoutez du texte, des filtres et des stickers sur vos photos PNG/JPG, sauvegardez vos projets et suivez vos KPIs.
Réalisé dans le cadre d'un test technique pour un poste en alternance.

🔗 **[Démo live](https://pixelcraft-photo-editor-front.vercel.app)**

---

## 🎯 Objectif du test technique

Ce projet démontre :
- Architecture **API Rails + React** découplée, propre et maintenable
- Maîtrise de **Fabric.js** pour la manipulation canvas côté client
- Accent mis sur les **KPIs et insights** (dashboard dédié avec Recharts)
- **Docker Compose** pour un environnement 100% reproductible sans rien installer
- Déploiement réel : **Vercel** (frontend) + **Railway** (backend + PostgreSQL)
- Code concis, structuré, explicable au premier coup d'œil

---

## ✨ Fonctionnalités

### Éditeur (core)
- ✅ **Upload** PNG/JPG par glisser-déposer ou file picker
- ✅ **Canvas Fabric.js** — image full-bleed cover mode, centrée et rognée proprement
- ✅ **Texte interactif** — draggable, redimensionnable, rotatif, éditable inline (placeholder auto-sélectionné)
- ✅ **Propriétés texte** — police, taille, couleur, opacité, gras/italique, alignement, ombre
- ✅ **Réglages image** — luminosité, contraste, saturation, flou (sliders temps réel)
- ✅ **4 ratios Instagram** — 1:1, 4:5, 16:9, 9:16 (image re-appliquée automatiquement)
- ✅ **Export PNG** haute résolution (2×)

### Bonus (différenciation)
- 🎨 **11 filtres Instagram** — Clarendon, Gingham, Moon, Lark, Reyes, Juno, Slumber, Crema, Ludwig, Aden, Nashville
- ↩️ **Undo/Redo** multi-niveaux (50 états) + raccourcis Ctrl+Z / Ctrl+Y
- 😊 **Stickers/Emojis** — 12 emojis positionnables et redimensionnables
- 💾 **Sauvegarde projet** — thumbnail base64 + layers JSON persistés en PostgreSQL
- 🖼️ **Galerie** — miniatures, réouverture complète du projet, suppression, temps d'édition
- 📊 **KPI Dashboard** — 4 métriques clés, bar chart outils, funnel Upload→Édition→Export
- 🔔 **Notifications Sonner** — feedback toast sur chaque action (save, export, suppression)
- 🤖 **PixelBot** — chatbot flottant avec conseils contextuels (outil actif, état du canvas)
- 📱 **Responsive** — sidebar masquée sous 1024px, canvas pleine largeur
- 🌑 **Dark mode** par défaut

---

## 🚀 Démarrage rapide

### Option A — Docker (recommandé, zéro config)

```bash
git clone https://github.com/Hardi99/pixelcraft-photo-editor
cd pixelcraft-photo-editor
docker-compose up --build
```

| Service     | URL                   |
|-------------|-----------------------|
| Frontend    | http://localhost:5173 |
| Backend API | http://localhost:3000 |

Peupler les données de démo (KPI dashboard) :
```bash
docker-compose exec backend bundle exec rails db:seed
```

### Option B — Sans Docker

**Prérequis** : Ruby 3.2, Node 20, PostgreSQL 15

```bash
# Backend
cd backend
bundle install
DATABASE_URL=postgresql://... bundle exec rake db:prepare
bundle exec rails server

# Frontend (autre terminal)
cd frontend
npm install
VITE_API_URL=http://localhost:3000 npm run dev
```

---

## 🏗️ Architecture

```
pixelcraft-photo-editor/
├── docker-compose.yml
├── backend/                              # Rails 7.1 API only
│   ├── app/
│   │   ├── controllers/api/v1/
│   │   │   ├── projects_controller.rb   # CRUD projets (thumbnail base64)
│   │   │   ├── stats_controller.rb      # KPI agrégés
│   │   │   └── events_controller.rb     # Tracking actions
│   │   └── models/
│   │       ├── project.rb               # title, layers_json, thumbnail, editing_time
│   │       └── event.rb                 # action_name + metadata jsonb
│   ├── config/initializers/cors.rb      # Vercel + Railway autorisés
│   └── db/migrate/                      # 4 migrations
└── frontend/                            # React 18 + TypeScript
    └── src/
        ├── components/
        │   ├── Editor/
        │   │   ├── Canvas.tsx           # Fabric.js — cœur éditeur
        │   │   ├── TextToolbar.tsx      # Propriétés texte sélectionné
        │   │   └── FilterPresets.tsx    # Strip 11 filtres Instagram
        │   ├── Sidebar/
        │   │   ├── LeftSidebar.tsx      # Outils + stickers + ratios
        │   │   └── RightSidebar.tsx     # Réglages image + raccourcis
        │   ├── Gallery.tsx              # Projets avec miniatures
        │   ├── KPIDashboard.tsx         # Recharts bar + funnel
        │   ├── AssistantBot.tsx         # Chatbot flottant
        │   └── Header.tsx              # Nav + Save + Export
        ├── stores/editorStore.ts        # Zustand — state global + undo/redo
        ├── hooks/
        │   ├── useCanvas.ts             # Fabric.js wrappé (filtres, export…)
        │   └── useProjects.ts           # TanStack Query v5
        └── lib/
            ├── api.ts                   # Client REST JSON
            └── filters.ts               # 11 presets Instagram (Fabric filters)
```

---

## 📡 API REST

| Méthode | Route                | Description                              |
|---------|----------------------|------------------------------------------|
| GET     | /api/v1/projects     | Liste des projets avec thumbnail         |
| POST    | /api/v1/projects     | Création (JSON — thumbnail base64)       |
| GET     | /api/v1/projects/:id | Détail + layers_json                     |
| PATCH   | /api/v1/projects/:id | Mise à jour layers + thumbnail           |
| DELETE  | /api/v1/projects/:id | Suppression                              |
| GET     | /api/v1/stats        | KPIs agrégés (dashboard)                 |
| POST    | /api/v1/events       | Tracking d'actions utilisateur           |

---

## 📦 Stack technique

| Technologie    | Version | Rôle                                   |
|----------------|---------|----------------------------------------|
| Ruby on Rails  | 7.1     | API REST, PostgreSQL ORM               |
| PostgreSQL     | 15      | Base de données (projets + events)     |
| React          | 18      | UI frontend                            |
| TypeScript     | 5.3     | Typage statique                        |
| Vite           | 5       | Build tool + HMR                       |
| Fabric.js      | 5.3     | Canvas éditeur (manipulation, filtres) |
| Tailwind CSS   | 3.4     | Styles utilitaires                     |
| shadcn/ui      | —       | Composants UI (Button, Slider…)        |
| Zustand        | 4.4     | State global + historique undo/redo    |
| TanStack Query | 5       | Cache API + mutations                  |
| Recharts       | 2.10    | Graphiques KPI                         |
| Sonner         | 1.4     | Notifications toast                    |
| Docker Compose | —       | Environnement dev complet              |

---

## 💡 Choix techniques

### Thumbnail base64 en DB plutôt qu'ActiveStorage fichier
- **Pourquoi ?** Les containers Railway ont un filesystem éphémère — les fichiers sont perdus à chaque redeploy. Stocker le thumbnail JPEG (qualité 0.7, scale 0.5×) directement dans PostgreSQL garantit la persistance sans dépendance externe (S3, Cloudinary).
- **Inconvénient** : colonne TEXT plus lourde qu'une référence de fichier. Acceptable pour un éditeur photo sans contrainte de volume.

### Rails API mode
- Séparation claire frontend/backend, stateless, déploiement découplé Vercel/Railway
- CORS géré par `rack-cors` avec patterns regex pour `*.vercel.app` et `*.railway.app`

### Fabric.js 5.x
- La référence canvas : sélection, transformation, filtres WebGL, sérialisation JSON native
- Les filtres Instagram combinent `Brightness`, `Contrast`, `Saturation`, `Sepia`, `HueRotation`
- Undo/redo via snapshots JSON (50 états max) + `canvas.loadFromJSON`

### Zustand sans Immer
- Les objets Fabric.js ne sont pas sérialisables → Immer incompatible
- Store minimaliste : canvas stocké en `any` pour éviter les imports circulaires

### TanStack Query v5
- Cache automatique, invalidation sur mutation, `refetchInterval: 30s` pour le dashboard live

### Pas de Repository Pattern ni Service Layer
- YAGNI — controllers Rails < 50 lignes, `Project.order(...)` suffit

---

## 🎨 Interface

```
┌──────────────────────────────────────────────────────┐
│  Logo  |  Titre projet  |  Éditeur Galerie Insights  │  ← Header
│                         |  Undo Redo | Save | Export │
├──────┬──────────────────────────────┬────────────────┤
│      │   TextToolbar (si texte)     │                │
│ Left │──────────────────────────────│  RightSidebar  │
│ Side │                              │  (≥ 1024px)    │
│ bar  │      Canvas Fabric.js        │  Réglages +    │
│ 64px │      cover mode              │  Raccourcis    │
│      │                              │                │
├──────┴──────────────────────────────┴────────────────┤
│              FilterPresets Strip (11 filtres)        │
└──────────────────────────────────────────────────────┘
                                              🤖 PixelBot
```

### Raccourcis clavier
| Touche   | Action          |
|----------|-----------------|
| `V`      | Outil sélection |
| `T`      | Outil texte     |
| `S`      | Stickers        |
| `R`      | Ratio/Format    |
| `Delete` | Supprimer objet |
| `Ctrl+Z` | Annuler         |
| `Ctrl+Y` | Rétablir        |

---

## 📊 KPI Dashboard

- **4 métriques** : projets créés, exports totaux, actions tracées, temps moyen d'édition
- **Bar chart** des outils les plus utilisés (Select, Text, Sticker, Filter, Export…)
- **Funnel de conversion** Upload → Édition → Export avec taux par étape
- Mise à jour automatique toutes les **30 secondes**
- Données de démo insérées via `db:seed` (18 events, 3 projets)

---

## 🚧 Améliorations possibles

### Fonctionnalités
- [ ] Authentification utilisateur (Devise + JWT)
- [ ] Stockage images S3/Cloudinary pour fichiers lourds
- [ ] Formes vectorielles (rectangles, cercles, flèches)
- [ ] Templates prédéfinis (Story, Post, Bannière)
- [ ] Mode collaboratif temps réel (WebSockets ActionCable)

### Technique
- [ ] Tests backend (RSpec + FactoryBot)
- [ ] Tests frontend (Vitest + Testing Library)
- [ ] CI/CD GitHub Actions
- [ ] Rate limiting API (Rack::Attack)
- [ ] PWA (installation mobile)

---

## 📄 Licence

MIT
