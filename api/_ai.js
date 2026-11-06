// Aides communes aux fonctions IA (limite par IP, appel Anthropic, lecture du JSON).
const mock = require('./_mock');

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5';
const hits = new Map();

// MOCK_AI=1 : réponses factices, aucun appel à Anthropic. AI_ENABLED=0 : IA coupée.
function mockOn() { return process.env.MOCK_AI === '1'; }
function aiOff() { return process.env.AI_ENABLED === '0'; }

function limited(key, ip, max) {
  const k = key + ':' + ip, now = Date.now();
  const recent = (hits.get(k) || []).filter(function (t) { return now - t < 3600000; });
  if (recent.length >= max) { hits.set(k, recent); return true; }
  recent.push(now); hits.set(k, recent);
  return false;
}
function clean(v, max) { return typeof v === 'string' ? v.trim().slice(0, max) : ''; }
function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}
function parseJson(raw) {
  const t = String(raw || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try { return JSON.parse(t); } catch (e) { /* extraction */ }
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch (e) { /* abandon */ } }
  return null;
}
// Recolle les blocs de texte d'une réponse. Avec la recherche web, le texte est découpé en
// morceaux (un par passage cité) : il faut les joindre SANS rien ajouter entre eux.
function joinText(content) {
  return Array.isArray(content)
    ? content.filter(function (b) { return b && b.type === 'text' && typeof b.text === 'string'; }).map(function (b) { return b.text; }).join('')
    : '';
}
// Journal de consommation : visible dans les logs Vercel, pour connaître le vrai coût de chaque appel.
function logUsage(tag, reply) {
  try {
    console.log('usage ' + JSON.stringify({ route: tag, model: reply && reply.model, stop: reply && reply.stop_reason, usage: reply && reply.usage }));
  } catch (e) { /* ignoré */ }
}
// Gère méthode, interrupteur, clé, limite, corps ; renvoie le corps ou null (réponse déjà envoyée).
function guard(req, res, key, max) {
  if (req.method !== 'POST') { send(res, 405, { status: 'error', message: 'Méthode non autorisée.' }); return null; }
  if (aiOff()) { send(res, 503, { status: 'unavailable', message: "Cette aide automatique n'est pas encore activée sur ce site." }); return null; }
  if (!mockOn() && !process.env.ANTHROPIC_API_KEY) { send(res, 503, { status: 'unavailable', message: "Cette aide automatique n'est pas encore activée sur ce site." }); return null; }
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'inconnu';
  if (!mockOn() && limited(key, ip, max)) { send(res, 429, { status: 'error', message: 'Trop de demandes en peu de temps. Réessaie dans une heure.' }); return null; }
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = null; } }
  if (!body || typeof body !== 'object') { send(res, 400, { status: 'error', message: 'Demande illisible.' }); return null; }
  return body;
}
// Appel simple : renvoie l'objet JSON lu dans la réponse, ou null si elle est coupée ou illisible.
async function ask(system, user, maxTokens, tag) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens || 1200, system: system, messages: [{ role: 'user', content: user }] })
  });
  if (!r.ok) throw new Error('http ' + r.status);
  const d = await r.json();
  logUsage(tag || 'ask', d);
  if (d.stop_reason === 'max_tokens') return null;
  return parseJson(joinText(d.content));
}
// Réponse simulée (MOCK_AI=1) : renvoie true si elle a été envoyée.
async function mockSend(res, route, body) {
  if (!mockOn()) return false;
  const m = await mock.reply(route, body);
  send(res, m.code, m.body);
  return true;
}
module.exports = { clean, send, guard, ask, mockOn, aiOff, joinText, logUsage, parseJson, mockSend };
