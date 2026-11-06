// Aide « page blanche » : 3 questions, puis une problématique à partir des réponses.
const { clean, send, guard, ask, mockSend } = require('./_ai');

const SYSTEM_Q = [
  "Tu aides un étudiant francophone qui ne sait pas par où commencer son document (rapport de stage ou exposé).",
  "Pose exactement 3 questions courtes, concrètes et simples, qui l'aident à trouver ce qui l'intéresse et l'angle de son travail (par exemple : ce qui l'a le plus marqué ou intrigué, le problème précis observé ou la question qu'il se pose, ce qu'il voudrait que le lecteur retienne).",
  "N'invente rien sur lui. Pas de jargon.",
  'Réponds uniquement par un objet JSON : {"questions":["...","...","..."]}'
].join('\n');

const SYSTEM_P = [
  "Tu aides un étudiant francophone à formuler la problématique de son document à partir de ses réponses à 3 questions.",
  "Propose UNE problématique (une seule question, claire, précise, adaptée à son niveau) et UNE phrase qui explique l'angle choisi.",
  "N'utilise que ce que l'étudiant a dit. N'invente aucun fait, chiffre, nom ou résultat.",
  'Réponds uniquement par un objet JSON : {"problematique":"...","angle":"..."}'
].join('\n');

module.exports = async function handler(req, res) {
  const body = guard(req, res, 'angle', 20);
  if (!body) return;
  if (await mockSend(res, 'angle', body)) return;
  const ctx = [
    body.mode === 'expose' ? "Type de document : exposé" : 'Type de document : rapport de stage',
    clean(body.sujet, 200) ? 'Sujet : ' + clean(body.sujet, 200) : '',
    clean(body.filiere, 120) ? 'Filière : ' + clean(body.filiere, 120) : '',
    clean(body.entreprise, 120) ? "Entreprise d'accueil : " + clean(body.entreprise, 120) : '',
    clean(body.niveau, 40) ? "Niveau d'études : " + clean(body.niveau, 40) : '',
    clean(body.missions, 800) ? "Ce que l'étudiant a déjà écrit : " + clean(body.missions, 800) : ''
  ].filter(Boolean).join('\n');
  const reps = Array.isArray(body.reponses) ? body.reponses.slice(0, 3) : [];
  try {
    if (!reps.length) {
      const p = await ask(SYSTEM_Q, ctx, 500, 'angle-questions');
      const q = p && Array.isArray(p.questions) ? p.questions.map(function (x) { return clean(String(x), 250); }).filter(Boolean).slice(0, 3) : [];
      if (q.length < 3) return send(res, 502, { status: 'error', message: 'Réponse inutilisable. Réessaie.' });
      return send(res, 200, { status: 'questions', questions: q });
    }
    const qs = Array.isArray(body.questions) ? body.questions.slice(0, 3) : [];
    const qa = reps.map(function (a, i) { return 'Q' + (i + 1) + ' : ' + clean(String(qs[i] || ''), 250) + '\nRéponse : ' + clean(String(a || ''), 600); }).join('\n');
    if (!reps.some(function (a) { return clean(String(a || ''), 600).length >= 8; })) {
      return send(res, 400, { status: 'error', message: 'Réponds au moins à une question pour obtenir une problématique.' });
    }
    const p = await ask(SYSTEM_P, ctx + '\n\n' + qa, 600, 'angle-problematique');
    if (!p || typeof p.problematique !== 'string' || !p.problematique.trim()) return send(res, 502, { status: 'error', message: 'Réponse inutilisable. Réessaie.' });
    return send(res, 200, { status: 'ok', problematique: p.problematique.trim().slice(0, 400), angle: clean(p.angle, 400) });
  } catch (e) {
    return send(res, 502, { status: 'error', message: 'Impossible de joindre le service. Réessaie dans un moment.' });
  }
};
