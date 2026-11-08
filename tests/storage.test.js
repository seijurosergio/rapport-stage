// Tests pour js/storage.js
// Lancer : node --test tests/storage.test.js
const test = require('node:test');
const assert = require('node:assert');

// Faux localStorage pour les tests
const fakeLocalStorage = (() => {
  const store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
})();

// polyfill btoa et toB64 pour Node
global.btoa = (s) => Buffer.from(s, 'binary').toString('base64');

// Charger le module storage avec le faux localStorage
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const storageCode = fs.readFileSync(path.join(ROOT, 'js', 'storage.js'), 'utf8');

// Remplacer toB64 par une version compatible Node dans le code avant évaluation
const storageCodePatched = storageCode.replace(
  /function toB64\(u8\) \{[\s\S]*?return btoa\(s\);\s*\}/,
  `function toB64(u8) { return Buffer.from(u8).toString('base64'); }`
);

const ctx = { localStorage: fakeLocalStorage, module: { exports: {} }, window: {}, Buffer: Buffer, btoa: global.btoa };
vm.runInNewContext(storageCodePatched, ctx);
const Storage = ctx.module.exports;

test('saveState renvoie true et stocke les données', () => {
  fakeLocalStorage.clear();
  const state = { mode: 'stage', profile: { nom: 'Test' }, sections: [], cover: {}, sources: [], citeStyle: 'apa', research: false, paid: null };
  assert.strictEqual(Storage.saveState(state), true);
  const raw = fakeLocalStorage.getItem('rapport-stage-v1');
  assert.ok(raw);
  const parsed = JSON.parse(raw);
  assert.strictEqual(parsed.schemaVersion, 6);
  assert.strictEqual(parsed.profile.nom, 'Test');
});

test('loadState migre l\'ancien format (notes/text)', () => {
  fakeLocalStorage.clear();
  const oldState = { schemaVersion: 1, mode: 'stage', profile: { nom: 'Test', email: '', sujet: '', matiere: '', enseignant: '', departement: '', numTheme: '', numGroupe: '', niveau: '', pages: '', titreRapport: '', membres: [] }, sections: [{ id: 's1', text: 'ancien texte', notes: undefined }], cover: { model: 'officiel', color: '#0F6B5B', header: 'test', banner: 'ruban', template: '', etiquettes: false }, sources: [], citeStyle: 'apa', research: true, paid: null };
  fakeLocalStorage.setItem('rapport-stage-v1', JSON.stringify(oldState));
  const loaded = Storage.loadState();
  assert.ok(loaded);
  assert.strictEqual(loaded.schemaVersion, 6);
  assert.strictEqual(loaded.sections[0].notes, 'ancien texte');
  assert.strictEqual(loaded.sections[0].text, '');
});

test('loadState migre cover par défaut si invalide', () => {
  fakeLocalStorage.clear();
  const badCover = { mode: 'stage', profile: { nom: 'Test' }, sections: [], cover: { model: 'inconnu', color: 'rouge' }, sources: [], citeStyle: 'apa' };
  fakeLocalStorage.setItem('rapport-stage-v1', JSON.stringify(badCover));
  const loaded = Storage.loadState();
  assert.ok(loaded);
  assert.strictEqual(loaded.cover.model, 'officiel');
  assert.strictEqual(loaded.cover.color, '#0F6B5B');
  assert.ok(loaded.cover.header.includes('RÉPUBLIQUE DU BÉNIN'));
});

test('loadState ignore les données corrompues (JSON invalide)', () => {
  fakeLocalStorage.clear();
  fakeLocalStorage.setItem('rapport-stage-v1', '{ pas du json valide');
  const loaded = Storage.loadState();
  assert.strictEqual(loaded, null);
});

test('loadState migre même une structure incomplète', () => {
  fakeLocalStorage.clear();
  fakeLocalStorage.setItem('rapport-stage-v1', JSON.stringify({ profile: { nom: 'Test', email: '' }, sections: [], cover: { model: 'officiel', color: '#0F6B5B' }, sources: [], citeStyle: 'apa', mode: 'stage' }));
  const loaded = Storage.loadState();
  assert.ok(loaded);
  assert.strictEqual(loaded.schemaVersion, 6);
  assert.strictEqual(loaded.profile.nom, 'Test');
});

test('saveState renvoie false si quota dépassé (simulation)', () => {
  fakeLocalStorage.clear();
  // Simuler un quota dépassé en remplaçant setItem
  const originalSet = fakeLocalStorage.setItem;
  fakeLocalStorage.setItem = () => { throw new Error('QuotaExceededError'); };
  const result = Storage.saveState({ mode: 'stage', profile: {}, sections: [], cover: {}, sources: [], citeStyle: 'apa' });
  assert.strictEqual(result, false);
  fakeLocalStorage.setItem = originalSet;
});

test('saveLogos et loadLogos conservent la structure des logos', () => {
  fakeLocalStorage.clear();
  const logos = { ecole: { data: new Uint8Array([1,2,3]), w: 100, h: 50 }, entreprise: null };
  assert.strictEqual(Storage.saveLogos(logos), true);
  const loaded = Storage.loadLogos();
  assert.ok(loaded.ecole);
  assert.strictEqual(loaded.ecole.w, 100);
  assert.strictEqual(loaded.ecole.h, 50);
  assert.strictEqual(loaded.entreprise, null);
});

test('saveFigsData et loadFigsData conservent les figures', () => {
  fakeLocalStorage.clear();
  const figs = { 's1': [{ id: 'f1', d: 'base64data', w: 400, h: 300, cap: 'Test' }] };
  assert.strictEqual(Storage.saveFigsData(figs), true);
  const loaded = Storage.loadFigsData();
  assert.ok(loaded.s1);
  assert.strictEqual(loaded.s1[0].id, 'f1');
  assert.strictEqual(loaded.s1[0].cap, 'Test');
});

test('savePending, loadPending, clearPendingData gèrent le paiement en attente', () => {
  fakeLocalStorage.clear();
  const pending = { id: '123456', nonce: 'abcdef123456' };
  assert.strictEqual(Storage.savePending(pending), true);
  const loaded = Storage.loadPending();
  assert.strictEqual(loaded.id, '123456');
  assert.strictEqual(loaded.nonce, 'abcdef123456');
  assert.strictEqual(Storage.clearPendingData(), true);
  assert.strictEqual(Storage.loadPending(), null);
});

test('SCHEMA_VERSION est à 6', () => {
  assert.strictEqual(Storage.SCHEMA_VERSION, 6);
});