# Assistant Rapport de Stage et Exposé

Application web (HTML/CSS/JS + API Node) pour aider à la rédaction de rapports de stage et d'exposés. Déployée sur Vercel.

## Prérequis

- Node.js 22+
- npm

## Installation

```bash
npm ci
```

## Développement local

Lance le serveur de développement (port 3000 par défaut) :

```bash
npm run dev
```

Puis ouvre http://localhost:3000 dans le navigateur.

Le serveur :
- Sert les fichiers statiques (HTML, CSS, JS, images)
- Proxie les appels `/api/*` vers les handlers dans `api/`
- Définit `MOCK_AI=1` par défaut (simulation sans clé API)
- Refuse l'accès aux dossiers/fichiers sensibles (`.env`, `api/_*`, `node_modules`, `.git`, etc.)

## Qualité du code

Vérification ESLint :

```bash
npx eslint .
```

## Tests

Lance tous les tests (API, UI, export Word, serveur de dev) :

```bash
npm test
```

Le script utilise `MOCK_AI=1` pour ne jamais appeler la vraie API Anthropic.

Les tests couvrent :
- `tests/api.test.js` : routes API (mock, angle, plans, develop, sources, pay)
- `tests/ui.test.js` : interface (jsdom) - nom outil, scroll, recherche web, isSafeUrl, debounce, fetch timeout
- `tests/export.test.js` : export Word (docx) - LeaderType, buildDoc, TOC, bordures
- `tests/dev-server.test.js` : serveur de dev - sécurité (fichiers cachés, traversées)

## Déploiement

Le projet est déployé sur Vercel. La configuration se trouve dans `vercel.json` :
- Functions serverless pour `/api/*` (max 60s)
- En-têtes de sécurité (CSP, X-Frame-Options, etc.)

## Variables d'environnement

- `MOCK_AI=1` : active la simulation IA (par défaut en dev)
- `PORT` : port du serveur de dev (défaut 3000)

## Structure

```
├── index.html          # Page principale
├── app.js              # Application frontend
├── style.css           # Styles
├── dev-server.js       # Serveur de développement Node natif
├── vercel.json         # Config Vercel
├── eslint.config.js    # Config ESLint
├── vendor/
│   └── docx.iife.js    # docx en local (pas de CDN)
├── api/                # Routes API (Vercel functions)
│   ├── _mock.js        # Simulation IA
│   ├── _ai.js          # Appel Anthropic
│   ├── angle.js        # Problématique/angle
│   ├── plans.js        # Génération plans
│   ├── develop.js      # Rédaction parties
│   ├── sources.js      # Recherche sources
│   ├── pay-start.js    # Init paiement
│   └── pay-check.js    # Vérif paiement
├── modeles-couverture/ # Templates page de garde
├── tests/
│   ├── api.test.js
│   ├── ui.test.js
│   ├── export.test.js
│   └── dev-server.test.js
└── .github/workflows/ci.yml  # CI GitHub Actions
```

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) : à chaque push/PR sur main/master :
1. `npm ci`
2. `npx eslint .`
3. `npm test` (avec `MOCK_AI=1`)

Le workflow échoue si l'une de ces étapes échoue.