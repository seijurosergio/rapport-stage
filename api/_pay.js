// Aides communes pour le paiement FedaPay (MTN Mobile Money, Moov Money, cartes).
// Les clés sont lues dans les réglages de Vercel, jamais écrites dans le code.

const crypto = require('crypto');

function base() {
  if (process.env.FEDAPAY_API_URL) return process.env.FEDAPAY_API_URL.replace(/\/+$/, '');
  return process.env.FEDAPAY_ENV === 'sandbox'
    ? 'https://sandbox-api.fedapay.com/v1'
    : 'https://api.fedapay.com/v1';
}

function price() {
  const p = parseInt(process.env.PRICE_FCFA || '2000', 10);
  return Number.isFinite(p) && p >= 100 && p <= 100000 ? p : 2000;
}

function enabled() {
  return !!process.env.FEDAPAY_SECRET_KEY;
}

function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}

async function fedapay(method, path, body) {
  const r = await fetch(base() + path, {
    method: method,
    headers: {
      Authorization: 'Bearer ' + process.env.FEDAPAY_SECRET_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  let data = null;
  try { data = await r.json(); } catch (e) { data = null; }
  return { ok: r.ok, status: r.status, data: data };
}

// FedaPay enveloppe l'objet sous une clé comme "v1/transaction".
function unwrap(data) {
  if (!data || typeof data !== 'object') return null;
  return data['v1/transaction'] || data.transaction || data;
}

function nonce() {
  return crypto.randomBytes(6).toString('hex');
}

const hits = new Map();
function limited(key, max) {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter(function (t) { return now - t < 3600000; });
  if (recent.length >= max) { hits.set(key, recent); return true; }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

function clientIp(req) {
  return String((req.headers && req.headers['x-forwarded-for']) || '').split(',')[0].trim() || 'inconnu';
}

module.exports = { base, price, enabled, send, fedapay, unwrap, nonce, limited, clientIp };
