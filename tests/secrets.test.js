// Garde-fous secrets : aucune clé dans le dépôt, .env ignoré, aucune route /api ne renvoie une variable d'environnement.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', 'vendor', '.git', 'output']);
const KEY_PATTERNS = [
  ['clé Anthropic', new RegExp('sk-' + 'ant-[A-Za-z0-9_-]{10,}')],
  ['clé FedaPay', new RegExp('sk_' + '(live|sandbox)_[A-Za-z0-9]{8,}')],
  ['jeton Bearer', new RegExp('Bearer ' + '[A-Za-z0-9._~+/=-]{20,}')],
  ['clé privée', new RegExp('-----BEGIN ' + '[A-Z ]*PRIVATE KEY')]
];

function walk(dir, out) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (e) {
    if (SKIP_DIRS.has(e.name)) return;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (/\.(js|html|css|json|md|yml|yaml|txt)$/.test(e.name) && e.name !== 'package-lock.json') out.push(p);
  });
  return out;
}

test('aucune clé ni jeton dans le dépôt', () => {
  walk(ROOT, []).forEach(function (f) {
    const txt = fs.readFileSync(f, 'utf8');
    KEY_PATTERNS.forEach(function (kp) { assert.ok(!kp[1].test(txt), kp[0] + ' trouvée dans ' + path.relative(ROOT, f)); });
  });
});

test('.env et .env.* sont ignorés par Git et par Kilo', () => {
  const gi = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
  assert.ok(/^\.env$/m.test(gi) && /^\.env\.\*$/m.test(gi), '.gitignore ne protège pas les .env');
  const ki = fs.readFileSync(path.join(ROOT, '.kilocodeignore'), 'utf8');
  assert.ok(/\.env/.test(ki), '.kilocodeignore ne protège pas les .env');
});

test('aucun console.log dans le code navigateur', () => {
  ['app.js'].concat(fs.readdirSync(path.join(ROOT, 'js')).map(function (f) { return 'js/' + f; })).forEach(function (f) {
    assert.ok(!/console\.(log|info|debug)\(/.test(fs.readFileSync(path.join(ROOT, f), 'utf8')), 'console.log dans ' + f);
  });
});

test('aucune route /api ne renvoie une variable d\'environnement', async () => {
  const names = new Set();
  fs.readdirSync(path.join(ROOT, 'api')).forEach(function (f) {
    (fs.readFileSync(path.join(ROOT, 'api', f), 'utf8').match(/process\.env\.([A-Z_0-9]+)/g) || []).forEach(function (m) { names.add(m.replace('process.env.', '')); });
  });
  const FLAGS = new Set(['MOCK_AI', 'MOCK_CASE', 'AI_ENABLED', 'ANTHROPIC_MODEL']);
  const saved = {};
  names.forEach(function (n) { saved[n] = process.env[n]; delete process.env[n]; if (!FLAGS.has(n)) process.env[n] = 'LEAKTEST_' + n + '_VALEUR_SECRETE'; });
  const realFetch = global.fetch;
  const variants = [
    function () { return { ok: false, status: 500, json: async function () { return {}; }, text: async function () { return ''; } }; },
    function () { return { ok: true, status: 200, json: async function () { return { content: [{ type: 'text', text: '{"texte":"ok"}' }], data: {} }; }, text: async function () { return ''; } }; }
  ];
  try {
    for (const route of ['develop', 'sources', 'angle', 'plans', 'pay-start', 'pay-check']) {
      for (const v of variants) {
        global.fetch = async function () { return v(); };
        const handler = require(path.join(ROOT, 'api', route + '.js'));
        for (const req of [{ method: 'POST', headers: {}, body: { titre: 'x', sujet: 'x', mode: 'expose', notes: 'notes assez longues pour passer', email: 'a@b.cd', nom: 'x' }, query: {} },
                           { method: 'GET', headers: {}, body: null, query: { id: '1', nonce: 'abcdef123456' } }]) {
          const body = await new Promise(function (resolve) {
            const res = { statusCode: 200, setHeader: function () {}, end: function (t) { resolve(String(t || '')); } };
            Promise.resolve(handler(req, res)).catch(function () { resolve(''); });
          });
          assert.ok(!/LEAKTEST_/.test(body), 'la route ' + route + ' renvoie une variable d\'environnement : ' + body.slice(0, 200));
        }
      }
    }
  } finally {
    global.fetch = realFetch;
    names.forEach(function (n) { if (saved[n] === undefined) delete process.env[n]; else process.env[n] = saved[n]; });
  }
});
