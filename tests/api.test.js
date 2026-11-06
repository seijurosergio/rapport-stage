// Tests des fonctions /api, SANS aucun appel réel à Anthropic (fetch est remplacé par un faux).
// Lancer : node --test tests/        (API_DIR=chemin/vers/api pour tester une autre version)
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const API = process.env.API_DIR || path.join(__dirname, '..', 'api');
const develop = require(path.join(API, 'develop.js'));
const sources = require(path.join(API, 'sources.js'));
const angle = require(path.join(API, 'angle.js'));
const plans = require(path.join(API, 'plans.js'));

let n = 0;
function call(handler, body, method) {
  n += 1;
  const req = { method: method || 'POST', headers: { 'x-forwarded-for': '10.0.0.' + n }, body: body };
  return new Promise(function (resolve) {
    const res = { statusCode: 200, headers: {}, setHeader: function (k, v) { this.headers[k] = v; },
      end: function (txt) { resolve({ code: this.statusCode, json: JSON.parse(txt) }); } };
    Promise.resolve(handler(req, res)).catch(function (e) { resolve({ code: 500, json: { crash: String(e && e.stack) } }); });
  });
}

let fetchCalls = 0;
function fakeAnthropic(reply) {
  fetchCalls = 0;
  global.fetch = async function () {
    fetchCalls += 1;
    return { ok: true, status: 200, json: async function () { return typeof reply === 'function' ? reply(fetchCalls) : reply; } };
  };
}
// Découpe un texte en blocs comme le fait la recherche web (un bloc par passage cité).
function splitBlocks(str, parts) {
  const size = Math.ceil(str.length / parts), out = [];
  for (let i = 0; i < str.length; i += size) out.push({ type: 'text', text: str.slice(i, i + size), citations: [] });
  return out;
}
function setEnv(o) {
  ['MOCK_AI', 'MOCK_CASE', 'AI_ENABLED', 'ANTHROPIC_API_KEY'].forEach(function (k) { delete process.env[k]; });
  Object.keys(o || {}).forEach(function (k) { process.env[k] = o[k]; });
}

const TEXTE = "Le photovoltaïque transforme la lumière en électricité.\n\nUne cellule contient une jonction entre deux couches de silicium.";
const BASE = { titre: 'Les idées principales', mode: 'expose', sujet: 'Énergie solaire', recherche: true, notes: '', consigne: 'x', filiere: '', matiere: '' };

test('recherche web : texte découpé en blocs par les citations → texte propre', async () => {
  setEnv({ ANTHROPIC_API_KEY: 'faux' });
  const json = JSON.stringify({ texte: TEXTE, sources_utilisees: ['https://a.test/1'] });
  fakeAnthropic({ stop_reason: 'end_turn', model: 'm', usage: {}, content: [
    { type: 'web_search_tool_result', content: [{ type: 'web_search_result', url: 'https://a.test/1', title: 'Page A' }] }
  ].concat(splitBlocks(json, 6)) });
  const r = await call(develop, BASE);
  assert.strictEqual(r.code, 200, JSON.stringify(r.json));
  assert.strictEqual(r.json.status, 'ok');
  assert.strictEqual(r.json.texte, TEXTE);
  assert.ok(!/"texte"|```|\\n/.test(r.json.texte));
  assert.deepStrictEqual(r.json.sources.map(function (s) { return s.url; }), ['https://a.test/1']);
});

test('JSON coupé ou cassé : jamais renvoyé comme texte', async () => {
  setEnv({ ANTHROPIC_API_KEY: 'faux' });
  fakeAnthropic({ stop_reason: 'end_turn', content: [{ type: 'text', text: '```json\n{"texte":"Le message que je veux transmettre tient en trois idées. La premi' }] });
  const r = await call(develop, BASE);
  assert.notStrictEqual(r.json.status, 'ok', 'le JSON brut ne doit pas arriver dans le texte : ' + JSON.stringify(r.json).slice(0, 120));
  assert.strictEqual(r.code, 502);
});

test('réponse coupée par la limite de longueur → erreur claire', async () => {
  setEnv({ ANTHROPIC_API_KEY: 'faux' });
  fakeAnthropic({ stop_reason: 'max_tokens', content: [{ type: 'text', text: '{"texte":"début' }] });
  const r = await call(develop, BASE);
  assert.strictEqual(r.code, 502);
  assert.match(r.json.message, /coupé/);
});

test('texte simple sans JSON : accepté (repli sûr)', async () => {
  setEnv({ ANTHROPIC_API_KEY: 'faux' });
  fakeAnthropic({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'Un paragraphe propre, sans balises.' }] });
  const r = await call(develop, Object.assign({}, BASE, { recherche: false, notes: 'Quelques notes assez longues.' }));
  assert.strictEqual(r.json.status, 'ok');
  assert.strictEqual(r.json.texte, 'Un paragraphe propre, sans balises.');
});

test('questions renvoyées par le modèle', async () => {
  setEnv({ ANTHROPIC_API_KEY: 'faux' });
  fakeAnthropic({ stop_reason: 'end_turn', content: [{ type: 'text', text: '{"questions":["Quoi ?","Où ?"]}' }] });
  const r = await call(develop, Object.assign({}, BASE, { recherche: false, notes: 'Quelques notes assez longues.' }));
  assert.strictEqual(r.json.status, 'questions');
});

test('MOCK_AI=1 : aucune requête vers Anthropic, sur les 4 routes', async () => {
  setEnv({ MOCK_AI: '1' });
  fakeAnthropic(function () { throw new Error('appel réel interdit en simulation'); });
  const a = await call(develop, BASE);
  const b = await call(sources, { sujet: 'Énergie solaire' });
  const c = await call(angle, { mode: 'expose' });
  const d = await call(plans, { mode: 'expose', sujet: 'x' });
  assert.strictEqual(fetchCalls, 0);
  assert.strictEqual(a.json.status, 'ok'); assert.ok(a.json.sources.length >= 1);
  assert.strictEqual(b.json.status, 'ok'); assert.ok(b.json.sources.length >= 1);
  assert.strictEqual(c.json.status, 'questions'); assert.strictEqual(c.json.questions.length, 3);
  assert.strictEqual(d.json.status, 'ok'); assert.strictEqual(d.json.plans.length, 3);
});

test('MOCK_AI=1 sans clé API : fonctionne quand même ; MOCK_CASE=error → 502', async () => {
  setEnv({ MOCK_AI: '1', MOCK_CASE: 'error' });
  fakeAnthropic(function () { throw new Error('appel réel interdit'); });
  const r = await call(develop, BASE);
  assert.strictEqual(r.code, 502);
  assert.strictEqual(fetchCalls, 0);
});

test('AI_ENABLED=0 : toutes les routes répondent « pas activée » (503)', async () => {
  setEnv({ ANTHROPIC_API_KEY: 'faux', AI_ENABLED: '0' });
  fakeAnthropic(function () { throw new Error('appel réel interdit'); });
  for (const h of [develop, sources, angle, plans]) {
    const r = await call(h, { titre: 'x', sujet: 'x', mode: 'expose' });
    assert.strictEqual(r.code, 503);
  }
  assert.strictEqual(fetchCalls, 0);
});

test('sans clé et sans simulation : 503', async () => {
  setEnv({});
  const r = await call(develop, BASE);
  assert.strictEqual(r.code, 503);
});

test('angle et plans : blocs découpés recollés correctement', async () => {
  setEnv({ ANTHROPIC_API_KEY: 'faux' });
  const q = JSON.stringify({ questions: ['Q1 ?', 'Q2 ?', 'Q3 ?'] });
  fakeAnthropic({ stop_reason: 'end_turn', content: splitBlocks(q, 4) });
  const r = await call(angle, { mode: 'expose' });
  assert.strictEqual(r.json.status, 'questions');
  const pl = JSON.stringify({ plans: [1, 2, 3].map(function (i) { return { nom: 'P' + i, parties: [{ titre: 'A', level: 1 }, { titre: 'B', level: 1 }, { titre: 'C', level: 2 }] }; }) });
  fakeAnthropic({ stop_reason: 'end_turn', content: splitBlocks(pl, 5) });
  const r2 = await call(plans, { mode: 'expose', sujet: 'x' });
  assert.strictEqual(r2.json.status, 'ok');
});
