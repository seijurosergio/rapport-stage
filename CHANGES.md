# CHANGES

## 2026-11-08 - Tâche 9 : Page de garde, sommaire, pages (bloc unique)

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
- `js/storage.js` : `schemaVersion=6`, migrations v1→v6 (notes/text, cover, sources, tocMode, partPageBreak), `saveState` booléen, quotas, logos/figures/pending.
- `js/export-docx.js` : `buildDocument(docxLib, project, assets)` pur, sans DOM/localStorage/state/M().
- `js/dialogs.js` : `showMessage(texte, type)`, `askConfirm(texte, {oui, non})` → Promise<boolean>.

### Stockage
- `schemaVersion=6`, migrations v1→v6 (notes/text, cover, sources, tocMode, partPageBreak).
- `saveState` renvoie booléen ; message "Échec de sauvegarde : espace plein" en rouge si échec.

### Tests
- 92 tests passent (5 ignorés), ESLint clean.
- CI GitHub Actions : Node 22, `npm ci`, `npx eslint .`, `npm test` (`MOCK_AI=1`).

---

## 2026-11-07 - Tâche 8 : Export Word corrigé

- `buildDocument` utilise `project.modeInfo` (pas de fonction `M()`)
- `officialCover` reçoit `mode` en paramètre
- `app.js` utilise `window.AppCoverData.officialCover`
- `vendor/docx.iife.js` restauré (git checkout)
- `tests/export.test.js` : projet de test sans fonction `M`
- `tests/e2e-export.test.js` créé (ignoré, nécessite navigateur réel)
- `window.doDownload` et `window.AppExport` non exposés
- `vendor/docx.iife.js` avec export global `window.docx = docx`
- ESLint clean, 64 tests passent

---

## 2026-11-07 - Tâche 7 : Dialogs, Focus, Contraste

- `js/dialogs.js` : `showMessage` (toast, role=status, 6s), `askConfirm` (Promise, focus trap, Échap, focus restitué)
- 15 `alert()`/`confirm()` remplacés par async/await
- `style.css` : `--muted` → `#4A5A56` (WCAG AA ≥ 4.5), styles dialogs, `@media (pointer:coarse)` min-height 44px
- `tests/dialogs.test.js` : 7 tests (toast, confirm, focus, Échap)
- 64 tests passent, ESLint clean

---

## 2026-11-07 - Tâche 6 : Stockage localStorage

- `js/storage.js` (UMD) : `schemaVersion=6`, migrations v1→v6, `saveState` booléen, quotas, logos/figures/pending
- `app.js` utilise `window.AppStorage`
- `tests/storage.test.js` : 10 tests (migrations, quota, logos, figures, pending)
- ESLint clean, 57 tests passent

---

## 2026-11-07 - Tâche 5 : Modules purs

- `js/utils.js` : 14 fonctions exportées (UMD/Node)
- `js/cover-data.js` : `officialCover(profile, cover, mode)`, `cat(profile)`, `members(profile)`, `NONUM`
- `js/export-docx.js` : `buildDocument(docxLib, project, assets)` pur
- `js/utils.js` : `makeDebouncedSave` pour sauvegarde différée
- `index.html` charge dans l'ordre : `utils.js` → `cover-data.js` → `storage.js` → `dialogs.js` → `export-docx.js`
- `app.js` utilise `window.AppUtils`, `window.AppCoverData`, `window.AppStorage`, `window.AppDialogs`, `window.AppExport`
- `tests/utils.test.js` (19 tests), `tests/export.test.js` (6 tests), `tests/ui.test.js` (6 tests)
- 47 tests passent, ESLint clean

---

## 2026-11-07 - Tâche 4 : Garde-fous automatiques

- `.github/workflows/ci.yml` : Node 22, `npm ci`, `npx eslint .`, `npm test` (MOCK_AI=1)
- `dev-server.js` : bloque fichiers cachés, `package*.json`, `eslint.config.js`, `dev-server.js`, `README.md`, `CHANGES.md`, dossiers `supabase/`, `.github/`
- `tests/dev-server.test.js` : 5 tests HTTP (200, 403/404)
- `README.md` : doc complète (dev, lint, test, structure, CI/CD)
- 46 tests passent, ESLint clean

---

## 2026-11-06 - Tâche 3 : Export Word corrigé

- `buildDocument` utilise `project.modeInfo.docTitle` (pas `project.M().docTitle`)
- `buildOfficialCover` reçoit `mode` en paramètre
- `doDownload` : try/catch, message d'erreur "Le fichier Word n'a pas pu être créé"
- Sommaire : `TableOfContents` avec `features.updateFields`
- `tblNoBorders` déclaré au début de `buildOfficialCover`, utilisé partout
- `vercel.json` : CSP sans `'unsafe-inline'` dans `script-src`
- `eslint.config.js` : configs séparées browser/Node, ignore `vendor/**` `node_modules/**`, `no-undef`, `no-use-before-define`
- 21 tests passent, ESLint clean

---

## 2026-11-06 - Tâche 3bis : Garde-fous

- `.github/workflows/ci.yml` : CI GitHub Actions
- `dev-server.js` : sécurité renforcée
- `tests/dev-server.test.js` : tests sécurité
- `README.md` : documentation complète
- 26 tests passent, ESLint clean

---

## 2026-11-06 - Tâche 5 : Modules purs (extraction)

- `js/utils.js` : 14 fonctions (UMD)
- `index.html` charge `utils.js` avant `app.js`
- `app.js` utilise `window.AppUtils`
- `tests/utils.test.js` : 19 tests
- 21 tests passent, ESLint clean

---

## 2026-11-06 - Tâche 4 : Sécurité, Performance, Corrections Word

- `vercel.json` : headers sécurité + CSP
- `docx` local (vendor), CSP mis à jour
- `isSafeUrl` : rejette `javascript:` et `data:`
- `save` renvoie booléen, debounce 400ms, `flushSave` immédiat
- `fetchWithTimeout` 60s + AbortController
- Tests jsdom pour points 3-5
- `buildOfficialCover` : bordures NONE sur tableau + cellules (6 bordures)
- `buildDoc` : `TableOfContents` avec `features.updateFields`, Heading1/Heading2 centrés
- 16 tests passent, ESLint clean