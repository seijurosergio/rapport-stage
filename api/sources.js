// Fonction serveur Vercel : propose de vraies pistes de sources pour un exposé.
// Elle utilise l'outil de recherche web de l'API Anthropic. Seuls les liens réellement
// renvoyés par la recherche sont gardés : aucun lien n'est inventé par le modèle.
// La clé d'accès est lue dans les réglages de Vercel (ANTHROPIC_API_KEY).

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5';
const MAX_SEARCHES = 3;
const MAX_SOURCES = 8;
const LIMIT_PER_HOUR = 6;
const { mockOn, aiOff, joinText, logUsage, mockSend } = require('./_ai');

const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(function (t) { return now - t < 3600000; });
  if (recent.length >= LIMIT_PER_HOUR) { hits.set(ip, recent); return true; }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

const SYSTEM = [
  "Tu aides un étudiant francophone à trouver des sources fiables pour préparer un exposé.",
  "Utilise l'outil de recherche web (au plus " + MAX_SEARCHES + " recherches, de préférence en français) pour trouver des pages utiles sur le sujet.",
  "Privilégie : universités, organismes publics ou internationaux, revues et éditeurs reconnus, encyclopédies, manuels et cours en ligne d'établissements. Évite les forums, blogs anonymes et pages commerciales.",
  "Tu ne choisis QUE des liens qui apparaissent dans les résultats de recherche, recopiés exactement. N'invente jamais un lien ni un titre.",
  'Réponds uniquement par un objet JSON, sans balises de code : {"sources":[{"url":"..."}]} avec 5 à ' + MAX_SOURCES + " liens, du plus utile au moins utile."
].join('\n');

function clean(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}

function host(u) {
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
}

function validUrl(u) {
  if (typeof u !== 'string' || u.length > 600) return false;
  try { const x = new URL(u); return x.protocol === 'https:' || x.protocol === 'http:'; } catch (e) { return false; }
}

function parseJson(raw) {
  let t = String(raw || '').trim();
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try { return JSON.parse(t); } catch (e) { /* on tente d'extraire l'objet */ }
  const a = t.indexOf('{');
  const b = t.lastIndexOf('}');
  if (a >= 0 && b > a) {
    try { return JSON.parse(t.slice(a, b + 1)); } catch (e) { /* abandon */ }
  }
  return null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return send(res, 405, { status: 'error', message: 'Méthode non autorisée.' });
  }
  if (aiOff() || (!mockOn() && !process.env.ANTHROPIC_API_KEY)) {
    return send(res, 503, { status: 'unavailable', message: "La recherche de sources n'est pas encore activée sur ce site." });
  }

  const ip = String((req.headers['x-forwarded-for'] || '')).split(',')[0].trim() || 'inconnu';
  if (!mockOn() && limited(ip)) {
    return send(res, 429, { status: 'error', message: 'Trop de recherches en peu de temps. Réessaie dans une heure.' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = null; } }
  if (!body || typeof body !== 'object') {
    return send(res, 400, { status: 'error', message: 'Demande illisible.' });
  }

  const sujet = clean(body.sujet, 250);
  if (!sujet) return send(res, 400, { status: 'error', message: "Le sujet de l'exposé est manquant." });
  const matiere = clean(body.matiere, 120);
  const parties = Array.isArray(body.parties)
    ? body.parties.map(function (x) { return clean(x, 120); }).filter(Boolean).slice(0, 10) : [];
  const notes = clean(body.notes, 600);

  const user = [
    "Sujet de l'exposé : " + sujet,
    matiere ? 'Matière : ' + matiere : '',
    parties.length ? 'Parties prévues : ' + parties.join(' ; ') : '',
    notes ? "Idées de l'étudiant : " + notes : ''
  ].filter(Boolean).join('\n');

  if (await mockSend(res, 'sources', body)) return;

  const found = new Map(); /* url -> { title } : tout ce que la recherche a réellement renvoyé */
  let text = '';
  const messages = [{ role: 'user', content: user }];

  try {
    for (let round = 0; round < 3; round++) {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1500,
          system: SYSTEM,
          tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: MAX_SEARCHES }],
          messages: messages
        })
      });
      if (!r.ok) {
        let info = '';
        try { const j = await r.json(); info = (j && j.error && j.error.message) || ''; } catch (e) { /* ignoré */ }
        console.error('sources: erreur API', r.status, String(info).slice(0, 300));
        if (r.status === 400 && /web.?search/i.test(info)) {
          return send(res, 502, { status: 'error', message: "La recherche web n'est pas activée sur ton compte Anthropic (console : Settings, puis Capabilities)." });
        }
        return send(res, 502, { status: 'error', message: 'Le service de recherche a répondu avec une erreur. Réessaie dans un moment.' });
      }
      const reply = await r.json();
      logUsage('sources', reply);
      const blocks = Array.isArray(reply.content) ? reply.content : [];
      blocks.forEach(function (b) {
        if (b && b.type === 'web_search_tool_result' && Array.isArray(b.content)) {
          b.content.forEach(function (x) {
            if (x && x.type === 'web_search_result' && validUrl(x.url) && !found.has(x.url)) {
              found.set(x.url, { title: clean(x.title, 200) });
            }
          });
        }
      });
      text = joinText(blocks);
      if (reply.stop_reason === 'pause_turn') {
        messages.push({ role: 'assistant', content: blocks });
        continue;
      }
      break;
    }
  } catch (e) {
    console.error('sources: connexion impossible', e && e.message);
    return send(res, 502, { status: 'error', message: 'Impossible de joindre le service de recherche. Réessaie dans un moment.' });
  }

  if (!found.size) {
    return send(res, 200, { status: 'empty', message: "Aucune page trouvée pour ce sujet. Essaie de préciser le sujet à l'étape 1, ou ajoute tes sources à la main." });
  }

  /* On garde les liens choisis par le modèle seulement s'ils font partie des résultats réels. */
  const out = [];
  const seen = new Set();
  function add(url) {
    const f = found.get(url);
    if (!f || seen.has(url) || out.length >= MAX_SOURCES) return;
    seen.add(url);
    out.push({ title: f.title || host(url), url: url, site: host(url) });
  }
  const parsed = parseJson(text);
  if (parsed && Array.isArray(parsed.sources)) {
    parsed.sources.forEach(function (s) { if (s && typeof s.url === 'string') add(s.url); });
  }
  if (!out.length) {
    Array.from(found.keys()).forEach(add); /* repli : les premiers résultats de la recherche */
  }
  return send(res, 200, { status: 'ok', sources: out });
};
