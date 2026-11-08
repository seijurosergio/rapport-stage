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

Lance tous les tests (API, UI, export Word, serveur de dev, parité couverture) :

```bash
npm test
```

Le script utilise `MOCK_AI=1` pour ne jamais appeler la vraie API Anthropic.

Les tests couvrent :
- `tests/api.test.js` : routes API (mock, angle, plans, develop, sources, pay)
- `tests/ui.test.js` : interface (jsdom) - nom outil, scroll, recherche web, isSafeUrl, debounce, fetch timeout
- `tests/export.test.js` : export Word (docx) - LeaderType, buildDoc, TOC, bordures
- `tests/dev-server.test.js` : serveur de dev - sécurité (fichiers cachés, traversées)
- `tests/cover-parity.test.js` : parité aperçu/Word pour tous modèles/bannières
- `tests/storage.test.js` : stockage localStorage (migrations, quotas)
- `tests/dialogs.test.js` : boîtes de dialogue accessibles (Échap, focus trap)
- `tests/utils.test.js` : utilitaires purs (roman, labels, parseCustom, fmtCite, isSafeUrl, etc.)

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
├── js/
│   ├── utils.js        # Utilitaires purs (UMD/Node)
│   ├── cover-data.js   # Données page de garde (UMD/Node)
│   ├── storage.js      # Stockage localStorage (UMD/Node)
│   ├── dialogs.js      # Boîtes de dialogue accessibles (UMD/Node)
│   └── export-docx.js  # Génération Word (UMD/Node)
├── modeles-couverture/ # Templates page de garde
├── tests/
│   ├── api.test.js
│   ├── ui.test.js
│   ├── export.test.js
│   ├── dev-server.test.js
│   ├── cover-parity.test.js
│   ├── storage.test.js
│   ├── dialogs.test.js
│   └── utils.test.js
└── .github/workflows/ci.yml  # CI GitHub Actions
```

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) : à chaque push/PR sur main/master :
1. `npm ci`
2. `npx eslint .`
3. `npm test` (avec `MOCK_AI=1`)

Le workflow échoue si l'une de ces étapes échoue.

## Nouvelles fonctionnalités (Tâche 9)

### Page de garde
- **Bannière "ruban" refaite** : tableau 3 cellules (12% / 76% / 12%), teintes claires (25% blanc) sur les côtés, couleur d'accent au centre. Texte blanc ou noir selon contraste WCAG AA (4.5:1). Sans canvas ni images.
- **Aucune bordure visible** : tous les tableaux de la page de garde ont les 6 bordures (table + cellules) à `none`.
- **Autres styles inchangés** : bandeau, encadré, double cadre, lignes.

### Sommaire (TOC)
- **Mode "Simple" (défaut)** : liste de paragraphes avec signets (`BookmarkStart`/`BookmarkEnd`) et liens internes (`InternalHyperlink`). Pas de numéros de page inventés. Sous-parties décalées.
- **Mode "Automatique"** : champ `TableOfContents` natif avec `features.updateFields`.
- **Choix dans l'UI (étape 3)** : sélecteur "Sommaire : Simple / Automatique". Aide contextuelle pour le mode auto.

### Sauts de page
- **Introduction** : nouvelle page après le sommaire.
- **Conclusion** : nouvelle page.
- **Sources** : nouvelle page.
- **Option "Chaque grande partie sur nouvelle page"** (décochee par défaut) : chaque partie niveau 1 (sauf introduction) commence sur nouvelle page via `pageBreakBefore`.
- Pas de page vide créée.

### Parité aperçu / Word
- Test `tests/cover-parity.test.js` : pour chaque modèle (20) et bannière (5), l'aperçu JS et le Word généré contiennent les mêmes textes (après normalisation).
- Modèle "Palmiers" (stage) : le nom saisi apparaît bien sous "Rédigé par".

### Accessibilité
- Boîtes de dialogue (`showMessage`, `askConfirm`) : `role="dialog"`, `aria-modal`, focus trap, Échap annule, focus restitué.
- 15 `alert()`/`confirm()` remplacés.
- Contraste WCAG AA pour `--muted` (#4A5A56).
- Boutons/champs ≥ 44px sur mobile (`@media (pointer:coarse)`).

### Modules purs (UMD/Node)
- `js/utils.js` : 14 fonctions (`esc`, `words`, `roman`, `labels`, `slug`, `parseCustom`, `fmtCite`, `todayFr`, `isSafeUrl`, `fetchWithTimeout`, `makeDebouncedSave`, `NONUM`, `nid`, `sec`).
- `js/cover-data.js` : `officialCover(profile, cover, mode)`, `cat(profile)`, `members(profile)`, `NONUM`.
- `js/storage.js` : `schemaVersion=6`, migrations v1→v6, `saveState` booléen, quotas, logos/figures/pending.
- `js/export-docx.js` : `buildDocument(docxLib, project, assets)` pur, sans DOM/localStorage/state/M().
- `js/dialogs.js` : `showMessage(texte, type)`, `askConfirm(texte, {oui, non})` → Promise<boolean>.

### Stockage
- `schemaVersion=6`, migrations v1→v6 (notes/text, cover, sources, tocMode, partPageBreak).
- `saveState` renvoie booléen ; message "Échec de sauvegarde : espace plein" en rouge si échec.

### Tests
- 92 tests passent (5 ignorés), ESLint clean.
- CI GitHub Actions : Node 22, `npm ci`, `npx eslint .`, `npm test` (`MOCK_AI=1`).