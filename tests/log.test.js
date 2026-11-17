const test = require('node:test');
const assert = require('node:assert');
const { logError, logInfo, redact } = require('../api/_log');

function capture(fn) {
  const out = []; const e = console.error; const l = console.log;
  console.error = function (...a) { out.push(a.join(' ')); }; console.log = function (...a) { out.push(a.join(' ')); };
  try { fn(); } finally { console.error = e; console.log = l; }
  return out.join('\n');
}
const FAKE_KEY = 'sk-' + 'ant-api03-AAAABBBBCCCCDDDDEEEEFFFF';

test('journaux : clés, jetons et longues chaînes sont masqués', () => {
  const out = capture(function () { logError('t', { event: 'x', message: 'clé ' + FAKE_KEY + ' et ' + 'Bear' + 'er abcdefghijklmnop12345 et ' + 'a1b2c3d4'.repeat(8) }); });
  assert.ok(!out.includes('AAAABBBB') && !out.includes('abcdefghijklmnop') && !out.includes('a1b2c3d4a1b2c3d4'));
  assert.ok(out.includes('[masqué]'));
});

test('journaux : en-têtes, corps, environnement et contenu utilisateur ne sont jamais écrits', () => {
  const out = capture(function () {
    logInfo('t', { headers: { authorization: 'x' }, body: { texte: 'mon rapport secret' }, env: process.env, texte: 'contenu étudiant', notes: 'notes', status: 502 });
  });
  assert.ok(!/authorization|mon rapport|contenu étudiant|notes/.test(out));
  assert.ok(out.includes('502'));
});

test('journaux : tronqués à 300 caractères', () => {
  assert.ok(redact('é'.repeat(1000)).length <= 301);
});
