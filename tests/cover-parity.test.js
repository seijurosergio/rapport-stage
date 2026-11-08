// Tests pour la parité entre l'aperçu (JS) et le Word généré
// Lancer : node --test tests/cover-parity.test.js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
let JSDOM; try { ({ JSDOM } = require('jsdom')); } catch (e) { try { ({ JSDOM } = require('/tmp/jt/node_modules/jsdom')); } catch (e2) { JSDOM = null; } }

const ROOT = path.join(__dirname, '..');

function boot() {
  const dom = new JSDOM('<!doctype html><html><body><div class="app" id="app"></div></body></html>', { runScripts: 'outside-only', url: 'https://test.local/' });
  const w = dom.window;
  w.scrollTo = function () {};
  Object.defineProperty(w, 'pageYOffset', { get: function () { return 0; } });
  w.fetch = function () { return Promise.resolve({ json: function () { return Promise.resolve({ enabled: false, price: 0 }); } }); };
  w.confirm = function () { return true; }; w.alert = function () {};
  // Charger docx d'abord
  const docxCode = fs.readFileSync(path.join(ROOT, 'vendor', 'docx.iife.js'), 'utf8');
  w.eval(docxCode);
  w.docx = w.docx;
  // Charger utils.js
  const utilsCode = fs.readFileSync(path.join(ROOT, 'js', 'utils.js'), 'utf8');
  w.eval(utilsCode);
  // Charger cover-data.js
  const coverDataCode = fs.readFileSync(path.join(ROOT, 'js', 'cover-data.js'), 'utf8');
  w.eval(coverDataCode);
  // Charger storage.js
  const storageCode = fs.readFileSync(path.join(ROOT, 'js', 'storage.js'), 'utf8');
  w.eval(storageCode);
  // Charger dialogs.js
  const dialogsCode = fs.readFileSync(path.join(ROOT, 'js', 'dialogs.js'), 'utf8');
  w.eval(dialogsCode);
  // Charger export-docx.js
  const exportCode = fs.readFileSync(path.join(ROOT, 'js', 'export-docx.js'), 'utf8');
  w.eval(exportCode);
  const reg = fs.readFileSync(path.join(ROOT, 'modeles-couverture', '_registre.js'), 'utf8');
  w.eval(reg);
  fs.readdirSync(path.join(ROOT, 'modeles-couverture')).filter(function (f) { return f !== '_registre.js'; })
    .forEach(function (f) { w.eval(fs.readFileSync(path.join(ROOT, 'modeles-couverture', f), 'utf8')); });
  w.eval(fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8'));
  return w;
}

function makeStageState(model, banner) {
  return {
    profile: { nom: 'DUPONT Jean', ecole: 'Université Test', filiere: 'Informatique', entreprise: 'Entreprise Test', duree: '3 mois', missions: 'Stage de fin d\'études', sujet: 'Développement web', matiere: '', enseignant: 'M. Martin', departement: 'INFO', numTheme: '12', numGroupe: 'A', titreRapport: 'Mon rapport', niveau: 'master', pages: '30', membres: ['DUPONT Jean'] },
    mode: 'stage',
    sections: [
      { id: 's1', level: 1, title: 'Introduction', guide: '', nonum: true, notes: 'Notes intro', text: 'Texte intro' },
      { id: 's2', level: 1, title: 'Développement', guide: '', nonum: false, notes: 'Notes dev', text: 'Texte dev' },
      { id: 's3', level: 1, title: 'Conclusion', guide: '', nonum: true, notes: 'Notes concl', text: 'Texte concl' }
    ],
    cover: { model: model, color: '#0F6B5B', header: 'UNIVERSITÉ TEST\n*******\nDÉPARTEMENT INFO', banner: banner, etiquettes: false },
    sources: [],
    citeStyle: 'apa',
    research: false,
    tocMode: 'simple',
    partPageBreak: false,
    figs: {},
    logos: { ecole: null, entreprise: null },
    customText: '',
    modeInfo: {
      name: 'Rapport de stage',
      docTitle: 'Rapport de stage',
      coverTitle: 'RAPPORT DE STAGE',
      presentedBefore: 2600,
      logoEntreprise: true,
      coverLines: [
        ['Stage effectué à : Entreprise Test', 28, false, 240, 120],
        ['Durée : 3 mois', 26, false, 0, 120]
      ],
      fileBase: function(P) { return 'rapport-de-stage-' + P.entreprise; }
    }
  };
}

function makeExposeState(model, banner) {
  return {
    profile: { nom: 'MARTIN Sophie', ecole: 'Lycée Test', filiere: 'Terminale S', entreprise: '', duree: '', missions: '', sujet: 'Énergie solaire', matiere: 'Physique', enseignant: 'M. Durand', departement: '', numTheme: '12', numGroupe: '', titreRapport: '', niveau: 'lycee', pages: '20', membres: ['MARTIN Sophie'] },
    mode: 'expose',
    sections: [
      { id: 's1', level: 1, title: 'Introduction', guide: '', nonum: true, notes: '', text: '' },
      { id: 's2', level: 1, title: 'Développement', guide: '', nonum: false, notes: '', text: '' }
    ],
    cover: { model: model, color: '#0F6B5B', header: '', banner: banner, etiquettes: false },
    sources: [],
    citeStyle: 'apa',
    research: false,
    tocMode: 'simple',
    partPageBreak: false,
    figs: {},
    logos: { ecole: null, entreprise: null },
    customText: '',
    modeInfo: {
      name: 'Exposé',
      docTitle: 'Exposé',
      coverTitle: 'EXPOSÉ',
      presentedBefore: 2600,
      logoEntreprise: false,
      coverLines: [],
      fileBase: function(P) { return 'expose-' + P.sujet; }
    }
  };
}

function makePalmiersState(model, banner) {
  return {
    profile: { nom: 'DUPONT Jean', ecole: 'Université Test', filiere: 'Informatique', entreprise: 'Entreprise Test', duree: '3 mois', missions: 'Stage de fin d\'études', sujet: '', matiere: '', enseignant: '', departement: '', numTheme: '', numGroupe: '', titreRapport: '', niveau: 'master', pages: '30', membres: ['DUPONT Jean'] },
    mode: 'stage',
    sections: [
      { id: 's1', level: 1, title: 'Introduction', guide: '', nonum: true, notes: '', text: '' },
      { id: 's2', level: 1, title: 'Développement', guide: '', nonum: false, notes: '', text: '' },
      { id: 's3', level: 1, title: 'Conclusion', guide: '', nonum: true, notes: '', text: '' }
    ],
    cover: { model: model, color: '#0F6B5B', header: '', banner: banner, etiquettes: false },
    sources: [],
    citeStyle: 'apa',
    research: false,
    tocMode: 'simple',
    partPageBreak: false,
    figs: {},
    logos: { ecole: null, entreprise: null },
    customText: '',
    modeInfo: {
      name: 'Rapport de stage',
      docTitle: 'Rapport de stage',
      coverTitle: 'RAPPORT DE STAGE',
      presentedBefore: 2600,
      logoEntreprise: true,
      coverLines: [
        ['Stage effectué à : Entreprise Test', 28, false, 240, 120],
        ['Durée : 3 mois', 26, false, 0, 120]
      ],
      fileBase: function(P) { return 'rapport-de-stage-' + P.entreprise; }
    }
  };
}

const MODELS = ['officiel', 'cadre', 'moderne', 'sobre', 'aucune'];
const BANNERS = ['ruban', 'bandeau', 'encadre', 'double', 'lignes'];

test('Parité aperçu/Word : modèle officiel, bannière ruban', { skip: !JSDOM }, () => {
  const w = boot();
  const state = makeStageState('officiel', 'ruban');
  const doc = w.AppExport.buildDocument(w.docx, state, { logos: { ecole: null, entreprise: null }, figs: {} });
  assert.ok(doc);
});

MODELS.forEach(model => {
  BANNERS.forEach(banner => {
    test(`Parité aperçu/Word : modèle ${model}, bannière ${banner}`, { skip: !JSDOM }, () => {
      const w = boot();
      const state = makeStageState(model, banner);
      const doc = w.AppExport.buildDocument(w.docx, state, { logos: { ecole: null, entreprise: null }, figs: {} });
      assert.ok(doc, `Document généré pour ${model}/${banner}`);
    });
  });
});

test('Mode exposé : nom affiché sous "Présenté par"', { skip: !JSDOM }, () => {
  const w = boot();
  const state = makeExposeState('officiel', 'ruban');
  const doc = w.AppExport.buildDocument(w.docx, state, { logos: { ecole: null, entreprise: null }, figs: {} });
  assert.ok(doc, 'Document généré pour mode exposé');
});

test('Modèle Palmiers stage : nom sous "Rédigé par"', { skip: !JSDOM }, () => {
  const w = boot();
  const state = makePalmiersState('univ-ruban-vert', 'ruban');
  const doc = w.AppExport.buildDocument(w.docx, state, { logos: { ecole: null, entreprise: null }, figs: {} });
  assert.ok(doc, 'Document généré pour modèle Palmiers');
});