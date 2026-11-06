// Mode simulation : fausses réponses, aucune requête vers Anthropic, aucune dépense.
// Activer avec MOCK_AI=1 (Vercel : Preview et Development). Choisir le scénario avec MOCK_CASE :
//   ok (défaut) | questions | error | slow | broken
// Les adresses utilisées sont factices (domaine .test réservé aux essais).

const LOREM = [
  "Ce texte est une simulation : il sert à tester l'interface sans consommer de crédit. ",
  'Il contient plusieurs phrases pour vérifier la mise en page, le comptage des mots et le fichier Word.\n\n',
  "Un second paragraphe montre que les retours à la ligne sont bien conservés dans la zone de texte et dans le document final. ",
  'Aucune information réelle n\'est contenue ici.'
].join('');

function mockCase() {
  const c = String(process.env.MOCK_CASE || 'ok');
  return ['ok', 'questions', 'error', 'slow', 'broken'].indexOf(c) >= 0 ? c : 'ok';
}

function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

// Renvoie { code, body } pour la route demandée.
async function reply(route, body) {
  const c = mockCase();
  if (c === 'slow') await wait(5000);
  if (c === 'error') return { code: 502, body: { status: 'error', message: 'Simulation : le service a répondu avec une erreur.' } };
  if (c === 'broken') return { code: 502, body: { status: 'error', message: 'Simulation : texte illisible, réessaie.' } };
  if (route === 'develop') {
    if (c === 'questions') return { code: 200, body: { status: 'questions', questions: ['Simulation : peux-tu préciser le contexte ?', 'Simulation : quel résultat veux-tu mettre en avant ?'] } };
    const research = body && body.recherche === true;
    return { code: 200, body: { status: 'ok', texte: LOREM, recherche: research,
      sources: research ? [{ url: 'https://exemple.test/source-1', title: 'Source factice 1', site: 'exemple.test' }] : [] } };
  }
  if (route === 'sources') {
    return { code: 200, body: { status: 'ok', sources: [
      { url: 'https://exemple.test/source-1', title: 'Source factice 1', site: 'exemple.test' },
      { url: 'https://exemple.test/source-2', title: 'Source factice 2', site: 'exemple.test' }
    ] } };
  }
  if (route === 'angle') {
    if (!Array.isArray(body && body.reponses) || !body.reponses.length) {
      return { code: 200, body: { status: 'questions', questions: ['Simulation : qu\'est-ce qui t\'a le plus marqué ?', 'Simulation : quel problème as-tu observé ?', 'Simulation : que veux-tu faire retenir ?'] } };
    }
    return { code: 200, body: { status: 'ok', problematique: 'Simulation : comment améliorer le sujet étudié ?', angle: 'Simulation : angle choisi à partir de tes réponses.' } };
  }
  if (route === 'plans') {
    const mk = function (nom) {
      return { nom: nom, parties: [
        { titre: 'Introduction', level: 1 }, { titre: 'Contexte', level: 1 }, { titre: 'Notions de base', level: 2 },
        { titre: 'Analyse', level: 1 }, { titre: 'Conclusion', level: 1 }
      ] };
    };
    return { code: 200, body: { status: 'ok', plans: [mk('Plan classique (simulation)'), mk('Plan thématique (simulation)'), mk('Problème-solution (simulation)')] } };
  }
  return { code: 400, body: { status: 'error', message: 'Route inconnue.' } };
}

module.exports = { reply };
