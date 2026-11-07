// Tests pour js/utils.js
// Lancer : node --test tests/utils.test.js
const test = require('node:test');
const assert = require('node:assert');
const utils = require('../js/utils.js');

test('esc : échappe les caractères HTML', () => {
  assert.strictEqual(utils.esc(''), '');
  assert.strictEqual(utils.esc(null), '');
  assert.strictEqual(utils.esc(undefined), '');
  assert.strictEqual(utils.esc('a&b'), 'a&b');
  assert.strictEqual(utils.esc('a<b'), 'a<b');
  assert.strictEqual(utils.esc('a>b'), 'a>b');
  assert.strictEqual(utils.esc('"quote"'), '"quote"');
  assert.strictEqual(utils.esc("'quote'"), "'quote'");
  assert.strictEqual(utils.esc('<script>alert(1)</script>'), '<script>alert(1)</script>');
});

test('words : compte les mots', () => {
  assert.strictEqual(utils.words(''), 0);
  assert.strictEqual(utils.words('   '), 0);
  assert.strictEqual(utils.words('un'), 1);
  assert.strictEqual(utils.words('un deux'), 2);
  assert.strictEqual(utils.words('  un   deux  trois  '), 3);
  assert.strictEqual(utils.words('un\ndeux\ttrois'), 3);
});

test('roman : convertit en chiffres romains', () => {
  assert.strictEqual(utils.roman(1), 'I');
  assert.strictEqual(utils.roman(2), 'II');
  assert.strictEqual(utils.roman(3), 'III');
  assert.strictEqual(utils.roman(4), 'IV');
  assert.strictEqual(utils.roman(5), 'V');
  assert.strictEqual(utils.roman(6), 'VI');
  assert.strictEqual(utils.roman(9), 'IX');
  assert.strictEqual(utils.roman(10), 'X');
  assert.strictEqual(utils.roman(11), 'XI');
  assert.strictEqual(utils.roman(14), 'XIV');
  assert.strictEqual(utils.roman(19), 'XIX');
  assert.strictEqual(utils.roman(20), 'XX');
});

test('labels : génère les numéros de sections', () => {
  const list = [
    { level: 1, title: 'Introduction', nonum: true },
    { level: 1, title: 'Partie 1', nonum: false },
    { level: 2, title: 'Sous-partie 1', nonum: false },
    { level: 2, title: 'Sous-partie 2', nonum: false },
    { level: 1, title: 'Partie 2', nonum: false },
    { level: 2, title: 'Sous-partie 3', nonum: false },
  ];
  const result = utils.labels(list);
  assert.strictEqual(result[0], '');
  assert.strictEqual(result[1], 'I.');
  assert.strictEqual(result[2], '1.');
  assert.strictEqual(result[3], '2.');
  assert.strictEqual(result[4], 'II.');
  assert.strictEqual(result[5], '1.');
});

test('slug : génère un slug valide', () => {
  assert.strictEqual(utils.slug(''), 'rapport');
  assert.strictEqual(utils.slug('Test'), 'test');
  assert.strictEqual(utils.slug('Mon Rapport'), 'mon-rapport');
  assert.strictEqual(utils.slug('École Supérieure'), 'ecole-superieure');
  assert.strictEqual(utils.slug('Test 123 !@#'), 'test-123');
  assert.strictEqual(utils.slug('---test---'), 'test');
});

test('parseCustom : parse un plan personnalisé', () => {
  const txt = "Introduction\n1. Première partie\n  1.1 Sous-partie\n2. Deuxième partie\nConclusion";
  const result = utils.parseCustom(txt);
  assert.strictEqual(result.length, 5);
  assert.strictEqual(result[0].title, 'Introduction');
  assert.strictEqual(result[0].level, 1);
  assert.strictEqual(result[0].nonum, true);
  assert.strictEqual(result[1].title, 'Première partie');
  assert.strictEqual(result[1].level, 1);
  assert.strictEqual(result[2].title, 'Sous-partie');
  assert.strictEqual(result[2].level, 2);
  assert.strictEqual(result[3].title, 'Deuxième partie');
  assert.strictEqual(result[3].level, 1);
  assert.strictEqual(result[4].title, 'Conclusion');
  assert.strictEqual(result[4].level, 1);
  assert.strictEqual(result[4].nonum, true);
  assert.ok(result[0].guide);
  assert.ok(result[1].guide);
});

test('parseCustom : tirets et puces', () => {
  const txt = "- Première\n- Deuxième\n  * Sous-point";
  const result = utils.parseCustom(txt);
  assert.strictEqual(result.length, 3);
  assert.strictEqual(result[0].level, 1);
  assert.strictEqual(result[1].level, 1);
  assert.strictEqual(result[2].level, 2);
});

test('parseCustom : chiffres romains', () => {
  const txt = "I. Partie une\nII. Partie deux";
  const result = utils.parseCustom(txt);
  assert.strictEqual(result.length, 2);
  assert.strictEqual(result[0].level, 1);
  assert.strictEqual(result[1].level, 1);
});

test('fmtCite : style APA', () => {
  const it = { auteur: 'DUPONT, Marie', titre: 'Le test', annee: '2024', editeur: 'Éditions Test', url: 'https://test.fr', type: 'web', consulte: '01/01/2024' };
  const res = utils.fmtCite(it, 'apa');
  assert.ok(res.includes('DUPONT, Marie'));
  assert.ok(res.includes('Le test'));
  assert.ok(res.includes('2024'));
  assert.ok(res.includes('Éditions Test'));
  assert.ok(res.includes('https://test.fr'));
  assert.ok(res.includes('consulté le'));
});

test('fmtCite : style MLA', () => {
  const it = { auteur: 'DUPONT, Marie', titre: 'Le test', annee: '2024', editeur: 'Éditions Test', url: 'https://test.fr', type: 'web', consulte: '01/01/2024' };
  const res = utils.fmtCite(it, 'mla');
  assert.ok(res.includes('DUPONT, Marie'));
  assert.ok(res.includes('Le test'));
  assert.ok(res.includes('Éditions Test'));
  assert.ok(res.includes('2024'));
  assert.ok(res.includes('https://test.fr'));
});

test('fmtCite : style Harvard', () => {
  const it = { auteur: 'DUPONT, Marie', titre: 'Le test', annee: '2024', editeur: 'Éditions Test', url: 'https://test.fr', type: 'web', consulte: '01/01/2024' };
  const res = utils.fmtCite(it, 'harvard');
  assert.ok(res.includes('DUPONT, Marie'));
  assert.ok(res.includes('2024'));
  assert.ok(res.includes('Le test'));
  assert.ok(res.includes('Éditions Test'));
  assert.ok(res.includes('Disponible à :'));
});

test('fmtCite : style Simple', () => {
  const it = { auteur: 'DUPONT, Marie', titre: 'Le test', annee: '2024', editeur: 'Éditions Test', url: 'https://test.fr', type: 'web', consulte: '01/01/2024' };
  const res = utils.fmtCite(it, 'simple');
  assert.ok(res.includes('DUPONT, Marie'));
  assert.ok(res.includes('Le test'));
  assert.ok(res.includes('Éditions Test'));
  assert.ok(res.includes('2024'));
  assert.ok(res.includes('https://test.fr'));
});

test('fmtCite : sans auteur', () => {
  const it = { auteur: '', titre: 'Le test', annee: '2024', editeur: 'Éditions Test', url: 'https://test.fr', type: 'web', consulte: '01/01/2024' };
  const res = utils.fmtCite(it, 'apa');
  assert.ok(res.includes('Le test'));
  assert.ok(res.includes('2024'));
});

test('todayFr : format de date français', () => {
  const d = utils.todayFr();
  assert.ok(typeof d === 'string');
  assert.ok(d.length > 0);
});

test('isSafeUrl : accepte http et https', () => {
  assert.strictEqual(utils.isSafeUrl('https://example.com'), true);
  assert.strictEqual(utils.isSafeUrl('http://example.com'), true);
  assert.strictEqual(utils.isSafeUrl('HTTPS://EXAMPLE.COM'), true);
  assert.strictEqual(utils.isSafeUrl('https://sub.example.com/path?query=1'), true);
});

test('isSafeUrl : rejette javascript: et data:', () => {
  assert.strictEqual(utils.isSafeUrl('javascript:alert(1)'), false);
  assert.strictEqual(utils.isSafeUrl('data:text/html,<script>'), false);
  assert.strictEqual(utils.isSafeUrl('ftp://example.com'), false);
  assert.strictEqual(utils.isSafeUrl('mailto:test@example.com'), false);
  assert.strictEqual(utils.isSafeUrl(''), false);
  assert.strictEqual(utils.isSafeUrl(null), false);
  assert.strictEqual(utils.isSafeUrl(undefined), false);
  assert.strictEqual(utils.isSafeUrl(123), false);
});

test('fetchWithTimeout : existe et est une fonction', () => {
  assert.ok(typeof utils.fetchWithTimeout === 'function');
});

test('makeDebouncedSave : crée un objet avec les bonnes méthodes', () => {
  const db = utils.makeDebouncedSave();
  assert.ok(typeof db.debouncedSave === 'function');
  assert.ok(typeof db.flushSave === 'function');
  assert.ok(typeof db.pending === 'function');
  assert.ok(typeof db.setSaveFn === 'function');
  assert.ok(typeof db.setStatusFn === 'function');
  assert.strictEqual(db.pending(), false);
});

test('makeDebouncedSave : debouncedSave et flushSave fonctionnent', async () => {
  const db = utils.makeDebouncedSave();
  let saveCalled = 0;
  let statusCalled = 0;
  db.setSaveFn(() => { saveCalled++; return true; });
  db.setStatusFn(() => { statusCalled++; });
  
  db.debouncedSave();
  assert.strictEqual(db.pending(), true);
  assert.strictEqual(saveCalled, 0);
  
  await new Promise(r => setTimeout(r, 50));
  assert.strictEqual(saveCalled, 0);
  
  db.flushSave();
  assert.strictEqual(db.pending(), false);
  assert.strictEqual(saveCalled, 1);
  assert.strictEqual(statusCalled, 1);
});

test('NONUM : regex pour détecter les sections sans numéro', () => {
  assert.ok(utils.NONUM.test('Introduction'));
  assert.ok(utils.NONUM.test('Conclusion'));
  assert.ok(utils.NONUM.test('Remerciements'));
  assert.ok(utils.NONUM.test('Résumé'));
  assert.ok(utils.NONUM.test('Sommaire'));
  assert.ok(utils.NONUM.test('Bibliographie'));
  assert.ok(utils.NONUM.test('Annexes'));
  assert.ok(utils.NONUM.test('Avant-propos'));
  assert.ok(utils.NONUM.test('Dédicace'));
  assert.ok(utils.NONUM.test('introduction'));
  assert.ok(utils.NONUM.test('conclusion'));
  assert.ok(!utils.NONUM.test('Chapitre 1'));
  assert.ok(!utils.NONUM.test('Partie principale'));
});
