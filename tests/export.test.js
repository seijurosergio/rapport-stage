// Tests pour l'export Word (docx) - vérifie la structure du document généré
// Lancer : node --test tests/export.test.js
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
  // Exposer docx sur window pour les tests
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

function makeProject(w, overrides = {}) {
  return {
    mode: 'stage',
    profile: { nom: 'Test', ecole: 'École', filiere: 'Filière', entreprise: 'Entreprise', duree: '1 semaine', missions: 'Test', sujet: 'Sujet', matiere: '', enseignant: '', departement: '', numTheme: '', numGroupe: '', titreRapport: '', niveau: 'licence', pages: '10', membres: ['Test'] },
    sections: [
      { id: 's1', level: 1, title: 'Introduction', guide: '', nonum: true, notes: 'Notes intro', text: 'Texte intro' },
      { id: 's2', level: 1, title: 'Partie 1', guide: '', nonum: false, notes: 'Notes 1', text: 'Texte 1' },
      { id: 's3', level: 2, title: 'Sous-partie', guide: '', nonum: false, notes: 'Notes 2', text: 'Texte 2' }
    ],
    cover: { model: 'officiel', color: '#0F6B5B', header: '', banner: 'ruban', etiquettes: false },
    sources: [],
    citeStyle: 'apa',
    M: function() {
      return {
        name: 'Rapport de stage',
        docTitle: 'Rapport de stage',
        coverTitle: 'RAPPORT DE STAGE',
        presentedBefore: 2600,
        logoEntreprise: true,
        coverLines: function(P) {
          const o = [];
          if (P.entreprise) o.push(['Stage effectué à : ' + P.entreprise, 28, false, 240, 120]);
          if (P.duree) o.push(['Durée : ' + P.duree, 26, false, 0, 120]);
          return o;
        }
      };
    }
  };
}

function makeAssets() {
  return {
    logos: { ecole: null, entreprise: null },
    figs: {}
  };
}

test('LeaderType.DOT existe dans docx (pas TabStopLeader)', { skip: !JSDOM }, () => {
  const w = boot();
  assert.ok(typeof w.docx !== 'undefined', 'docx doit être exposé');
  assert.ok(typeof w.docx.LeaderType !== 'undefined', 'LeaderType doit être exposé par docx');
  assert.strictEqual(w.docx.LeaderType.DOT, 'dot', 'LeaderType.DOT doit valoir "dot"');
});

test('AppExport.buildDocument génère un document valide', { skip: !JSDOM }, () => {
  const w = boot();
  const project = makeProject(w);
  const assets = { logos: { ecole: null, entreprise: null }, figs: {} };
  const doc = w.AppExport.buildDocument(w.docx, project, assets);
  assert.ok(doc, 'Document créé');
});

test('Sommaire statique généré (pas TableOfContents dynamique)', { skip: !JSDOM }, () => {
  const w = boot();
  const project = makeProject(w);
  project.sections = [
    { id: 's1', level: 1, title: 'Introduction', guide: '', nonum: true, notes: 'Notes', text: 'Texte' },
    { id: 's2', level: 1, title: 'Développement', guide: '', nonum: false, notes: 'Notes', text: 'Texte' }
  ];
  project.cover = { model: 'officiel', color: '#0F6B5B', header: '', banner: 'ruban', etiquettes: false };
  project.profile.niveau = 'licence';
  project.profile.pages = '10';
  const assets = { logos: { ecole: null, entreprise: null }, figs: {} };
  const doc = w.AppExport.buildDocument(w.docx, project, assets);
  assert.ok(doc, 'Document créé avec sommaire');
});

test('Tableau signature sans bordures (borders NONE)', { skip: !JSDOM }, () => {
  const w = boot();
  const project = makeProject(w);
  project.profile.enseignant = 'Prof';
  project.sections = [
    { id: 's1', level: 1, title: 'Introduction', guide: '', nonum: true, notes: 'Notes', text: 'Texte' }
  ];
  project.cover = { model: 'officiel', color: '#0F6B5B', header: '', banner: 'ruban', etiquettes: false };
  const assets = { logos: { ecole: null, entreprise: null }, figs: {} };
  const doc = w.AppExport.buildDocument(w.docx, project, assets);
  assert.ok(doc, 'Document créé avec tableau signature sans bordures');
});

test('Tableau ruban sans bordures (boxTable)', { skip: !JSDOM }, () => {
  const w = boot();
  const project = makeProject(w);
  project.cover = { model: 'officiel', color: '#0F6B5B', header: '', banner: 'bandeau', etiquettes: false };
  const assets = { logos: { ecole: null, entreprise: null }, figs: {} };
  const doc = w.AppExport.buildDocument(w.docx, project, assets);
  assert.ok(doc, 'Document créé avec bandeau sans bordures');
});

test('Intégration : AppExport disponible via window', { skip: !JSDOM }, () => {
  const w = boot();
  assert.ok(typeof w.AppExport !== 'undefined', 'AppExport doit être exposé sur window');
  assert.ok(typeof w.AppExport.buildDocument === 'function', 'buildDocument doit être une fonction');
});