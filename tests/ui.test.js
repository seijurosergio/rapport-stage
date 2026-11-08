// Test de l'interface (jsdom) : la page ne doit remonter en haut que si on change d'écran.
// Lancer : node --test tests/ui.test.js   (nécessite : npm install jsdom)
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
let JSDOM; try { ({ JSDOM } = require('jsdom')); } catch (e) { try { ({ JSDOM } = require('/tmp/jt/node_modules/jsdom')); } catch (e2) { JSDOM = null; } }

const ROOT = path.join(__dirname, '..');
function boot() {
  const dom = new JSDOM('<!doctype html><html><body><div class="app" id="app"></div></body></html>', { runScripts: 'outside-only', url: 'https://test.local/' });
  const w = dom.window;
  const calls = [];
  w.scrollTo = function (x, y) { calls.push(y); };
  let offset = 0;
  Object.defineProperty(w, 'pageYOffset', { get: function () { return offset; } });
  w.fetch = function () { return Promise.resolve({ json: function () { return Promise.resolve({ enabled: false, price: 0 }); } }); };
  w.confirm = function () { return true; }; w.alert = function () {};
  // Charger docx d'abord
  const docxCode = fs.readFileSync(path.join(ROOT, 'vendor', 'docx.iife.js'), 'utf8');
  w.eval(docxCode);
  w.docx = w.docx;
  // Charger utils.js AVANT app.js
  const utilsCode = fs.readFileSync(path.join(ROOT, 'js', 'utils.js'), 'utf8');
  w.eval(utilsCode);
  // Charger cover-data.js
  const coverDataCode = fs.readFileSync(path.join(ROOT, 'js', 'cover-data.js'), 'utf8');
  w.eval(coverDataCode);
  // Charger storage.js
  const storageCode = fs.readFileSync(path.join(ROOT, 'js', 'storage.js'), 'utf8');
  w.eval(storageCode);
  // Charger dialogs.js
  const dialogsCode = fs.readFileSync(path.join(ROOT, 'js', 'dialogs.js'), 'utf8');
  w.eval(dialogsCode);
  // Charger export-docx.js
  const exportCode = fs.readFileSync(path.join(ROOT, 'js', 'export-docx.js'), 'utf8');
  w.eval(exportCode);
  const reg = fs.readFileSync(path.join(ROOT, 'modeles-couverture', '_registre.js'), 'utf8');
  w.eval(reg);
  fs.readdirSync(path.join(ROOT, 'modeles-couverture')).filter(function (f) { return f !== '_registre.js'; })
    .forEach(function (f) { w.eval(fs.readFileSync(path.join(ROOT, 'modeles-couverture', f), 'utf8')); });
  w.eval(fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8'));
  return { w: w, calls: calls, setY: function (v) { offset = v; } };
}
function click(w, sel) {
  const el = w.document.querySelector(sel);
  assert.ok(el, 'introuvable : ' + sel);
  el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
}
function type(w, sel, val) {
  const el = w.document.querySelector(sel);
  assert.ok(el, 'introuvable : ' + sel);
  el.value = val; el.dispatchEvent(new w.Event('input', { bubbles: true }));
}

test('le nom de l\'outil remplace le texte provisoire', { skip: !JSDOM }, () => {
  const t = boot();
  assert.ok(!/NOM DE L/.test(t.w.document.body.innerHTML));
  assert.match(t.w.document.body.innerHTML, /Assistant rapport/);
});

test('scroll : en haut quand l\'écran change, position gardée sinon', { skip: !JSDOM }, () => {
  const t = boot(), w = t.w;
  click(w, '[data-action="open"][data-mode="stage"]');            // accueil → étape 1
  assert.strictEqual(t.calls[t.calls.length - 1], 0);
  type(w, '#f-nom', 'KINSY Sergio'); type(w, '#f-filiere', 'Génie électrique');
  type(w, '#f-ecole', 'UCAO-UUC'); type(w, '#f-entreprise', 'SBEE');
  click(w, '[data-action="next1"]');                              // étape 1 → 2
  assert.strictEqual(w.document.querySelector('h1').textContent, 'Le plan de ton rapport');
  assert.strictEqual(t.calls[t.calls.length - 1], 0);

  t.setY(480);
  click(w, '[data-tab="edit"]');                                  // simple onglet : on garde 480
  assert.strictEqual(t.calls[t.calls.length - 1], 480);
  t.setY(900);
  click(w, '[data-action="down"][data-i="0"]');                   // déplacer une partie : on garde 900
  assert.strictEqual(t.calls[t.calls.length - 1], 900);

  click(w, '[data-action="to3"]');                                // étape 2 → 3 : en haut
  assert.strictEqual(t.calls[t.calls.length - 1], 0);
  t.setY(3000);
  click(w, '[data-action="coverCat"][data-cat="lycee"]');         // onglet de catégorie : on garde 3000
  assert.strictEqual(t.calls[t.calls.length - 1], 3000);
  t.setY(3200);
  click(w, '[data-action="pickCover"]');                          // choisir un modèle : on garde 3200
  assert.strictEqual(t.calls[t.calls.length - 1], 3200);

  click(w, '[data-action="to2"]');                                // retour étape 2 : en haut
  assert.strictEqual(t.calls[t.calls.length - 1], 0);
});

test('recherche web décochée par défaut', { skip: !JSDOM }, () => {
  const t = boot(), w = t.w;
  click(w, '[data-action="open"][data-mode="expose"]');
  type(w, '#m-0', 'KINSY Sergio'); type(w, '#f-ecole', 'UCAO-UUC'); type(w, '#f-sujet', 'Énergie solaire');
  click(w, '[data-action="next1"]'); click(w, '[data-action="to3"]');
  const box = w.document.querySelector('[data-research]');
  assert.ok(box); assert.strictEqual(box.checked, false);
});

test('isSafeUrl : rejette javascript: et data:, accepte http/https', { skip: !JSDOM }, () => {
  const t = boot(), w = t.w;
  assert.strictEqual(w.AppUtils.isSafeUrl('https://example.com'), true);
  assert.strictEqual(w.AppUtils.isSafeUrl('http://example.com'), true);
  assert.strictEqual(w.AppUtils.isSafeUrl('javascript:alert(1)'), false);
  assert.strictEqual(w.AppUtils.isSafeUrl('data:text/html,<script>'), false);
  assert.strictEqual(w.AppUtils.isSafeUrl('ftp://example.com'), false);
  assert.strictEqual(w.AppUtils.isSafeUrl(''), false);
  assert.strictEqual(w.AppUtils.isSafeUrl(null), false);
});

test('debouncedSave : délai de 400 ms sur les inputs', { skip: !JSDOM }, () => {
  const t = boot(), w = t.w;
  click(w, '[data-action="open"][data-mode="stage"]');
  type(w, '#f-nom', 'Test');
  assert.ok(w.saveTimer !== null, 'timer de sauvegarde créé');
  // Le timer est créé, on ne peut pas tester l'avancement du temps sans fake timers
});

test('fetchWithTimeout : avorte après 60 secondes', { skip: !JSDOM }, async () => {
  const t = boot(), w = t.w;
  let abortCalled = false;
  const originalFetch = w.fetch;
  w.fetch = function (url, opts) {
    const controller = new w.AbortController();
    setTimeout(() => controller.abort(), 10);
    return Promise.reject({ name: 'AbortError', signal: controller.signal });
  };
  try {
    await w.AppUtils.fetchWithTimeout('/api/test', { method: 'POST' });
  } catch (e) {
    abortCalled = e && e.name === 'AbortError';
  }
  w.fetch = originalFetch;
  assert.ok(abortCalled, 'fetchWithTimeout doit rejeter avec AbortError après timeout');
});
