// Parité aperçu du site / Word : chaque ligne affichée dans l'aperçu doit se retrouver dans la page de garde du Word,
// et les couleurs du ruban de l'aperçu doivent être celles du Word.
const test = require('node:test');
const assert = require('node:assert');
const { openPage, readDocx, squash } = require('./_page');

function previewLines(w) {
  const root = w.document.querySelector('#cover-prev');
  return Array.from(root.querySelectorAll('.o-l, .o-row, .o-yr, .cp-s, .cp-t, .cp-band, .cp-m'))
    .map(function (e) { return e.textContent; }).filter(function (t) { return t.replace(/[\s*]/g, '').length > 0; });
}

for (const mode of ['expose', 'stage']) {
  test('Parité ' + mode + ' : tous les textes de l\'aperçu se retrouvent dans le Word (20 modèles)', async () => {
    const page = await openPage();
    await page.fill(mode);
    for (const tpl of page.w.COVER_TEMPLATES) {
      await page.pickTemplate(tpl);
      const lines = previewLines(page.w);
      assert.ok(lines.length >= (tpl.model === 'officiel' ? 5 : 3), tpl.id + ' : aperçu presque vide (' + lines.length + ' lignes)');
      const doc = await readDocx(await page.download());
      const word = squash(doc.coverText);
      lines.forEach(function (l) { assert.ok(word.includes(squash(l)), tpl.id + ' (' + mode + ') : "' + l.trim() + '" est dans l\'aperçu mais pas dans le Word'); });
    }
  });

  test('Parité ' + mode + ' : modèles cadre, moderne et sobre', async () => {
    const page = await openPage();
    await page.fill(mode);
    for (const model of ['cadre', 'moderne', 'sobre']) {
      page.click('[data-action="coverCat"][data-cat="univ"]');
      page.pick('[data-cover="model"][value="' + model + '"]');
      const lines = previewLines(page.w);
      assert.ok(lines.length >= 3, model + ' : aperçu presque vide');
      const doc = await readDocx(await page.download());
      const word = squash(doc.coverText);
      lines.forEach(function (l) { assert.ok(word.includes(squash(l)), model + ' (' + mode + ') : "' + l.trim() + '" absent du Word'); });
    }
  });
}

test('Ruban : mêmes couleurs dans l\'aperçu et dans le Word (avec le #, sinon le navigateur les ignore)', async () => {
  const page = await openPage();
  await page.fill('expose');
  await page.pickTemplate(page.w.COVER_TEMPLATES.find(function (t) { return t.id === 'univ-ruban-vert'; }));
  const style = page.w.document.querySelector('#cover-prev .cpo').getAttribute('style');
  const get = function (v) { return (style.match(new RegExp('--' + v + ':(#[0-9A-Fa-f]{6})')) || [])[1]; };
  const accent = get('cc'), light = get('cc-light'), txt = get('ct');
  assert.ok(accent && light && txt, 'variables CSS du ruban absentes ou sans # : ' + style);
  const doc = await readDocx(await page.download());
  // couleurs de l'image du ruban (palette PNG : 1 = teinte claire, 5 = couleur d'accent)
  const name = Object.keys(doc.zip.files).find(function (n) { return /^word\/media\/.*\.png$/.test(n); });
  const png = await doc.zip.file(name).async('nodebuffer');
  const at = png.indexOf('PLTE');
  const hex = function (i) { return [0, 1, 2].map(function (k) { return ('0' + png[at + 4 + i * 3 + k].toString(16)).slice(-2); }).join(''); };
  assert.strictEqual(hex(5), accent.slice(1).toLowerCase(), 'couleur du ruban différente entre aperçu et Word');
  assert.strictEqual(hex(1), light.slice(1).toLowerCase(), 'teinte des bouts différente entre aperçu et Word');
  const p = doc.paragraphs.find(function (q) { return q.text.trim() === 'THÈME : 8'; });
  assert.strictEqual((p.xml.match(/<w:color w:val="([0-9A-Fa-f]{6})"/) || [])[1].toLowerCase(), txt.slice(1).toLowerCase(), 'couleur du texte différente');
});

test('Mode stage : le nom saisi apparaît sous « Rédigé par » (y compris avec le modèle Palmiers)', async () => {
  const page = await openPage();
  await page.fill('stage');
  for (const id of ['etiq-palmiers', 'univ-ruban-vert']) {
    await page.pickTemplate(page.w.COVER_TEMPLATES.find(function (t) { return t.id === id; }));
    const doc = await readDocx(await page.download());
    assert.ok(/Rédigé par/.test(doc.coverText) && /Test Utilisateur/.test(doc.coverText), id + ' : nom absent');
  }
});
