// Aide pour les tests : ouvre la VRAIE page (index.html avec tous ses scripts) dans jsdom, remplit un parcours
// et clique sur « Télécharger ». jsdom ne sait pas compresser un Blob : seule l'étape de compression du zip est
// remplacée par celle de Node (Packer.toBuffer) ; tout le reste (app.js, modules, modèles) est le vrai code.
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const JSZip = require('jszip');
const nodeDocx = require('docx');

const ROOT = path.join(__dirname, '..');
const wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

async function openPage() {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('error', function (...a) { const s = a.map(String).join(' '); if (!/Could not load|Not implemented|getContext/.test(s)) errors.push(s); });
  vc.on('jsdomError', function (e) { const s = String(e && (e.stack || e.message)); if (!/Could not load|Not implemented/.test(s)) errors.push(s); });
  const dom = await JSDOM.fromFile(path.join(ROOT, 'index.html'), { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc });
  const w = dom.window;
  w.scrollTo = function () {};
  w.fetch = function () { return Promise.resolve({ json: function () { return Promise.resolve({ enabled: false, price: 0 }); } }); };
  let last = null;
  w.URL.createObjectURL = function (b) { last = b; return 'blob:test'; };
  w.URL.revokeObjectURL = function () {};
  for (let i = 0; i < 50 && !(w.AppExport && w.docx && w.COVER_TEMPLATES); i++) await wait(100);
  if (!(w.AppExport && w.docx && w.COVER_TEMPLATES)) throw new Error('La page ne s\'est pas chargée : ' + errors.join(' | ').slice(0, 300));
  w.docx.Packer.toBlob = async function (d) { return new w.Blob([await nodeDocx.Packer.toBuffer(d)]); };

  const page = {
    w: w, errors: errors,
    click: function (sel) { const e = w.document.querySelector(sel); if (!e) throw new Error('introuvable : ' + sel); e.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); },
    type: function (sel, v) { const e = w.document.querySelector(sel); if (!e) throw new Error('introuvable : ' + sel); e.value = v; e.dispatchEvent(new w.Event('input', { bubbles: true })); },
    // Choix d'un bouton radio : le site écoute l'événement « input »
    pick: function (sel) { const e = w.document.querySelector(sel); if (!e) throw new Error('introuvable : ' + sel); e.checked = true; e.dispatchEvent(new w.Event('input', { bubbles: true })); },
    change: function (sel, v) { const e = w.document.querySelector(sel); if (!e) throw new Error('introuvable : ' + sel); if ('checked' in e && e.type === 'checkbox') e.checked = v; else e.value = v; e.dispatchEvent(new w.Event('change', { bubbles: true })); },
    // Remplit un parcours complet jusqu'à l'étape 3
    async fill(mode) {
      page.click('[data-action="open"][data-mode="' + mode + '"]');
      if (mode === 'expose') {
        page.type('#m-0', 'test utilisateur'); page.type('#f-sujet', 'energie solaire'); page.type('#f-numTheme', '8');
        page.type('#f-matiere', 'energie solaire'); page.type('#f-enseignant', 'dr dupont'); page.type('#f-filiere', 'electrotechnique');
      } else {
        page.type('#f-nom', 'test utilisateur'); page.type('#f-entreprise', 'SBEE'); page.type('#f-filiere', 'electrotechnique');
      }
      page.type('#f-ecole', 'UCAO UUC'); page.type('#f-annee', '2026-2027');
      page.click('[data-action="next1"]'); page.click('[data-action="to3"]');
      w.document.querySelectorAll('textarea[data-sid]').forEach(function (t, i) {
        t.value = 'Texte de la partie ' + (i + 1) + ' assez long pour le test.\n\nSecond paragraphe de la partie ' + (i + 1) + '.';
        t.dispatchEvent(new w.Event('input', { bubbles: true }));
      });
      await wait(50);
    },
    async pickTemplate(tpl) {
      const cat = tpl.cats[0];
      page.click('[data-action="coverCat"][data-cat="' + cat + '"]'); await wait(20);
      page.click('[data-action="pickCover"][data-tid="' + tpl.id + '"]'); await wait(20);
    },
    // Clique sur « Télécharger » et renvoie le contenu du .docx (Buffer)
    async download() {
      last = null;
      page.click('[data-action="download"]');
      for (let i = 0; i < 100 && !last; i++) await wait(50);
      if (!last) throw new Error('Aucun fichier produit. Erreurs : ' + errors.join(' | ').slice(0, 300));
      return Buffer.from(await last.arrayBuffer());
    }
  };
  return page;
}

const decode = function (t) { return t.replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'); };

// Lit un .docx : { xml, settings, paragraphs[], coverText }
async function readDocx(buf) {
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml').async('string');
  const settings = zip.file('word/settings.xml') ? await zip.file('word/settings.xml').async('string') : '';
  const paragraphs = (xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || []).map(function (p) {
    return { xml: p, text: (p.match(/<w:t[^>]*>[^<]*<\/w:t>/g) || []).map(function (t) { return decode(t.replace(/<[^>]+>/g, '')); }).join('') };
  });
  const iSom = paragraphs.findIndex(function (p) { return p.text.trim() === 'SOMMAIRE'; });
  const coverText = paragraphs.slice(0, iSom < 0 ? paragraphs.length : iSom).map(function (p) { return p.text; }).join(' ');
  const tables = xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/g) || [];
  return { zip: zip, xml: xml, settings: settings, paragraphs: paragraphs, coverText: coverText, tables: tables };
}
const squash = function (t) { return String(t).replace(/\s+/g, '').toLowerCase(); };
const textOf = function (xml) { return (xml.match(/<w:t[^>]*>[^<]*<\/w:t>/g) || []).map(function (t) { return decode(t.replace(/<[^>]+>/g, '')); }).join(''); };

module.exports = { openPage, readDocx, squash, textOf, wait, ROOT };
