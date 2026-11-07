// Test simple pour dev-server.js (sans supertest)
// Lancer : node --test tests/dev-server.test.js
const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const { spawn } = require('child_process');

const PORT = 3001;
const BASE = `http://localhost:${PORT}`;

function httpGet(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

let server;

test.before(async () => {
  server = spawn('node', ['dev-server.js'], {
    env: { ...process.env, PORT: String(PORT), MOCK_AI: '1' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  // Attendre que le serveur soit prêt
  await new Promise(resolve => setTimeout(resolve, 1000));
});

test.after(() => {
  if (server) server.kill();
});

test('GET / répond 200', async () => {
  const res = await httpGet('/');
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.includes('<html') || res.body.includes('<!doctype'));
});

test('GET /app.js répond 200', async () => {
  const res = await httpGet('/app.js');
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.length > 0);
});

test('GET /.env refusé (403 ou 404)', async () => {
  const res = await httpGet('/.env');
  assert.ok(res.status === 403 || res.status === 404, `Attendu 403 ou 404, reçu ${res.status}`);
});

test('GET /api/_ai.js refusé (403 ou 404)', async () => {
  const res = await httpGet('/api/_ai.js');
  assert.ok(res.status === 403 || res.status === 404, `Attendu 403 ou 404, reçu ${res.status}`);
});

test('GET /../package.json refusé (403 ou 404)', async () => {
  const res = await httpGet('/../package.json');
  assert.ok(res.status === 403 || res.status === 404, `Attendu 403 ou 404, reçu ${res.status}`);
});