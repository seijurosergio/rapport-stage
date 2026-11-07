// Tests pour js/dialogs.js
// Lancer : node --test tests/dialogs.test.js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
let JSDOM; try { ({ JSDOM } = require('jsdom')); } catch (e) { try { ({ JSDOM } = require('/tmp/jt/node_modules/jsdom')); } catch (e2) { JSDOM = null; } }

const ROOT = path.join(__dirname, '..');

function boot() {
  const dom = new JSDOM('<!doctype html><html><body><div class="app" id="app"></div></body></html>', { runScripts: 'outside-only', url: 'https://test.local/' });
  const w = dom.window;
  // Polyfill requestAnimationFrame pour JSDOM
  w.requestAnimationFrame = function (cb) { return setTimeout(cb, 0); };
  w.cancelAnimationFrame = function (id) { clearTimeout(id); };
  w.scrollTo = function () {};
  Object.defineProperty(w, 'pageYOffset', { get: function () { return 0; } });
  w.fetch = function () { return Promise.resolve({ json: function () { return Promise.resolve({ enabled: false, price: 0 }); } }); };
  w.confirm = function () { return true; }; w.alert = function () {};
  // Charger utils.js
  const utilsCode = fs.readFileSync(path.join(ROOT, 'js', 'utils.js'), 'utf8');
  w.eval(utilsCode);
  // Charger dialogs.js
  const dialogsCode = fs.readFileSync(path.join(ROOT, 'js', 'dialogs.js'), 'utf8');
  w.eval(dialogsCode);
  return w;
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

test('showMessage crée un toast avec role=status', { skip: !JSDOM }, () => {
  const w = boot();
  const dlg = w.AppDialogs.showMessage('Test message', 'info');
  const toast = w.document.querySelector('.dlg-toast');
  assert.ok(toast, 'Toast créé');
  assert.strictEqual(toast.getAttribute('role'), 'status');
  assert.strictEqual(toast.getAttribute('aria-live'), 'polite');
  assert.strictEqual(toast.textContent, 'Test message');
  assert.ok(toast.classList.contains('dlg-toast-info'));
  dlg.close();
});

test('showMessage avec type warn', { skip: !JSDOM }, () => {
  const w = boot();
  const dlg = w.AppDialogs.showMessage('Warning!', 'warn');
  const toast = w.document.querySelector('.dlg-toast');
  assert.ok(toast.classList.contains('dlg-toast-warn'));
  dlg.close();
});

test('showMessage avec type error', { skip: !JSDOM }, () => {
  const w = boot();
  const dlg = w.AppDialogs.showMessage('Error!', 'error');
  const toast = w.document.querySelector('.dlg-toast');
  assert.ok(toast.classList.contains('dlg-toast-error'));
  dlg.close();
});

// Tests asynchrones pour askConfirm - simplifiés car transitionend ne marche pas dans JSDOM
test('askConfirm crée une boîte modale avec les bons attributs', { skip: !JSDOM }, async () => {
  const w = boot();
  // Appeler askConfirm mais ne pas attendre la promesse
  const promise = w.AppDialogs.askConfirm('Confirmer ?', { oui: 'Oui', non: 'Non' });
  await wait(100);
  const dlg = w.document.querySelector('.dlg-confirm');
  assert.ok(dlg, 'Boîte de confirmation créée');
  assert.strictEqual(dlg.getAttribute('role'), 'dialog');
  assert.strictEqual(dlg.getAttribute('aria-modal'), 'true');
  assert.strictEqual(dlg.getAttribute('aria-labelledby'), 'dlg-title');
  const title = w.document.getElementById('dlg-title');
  assert.strictEqual(title.textContent, 'Confirmer ?');
  // Nettoyer manuellement car pas de transitionend
  const overlay = w.document.querySelector('.dlg-overlay');
  if (dlg) dlg.remove();
  if (overlay) overlay.remove();
});

test('askConfirm a les bons boutons', { skip: !JSDOM }, async () => {
  const w = boot();
  const promise = w.AppDialogs.askConfirm('Confirmer ?', { oui: 'Oui', non: 'Non' });
  await wait(100);
  const dlg = w.document.querySelector('.dlg-confirm');
  const btnOk = dlg.querySelector('.dlg-btn-ok');
  const btnCancel = dlg.querySelector('.dlg-btn-cancel');
  assert.ok(btnOk, 'Bouton Oui présent');
  assert.ok(btnCancel, 'Bouton Non présent');
  assert.strictEqual(btnOk.textContent, 'Oui');
  assert.strictEqual(btnCancel.textContent, 'Non');
  // Nettoyer
  if (dlg) dlg.remove();
  const overlay = w.document.querySelector('.dlg-overlay');
  if (overlay) overlay.remove();
});

test('focus initial sur bouton Oui', { skip: !JSDOM }, async () => {
  const w = boot();
  const promise = w.AppDialogs.askConfirm('Confirmer ?');
  await wait(100);
  const btnOk = w.document.querySelector('.dlg-btn-ok');
  // Le focus devrait être sur le bouton Oui
  assert.strictEqual(w.document.activeElement, btnOk);
  // Nettoyer
  const dlg = w.document.querySelector('.dlg-confirm');
  if (dlg) dlg.remove();
  const overlay = w.document.querySelector('.dlg-overlay');
  if (overlay) overlay.remove();
});

test('Échap annule la boîte', { skip: !JSDOM }, async () => {
  const w = boot();
  const promise = w.AppDialogs.askConfirm('Confirmer ?');
  await wait(100);
  const escEvent = new w.KeyboardEvent('keydown', { key: 'Escape' });
  w.document.dispatchEvent(escEvent);
  await wait(50);
  const dlg = w.document.querySelector('.dlg-confirm');
  assert.strictEqual(dlg, null, 'Boîte fermée après Échap');
});