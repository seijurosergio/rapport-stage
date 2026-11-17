// Vrai test de bout en bout : la vraie page, un parcours complet, un clic sur « Télécharger », puis lecture du Word.
// 20 modèles de page de garde x 2 modes. Aucun test ignoré.
const test = require('node:test');
const assert = require('node:assert');
const { openPage, readDocx, squash } = require('./_page');

// Seuls les cadres voulus (styles de bannière « encadré » et « double cadre », un tableau d'une cellule) ont une bordure.
function checkNoVisibleBorders(doc, label, tpl) {
  doc.tables.forEach(function (t, i) {
    const wantedBox = tpl && (tpl.banner === 'encadre' || tpl.banner === 'double') && (t.match(/<w:tc>/g) || []).length === 1;
    if (wantedBox) return;
    const tblBorders = (t.match(/<w:tblBorders>[\s\S]*?<\/w:tblBorders>/) || [''])[0];
    assert.ok(tblBorders, label + ' : tableau ' + i + ' sans tblBorders (bordures par défaut visibles)');
    (tblBorders.match(/w:val="[^"]*"/g) || []).forEach(function (v) { assert.match(v, /none|nil/, label + ' : bordure visible dans le tableau ' + i); });
    (t.match(/<w:tcBorders>[\s\S]*?<\/w:tcBorders>/g) || []).forEach(function (b) {
      (b.match(/w:val="[^"]*"/g) || []).forEach(function (v) { assert.match(v, /none|nil/, label + ' : bordure de cellule visible'); });
    });
  });
}

for (const mode of ['expose', 'stage']) {
  test('E2E ' + mode + ' : les 20 modèles produisent un Word correct (texte, bannière, tableaux)', async () => {
    const page = await openPage();
    await page.fill(mode);
    const templates = page.w.COVER_TEMPLATES;
    assert.ok(templates.length >= 20, 'modèles chargés : ' + templates.length);
    for (const tpl of templates) {
      await page.pickTemplate(tpl);
      const buf = await page.download();
      assert.strictEqual(buf.slice(0, 2).toString(), 'PK', tpl.id + ' : pas un fichier zip');
      const doc = await readDocx(buf);
      const cover = squash(doc.coverText);
      const has = function (t) { assert.ok(cover.includes(squash(t)), tpl.id + ' (' + mode + ') : "' + t + '" absent de la page de garde. Texte : ' + doc.coverText.slice(0, 400)); };
      if (tpl.model === 'officiel') {
        if (mode === 'expose') {
          has('THÈME : 8'); has('ÉNERGIE SOLAIRE'); has('Présenté par'); has('Test Utilisateur'); has('Dr Dupont'); has('2026-2027');
          assert.ok(!/RAPPORT DE STAGE/.test(doc.coverText), tpl.id + ' : "RAPPORT DE STAGE" sur un exposé');
        } else {
          has('RAPPORT DE STAGE'); has('Rédigé par'); has('Test Utilisateur'); has('SBEE'); has('2026-2027');
        }
      } else if (mode === 'expose') {
        has('EXPOSÉ'); has('Énergie solaire'); has('Présenté par'); has('Test Utilisateur'); has('Dr Dupont'); has('2026-2027');
      } else {
        has('RAPPORT DE STAGE'); has('Présenté par'); has('Test Utilisateur'); has('SBEE'); has('2026-2027');
      }
      checkNoVisibleBorders(doc, tpl.id, tpl);
      if (tpl.banner === 'ruban' && tpl.model === 'officiel') {
        assert.strictEqual(doc.tables.length, 0, tpl.id + ' : la page de garde ne doit contenir aucun tableau (donc aucune bordure possible)');
        assert.ok(/<wp:anchor[^>]*behindDoc="1"/.test(doc.xml), tpl.id + ' : image du ruban non placée derrière le texte');
        const media = Object.keys(doc.zip.files).filter(function (n) { return /^word\/media\/.*\.png$/.test(n); });
        assert.ok(media.length >= 1, tpl.id + ' : image du ruban absente');
        (mode === 'expose' ? ['THÈME : 8', 'ÉNERGIE SOLAIRE'] : ['RAPPORT DE STAGE']).forEach(function (l) {
          assert.ok(doc.paragraphs.some(function (p) { return p.text.trim() === l; }), tpl.id + ' : ligne du ruban "' + l + '" absente (une ligne = un paragraphe)');
        });
      }
    }
    assert.deepStrictEqual(page.errors.filter(function (e) { return /Erreur export|TypeError|ReferenceError/.test(e); }), [], 'erreurs dans la page');
  });
}

test('Sommaire simple : liens internes vers des signets, sans points de conduite ni numéro de page inventé', async () => {
  const page = await openPage();
  await page.fill('expose');
  const doc = await readDocx(await page.download());
  const n = page.w.document.querySelectorAll('textarea[data-sid]').length;
  for (let i = 0; i < n; i++) {
    assert.ok(doc.xml.includes('w:anchor="sec_' + i + '"'), 'lien vers sec_' + i + ' absent');
    assert.ok(new RegExp('<w:bookmarkStart[^>]*w:name="sec_' + i + '"').test(doc.xml), 'signet sec_' + i + ' absent');
  }
  assert.ok(!/instrText[^>]*>\s*TOC /.test(doc.xml), 'champ TOC présent en mode simple');
  assert.ok(!/w:leader=/.test(doc.xml), 'points de conduite présents');
  assert.ok(!/<w:updateFields\/>|<w:updateFields w:val="(true|1)"/.test(doc.settings), 'updateFields actif en mode simple (question inutile à l\'ouverture)');
  const som = doc.paragraphs.findIndex(function (p) { return p.text.trim() === 'SOMMAIRE'; });
  const entries = doc.paragraphs.slice(som + 1, som + 1 + n).map(function (p) { return p.text; });
  assert.ok(entries.every(function (t) { return !/\d+\s*$/.test(t.replace(/^[IVX]+\.\s*|^\d+\.\s*/, '')); }), 'numéro de page affiché');
  assert.ok(entries.some(function (t) { return /INTRODUCTION/.test(t); }) && entries.some(function (t) { return /CONCLUSION/.test(t); }));
});

test('Sommaire automatique : champ TOC et mise à jour des champs', async () => {
  const page = await openPage();
  await page.fill('stage');
  page.change('[data-tocmode]', 'auto');
  const doc = await readDocx(await page.download());
  assert.ok(/instrText[^>]*>\s*TOC [^<]*\\o/.test(doc.xml), 'champ TOC absent en mode automatique');
  assert.ok(/<w:updateFields\/>/.test(doc.settings), 'updateFields absent en mode automatique');
});

test('Sauts de page : introduction, conclusion et sources sur une nouvelle page ; option « chaque partie »', async () => {
  const page = await openPage();
  await page.fill('expose');
  const heads = function (doc) { return doc.paragraphs.filter(function (p) { return /w:pStyle w:val="Heading1"/.test(p.xml); }); };
  let doc = await readDocx(await page.download());
  const h1 = heads(doc);
  const find = function (re) { return h1.find(function (p) { return re.test(p.text); }); };
  assert.ok(/pageBreakBefore/.test(find(/INTRODUCTION/).xml), 'introduction sans saut de page');
  assert.ok(/pageBreakBefore/.test(find(/CONCLUSION/).xml), 'conclusion sans saut de page');
  assert.ok(!/pageBreakBefore/.test(find(/DÉFINITIONS/).xml), 'saut de page inattendu avant une partie ordinaire');
  page.change('[data-partpagebreak]', true);
  doc = await readDocx(await page.download());
  heads(doc).forEach(function (p) { assert.ok(/pageBreakBefore/.test(p.xml), 'option « chaque partie sur une page » ignorée : ' + p.text); });
  // aucun paragraphe vide servant de saut de page
  assert.ok(!/<w:br w:type="page"/.test(doc.xml), 'saut de page manuel (risque de page vide)');
});
