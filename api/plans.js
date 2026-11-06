// Propose 3 variantes de plan adaptées au sujet.
const { clean, send, guard, ask, mockSend } = require('./_ai');

const SYSTEM = [
  "Tu aides un étudiant francophone à structurer son document (rapport de stage ou exposé).",
  "Propose exactement 3 plans différents (par exemple : classique, thématique, problème-solution), adaptés à son sujet, son niveau et au nombre de pages visé.",
  "Chaque plan a un nom court et 5 à 9 lignes ; chaque ligne est un titre de partie (level 1) ou de sous-partie (level 2). Les titres sont concrets, spécifiques au sujet, sans numérotation.",
  "Pour un rapport de stage, garde l'esprit : introduction, présentation de la structure, travaux réalisés, analyse, conclusion. Pour un exposé : introduction, développement, conclusion. N'ajoute pas de partie « Sources » ni « Page de garde » : elles existent déjà.",
  "N'invente aucun fait sur l'étudiant ou son entreprise.",
  'Réponds uniquement par un objet JSON : {"plans":[{"nom":"...","parties":[{"titre":"...","level":1},{"titre":"...","level":2}]}]}'
].join('\n');

module.exports = async function handler(req, res) {
  const body = guard(req, res, 'plans', 15);
  if (!body) return;
  if (await mockSend(res, 'plans', body)) return;
  const ctx = [
    body.mode === 'expose' ? 'Type de document : exposé' : 'Type de document : rapport de stage',
    clean(body.sujet, 200) ? 'Sujet : ' + clean(body.sujet, 200) : '',
    clean(body.filiere, 120) ? 'Filière : ' + clean(body.filiere, 120) : '',
    clean(body.entreprise, 120) ? "Entreprise d'accueil : " + clean(body.entreprise, 120) : '',
    clean(body.niveau, 40) ? "Niveau d'études : " + clean(body.niveau, 40) : '',
    parseInt(body.pages, 10) > 0 ? 'Pages visées : ' + parseInt(body.pages, 10) : '',
    clean(body.missions, 800) ? "Idées de l'étudiant : " + clean(body.missions, 800) : ''
  ].filter(Boolean).join('\n');
  try {
    const p = await ask(SYSTEM, ctx, 1800, 'plans');
    const plans = (p && Array.isArray(p.plans) ? p.plans : []).slice(0, 3).map(function (pl) {
      const parts = (Array.isArray(pl.parties) ? pl.parties : []).slice(0, 14).map(function (x, i) {
        return { titre: clean(x && x.titre, 120), level: i > 0 && x && x.level === 2 ? 2 : 1 };
      }).filter(function (x) { return x.titre; });
      return { nom: clean(pl.nom, 60) || 'Plan', parties: parts };
    }).filter(function (pl) { return pl.parties.length >= 3; });
    if (!plans.length) return send(res, 502, { status: 'error', message: 'Réponse inutilisable. Réessaie.' });
    return send(res, 200, { status: 'ok', plans: plans });
  } catch (e) {
    return send(res, 502, { status: 'error', message: 'Impossible de joindre le service. Réessaie dans un moment.' });
  }
};
