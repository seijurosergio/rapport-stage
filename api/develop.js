// Fonction serveur Vercel : transforme les notes d'un étudiant en texte de rapport.
// La clé d'accès est lue dans les réglages de Vercel (ANTHROPIC_API_KEY), jamais écrite ici.

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5';
const MAX_NOTES = 4000;
const MIN_NOTES = 15;
const LIMIT_PER_HOUR = 40;
const LIMIT_RESEARCH_PER_HOUR = 24;
const MAX_SEARCHES = 2;
const MAX_ROUNDS = 4; /* tours maximum quand la recherche web demande de reprendre la main */
const { mockOn, aiOff, joinText, logUsage, mockSend } = require('./_ai');

const hits = new Map();
function limited(ip, key, max) {
  key = key || 'd'; max = max || LIMIT_PER_HOUR; ip = key + ':' + ip;
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(function (t) { return now - t < 3600000; });
  if (recent.length >= max) { hits.set(ip, recent); return true; }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

const SYSTEM = [
  "Tu aides un étudiant francophone à rédiger son rapport de stage. Tu reçois les notes de l'étudiant pour UNE seule partie du rapport.",
  "Réécris ces notes en un texte clair, bien construit, en français soutenu, à la première personne, au ton d'un rapport universitaire.",
  "RÈGLES STRICTES :",
  "- Utilise uniquement les informations présentes dans les notes et dans le contexte fourni.",
  "- N'invente aucun fait, chiffre, nom, date, outil ou résultat. Ne complète pas avec des détails plausibles.",
  "- Corrige l'orthographe et la grammaire, améliore les enchaînements, garde le sens exact.",
  "- Entre 80 et 250 mots, selon la richesse des notes. Ne fais pas de titre, pas de liste à puces.",
  "- Si les notes sont trop minces pour écrire un paragraphe utile sans inventer, ne rédige rien : pose 2 à 4 questions précises à l'étudiant pour obtenir les informations manquantes.",
  "FORMAT DE RÉPONSE : uniquement un objet JSON, sans balises de code ni commentaire.",
  'Soit {"texte":"..."} quand tu rédiges, soit {"questions":["...","..."]} quand il manque des informations.'
].join('\n');

const SYSTEM_RECHERCHE = [
  "Tu aides un étudiant francophone à rédiger UNE partie de son exposé en t'appuyant sur des sources fiables. Tu reçois le sujet, la partie à traiter et, parfois, les idées de l'étudiant.",
  "Utilise l'outil de recherche web (au plus " + MAX_SEARCHES + " recherches, de préférence en français) pour trouver des informations fiables sur CETTE partie. Privilégie les universités, organismes publics ou internationaux, revues, éditeurs et encyclopédies reconnus ; évite forums, blogs anonymes et pages commerciales.",
  "Rédige ensuite un texte clair, pédagogique et bien structuré, en français soutenu, que l'étudiant pourra lire ou présenter à l'oral, en partant de ses idées (s'il en a) et des pages trouvées.",
  "RÈGLES STRICTES :",
  "- Tout fait précis (chiffre, pourcentage, date, nom, définition technique, exemple) doit venir des pages trouvées. N'invente rien. Si les résultats ne permettent pas de traiter un point, n'en parle pas.",
  "- Reformule avec tes propres mots : pas de copier-coller de phrases entières des pages.",
  "- N'ajoute aucune information sur l'étudiant, son école ou son enseignant. Pas de titre, pas de liste à puces.",
  "- Ne cite pas les liens dans le texte.",
  'FORMAT DE RÉPONSE : uniquement un objet JSON, sans balises de code : {"texte":"...","sources_utilisees":["url exacte","..."]}. Dans sources_utilisees, mets uniquement les pages dont tu t\'es réellement servi, recopiées exactement depuis les résultats de recherche.'
].join('\n');

const STAGE_RECHERCHE = [
  "IMPORTANT : il s'agit d'un RAPPORT DE STAGE. Les faits sur le travail personnel de l'étudiant (missions, tâches, résultats, difficultés, ressenti) ne viennent QUE de ses notes et de ce qu'il a écrit en vrac : ne les invente jamais, même avec la recherche web.",
  "La recherche sert au contexte : secteur d'activité, notions techniques, normes, et informations publiques sur l'entreprise (seulement si les pages les confirment ; sinon n'en dis rien).",
  "Quand une partie demande des informations que seul l'étudiant connaît et qu'il n'a rien noté, écris un court texte de cadrage général et marque ce qu'il doit préciser par une phrase entre crochets, par exemple [À compléter : les tâches que tu as réalisées chaque semaine]. Ne comble jamais le vide avec des détails plausibles."
].join('\n');

const SYSTEM_EXPOSE = [
  "Tu aides un étudiant francophone à rédiger son exposé. Tu reçois ses notes pour UNE seule partie de l'exposé, avec le sujet et le contexte.",
  "Rédige un texte clair, pédagogique et bien structuré, en français soutenu, que l'étudiant pourra lire ou présenter à l'oral. Ne parle pas de toi.",
  "RÈGLES STRICTES :",
  "- Pars des idées de l'étudiant et respecte-les. Tu peux les expliquer et les relier avec des notions générales solides, largement admises dans le domaine (définitions classiques, principes de base, mécanismes connus).",
  "- N'invente aucun chiffre, pourcentage, date, nom de personne, citation, titre d'ouvrage, référence ou source. Si tu n'es pas certain d'un fait, ne l'écris pas.",
  "- N'ajoute pas d'informations sur l'étudiant, son école ou son enseignant.",
  "- Corrige l'orthographe et la grammaire, améliore les enchaînements.",
  "- Entre 100 et 280 mots, selon la richesse des notes. Ne fais pas de titre, pas de liste à puces.",
  "- Si les notes sont trop minces pour savoir quoi développer dans cette partie (par exemple seulement le nom du sujet sans aucun angle), ne rédige rien : pose 2 à 4 questions précises à l'étudiant.",
  "FORMAT DE RÉPONSE : uniquement un objet JSON, sans balises de code ni commentaire.",
  'Soit {"texte":"..."} quand tu rédiges, soit {"questions":["...","..."]} quand il manque des informations.'
].join('\n');

const STYLE_RULES = [
  "STYLE : varie la longueur et la construction des phrases ; évite les formules toutes faites et répétitives (« en effet », « il est important de souligner », « par ailleurs » en début de chaque phrase). Écris comme un étudiant sérieux, pas comme un robot.",
  "Ne répète pas ce qui est dit dans les autres parties du document (leurs titres sont fournis) : reste sur le sujet de cette partie."
].join('\n');

const LEVELS = {
  lycee: "Niveau lycée ou collège : vocabulaire simple et phrases courtes, explications concrètes.",
  licence: "Niveau licence : registre universitaire clair, termes techniques définis à leur première apparition.",
  master: "Niveau master : registre académique soutenu, analyse plus approfondie, termes techniques précis.",
  pro: "Formation professionnelle : ton clair et opérationnel, orienté pratique et métier."
};

// Longueur visée par partie, déduite du nombre de pages total (environ 350 mots par page).
function targetWords(pages, nbParties, expose) {
  const p = parseInt(pages, 10);
  if (!p || p < 1 || p > 200) return null;
  const parts = Math.max(1, Math.min(nbParties || 6, 20));
  const usable = Math.max(1, p - 3); // page de garde, sommaire, sources
  const each = Math.round((usable * 350) / parts);
  const lo = expose ? 100 : 80, hi = 600;
  const t = Math.max(lo, Math.min(hi, each));
  return { min: Math.round(t * 0.8), max: Math.round(t * 1.2) };
}

function validUrl(u) {
  if (typeof u !== 'string' || u.length > 600) return false;
  try { const x = new URL(u); return x.protocol === 'https:' || x.protocol === 'http:'; } catch (e) { return false; }
}
function host(u) {
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
}

function clean(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}

function parseModelJson(raw) {
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
    return send(res, 503, { status: 'unavailable', message: "La rédaction automatique n'est pas encore activée sur ce site." });
  }

  const ip = String((req.headers['x-forwarded-for'] || '')).split(',')[0].trim() || 'inconnu';
  if (!mockOn() && limited(ip)) {
    return send(res, 429, { status: 'error', message: 'Trop de demandes en peu de temps. Réessaie dans une heure.' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = null; } }
  if (!body || typeof body !== 'object') {
    return send(res, 400, { status: 'error', message: 'Demande illisible.' });
  }

  const notes = clean(body.notes, MAX_NOTES);
  const titre = clean(body.titre, 200);
  if (!titre) return send(res, 400, { status: 'error', message: 'Titre de la partie manquant.' });

  const expose0 = body.mode === 'expose';
  const research = body.recherche === true;
  const auto = body.auto === true;
  if (research && !clean(body.sujet, 200) && !(expose0 ? false : (clean(body.entreprise, 120) || clean(body.missions, 800)))) {
    return send(res, 200, { status: 'questions', questions: [expose0 ? "Renseigne d'abord le sujet de l'exposé à l'étape 1 : le site s'en sert pour chercher des sources." : "Renseigne d'abord ton entreprise ou décris tes missions à l'étape 1 : le site s'en sert pour chercher des sources."] });
  }
  if (!research && !auto && notes.length < MIN_NOTES) {
    return send(res, 200, {
      status: 'questions',
      questions: ["Écris d'abord quelques phrases sur cette partie : ce que tu as fait, vu ou appris, même en vrac."]
    });
  }

  const expose = body.mode === 'expose';
  const contexte = (expose ? [
    'Partie à rédiger : ' + titre,
    clean(body.parent, 200) ? 'Cette partie est dans : ' + clean(body.parent, 200) : '',
    clean(body.consigne, 400) ? 'Question guide : ' + clean(body.consigne, 400) : '',
    clean(body.sujet, 200) ? "Sujet de l'exposé : " + clean(body.sujet, 200) : '',
    clean(body.matiere, 120) ? 'Matière : ' + clean(body.matiere, 120) : '',
    clean(body.filiere, 120) ? "Filière ou classe : " + clean(body.filiere, 120) : '',
    clean(body.duree, 120) ? "Durée prévue de l'exposé : " + clean(body.duree, 120) : ''
  ] : [
    'Partie à rédiger : ' + titre,
    clean(body.parent, 200) ? 'Cette partie est dans : ' + clean(body.parent, 200) : '',
    clean(body.consigne, 400) ? 'Question guide : ' + clean(body.consigne, 400) : '',
    clean(body.filiere, 120) ? 'Filière de l\'étudiant : ' + clean(body.filiere, 120) : '',
    clean(body.entreprise, 120) ? "Entreprise d'accueil : " + clean(body.entreprise, 120) : '',
    clean(body.duree, 120) ? 'Durée du stage : ' + clean(body.duree, 120) : '',
    clean(body.sujet, 200) ? 'Sujet du rapport : ' + clean(body.sujet, 200) : '',
    clean(body.missions, 800) ? "Ce que l'étudiant a écrit en vrac sur son stage (missions, idées) : " + clean(body.missions, 800) : ''
  ]).filter(Boolean).join('\n');

  const niveau = LEVELS[body.niveau] || '';
  const tw = targetWords(body.pages, parseInt(body.nbParties, 10), expose);
  const autres = Array.isArray(body.autres) ? body.autres.slice(0, 30).map(function (x) { return clean(x, 120); }).filter(Boolean) : [];
  const extra = [
    niveau,
    tw ? 'Longueur visée pour cette partie : entre ' + tw.min + ' et ' + tw.max + ' mots (document de ' + parseInt(body.pages, 10) + ' pages au total). Cette consigne remplace la fourchette de mots indiquée plus haut, sans jamais t\'autoriser à inventer : si les notes sont trop minces, reste plus court ou pose des questions.' : '',
    autres.length ? 'Autres parties du document (à ne pas répéter) : ' + autres.join(' ; ') : ''
  ].filter(Boolean).join('\n');

  const autoNote = auto ? "\nMODE AUTOMATIQUE : ne pose AUCUNE question. Rédige cette partie à partir du sujet, du titre de la partie, des notes éventuelles et de notions générales solides et largement admises ; pour un rapport de stage, marque par [À compléter : …] ce que seul l'étudiant peut préciser. N'invente toujours aucun chiffre, date, nom, citation ou référence ; si tu n'es pas certain d'un fait, reste général." : '';
  const user = contexte + autoNote + (extra ? '\n' + extra : '') + (notes ? '\n\nNotes de l\'étudiant pour cette partie :\n"""\n' + notes + '\n"""' : (research ? "\n\nL'étudiant n'a pas encore noté d'idées pour cette partie : base-toi sur le sujet et sur tes recherches." : ''));
  if (research && !mockOn() && limited(ip, 'r', LIMIT_RESEARCH_PER_HOUR)) {
    return send(res, 429, { status: 'error', message: 'Trop de rédactions avec recherche en peu de temps. Réessaie dans une heure.' });
  }
  /* Mode simulation : on s'arrête ici, sans appeler Anthropic. */
  if (await mockSend(res, 'develop', { recherche: research })) return;

  let reply;
  const found = new Map(); /* url -> titre : ce que la recherche a réellement renvoyé */
  try {
    const messages = [{ role: 'user', content: user }];
    for (let round = 0; round < (research ? MAX_ROUNDS : 1); round++) {
      const payload = {
        model: MODEL,
        max_tokens: 3000,
        system: (research ? SYSTEM_RECHERCHE + (expose ? '' : '\n' + STAGE_RECHERCHE) : (expose ? SYSTEM_EXPOSE : SYSTEM)) + (auto && !research && !expose ? '\n' + STAGE_RECHERCHE : '') + '\n' + STYLE_RULES,
        messages: messages
      };
      if (research) payload.tools = [{ type: 'web_search_20250305', name: 'web_search', max_uses: MAX_SEARCHES }];
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(payload)
      });
      if (!r.ok) {
        let info = '';
        try { const j = await r.json(); info = (j && j.error && j.error.message) || ''; } catch (e) { /* ignoré */ }
        console.error('develop: erreur API', r.status, String(info).slice(0, 300));
        if (research && r.status === 400 && /web.?search/i.test(info)) {
          return send(res, 502, { status: 'error', message: "La recherche web n'est pas activée sur ton compte Anthropic (console : Settings, puis Capabilities)." });
        }
        return send(res, 502, { status: 'error', message: "Le service de rédaction a répondu avec une erreur. Réessaie dans un moment." });
      }
      reply = await r.json();
      logUsage(research ? 'develop-recherche' : 'develop', reply);
      const blocks = Array.isArray(reply.content) ? reply.content : [];
      blocks.forEach(function (bk) {
        if (bk && bk.type === 'web_search_tool_result' && Array.isArray(bk.content)) {
          bk.content.forEach(function (x) {
            if (x && x.type === 'web_search_result' && validUrl(x.url) && !found.has(x.url)) found.set(x.url, clean(x.title, 200));
          });
        }
      });
      if (research && reply.stop_reason === 'pause_turn') { messages.push({ role: 'assistant', content: blocks }); continue; }
      break;
    }
  } catch (e) {
    console.error('develop: connexion impossible', e && e.message);
    return send(res, 502, { status: 'error', message: "Impossible de joindre le service de rédaction. Réessaie dans un moment." });
  }

  /* Avec la recherche web, le texte arrive en plusieurs morceaux : on les recolle sans rien ajouter. */
  const raw = reply ? joinText(reply.content) : '';
  if (reply && reply.stop_reason === 'max_tokens') {
    console.error('develop: reponse coupee (max_tokens)');
    return send(res, 502, { status: 'error', message: 'Le texte a été coupé avant la fin. Réessaie.' });
  }
  const parsed = parseModelJson(raw);

  if (auto && parsed && Array.isArray(parsed.questions) && !parsed.texte) {
    return send(res, 502, { status: 'error', message: "Le texte n'a pas pu être généré automatiquement pour cette partie. Réessaie." });
  }
  if (parsed && Array.isArray(parsed.questions) && parsed.questions.length) {
    return send(res, 200, {
      status: 'questions',
      questions: parsed.questions.slice(0, 4).map(function (q) { return String(q).slice(0, 300); })
    });
  }
  /* Sources : seulement des pages réellement renvoyées par la recherche ET déclarées utilisées. */
  const sources = [];
  if (research && parsed && Array.isArray(parsed.sources_utilisees)) {
    parsed.sources_utilisees.forEach(function (u) {
      if (typeof u === 'string' && found.has(u) && sources.length < 6 && !sources.some(function (x) { return x.url === u; })) {
        sources.push({ url: u, title: found.get(u) || host(u), site: host(u) });
      }
    });
  }
  if (parsed && typeof parsed.texte === 'string' && parsed.texte.trim()) {
    return send(res, 200, { status: 'ok', texte: parsed.texte.trim(), sources: sources, recherche: research });
  }
  /* Lecture du JSON impossible : on ne renvoie jamais un texte qui ressemble à du JSON ou à des balises. */
  if (raw && raw.trim() && !parsed) {
    if (!/^[\s`]*\{|"texte"\s*:|"sources_utilisees"|```/.test(raw)) {
      return send(res, 200, { status: 'ok', texte: raw.trim(), sources: [], recherche: research });
    }
    console.error('develop: JSON illisible', JSON.stringify({ stop_reason: reply && reply.stop_reason, apercu: raw.slice(0, 200) }));
    return send(res, 502, { status: 'error', message: 'Texte illisible. Réessaie.' });
  }
  console.error('develop: reponse inutilisable', JSON.stringify({
    stop_reason: reply && reply.stop_reason,
    types: reply && Array.isArray(reply.content) ? reply.content.map(function (b) { return b && b.type; }) : null,
    model: reply && reply.model,
    apercu: String(raw || '').slice(0, 200)
  }));
  return send(res, 502, { status: 'error', message: 'La réponse reçue est inutilisable. Réessaie.' });
};
