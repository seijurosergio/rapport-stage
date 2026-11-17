// Journaux sûrs : jamais de clé, de jeton, d'en-tête, de corps de requête, de variable d'environnement
// ni de contenu écrit par l'utilisateur. Seuls des petits champs techniques (statut, durée, type d'erreur).
const MAX = 300;
const BLOCKED_KEYS = /^(headers?|body|env|authorization|cookie|cookies|token|tokens|key|apikey|api_key|secret|password|texte|text|notes|content)$/i;
const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9_-]{8,}/g,
  /Bearer\s+[A-Za-z0-9._~+/=-]{8,}/gi,
  /(secret|token|api_?key|authorization|password)["']?\s*[:=]\s*["']?[^\s,"'}]+/gi,
  /\b[A-Za-z0-9_-]{32,}\b/g
];

function redact(value) {
  let t = String(value == null ? '' : value);
  SECRET_PATTERNS.forEach(function (re) { t = t.replace(re, '[masqué]'); });
  return t.length > MAX ? t.slice(0, MAX) + '…' : t;
}
function clean(data) {
  const out = {};
  Object.keys(data || {}).forEach(function (k) {
    if (BLOCKED_KEYS.test(k)) return;
    const v = data[k];
    out[k] = (v !== null && typeof v === 'object') ? redact(JSON.stringify(v)) : redact(v);
  });
  return out;
}
function logInfo(tag, data) { console.log(tag + ' ' + JSON.stringify(clean(data))); }
function logError(tag, data) { console.error(tag + ' ' + JSON.stringify(clean(data))); }

module.exports = { logInfo, logError, redact };
