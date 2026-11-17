const test = require('node:test');
const assert = require('node:assert');
const C = require('../js/cover-data.js');

test('normalizeProfile : noms, accents, majuscules (sans modifier l\'original)', () => {
  const src = { nom: 'kiki  sourou', enseignant: 'dr dupont', filiere: 'electrotechnique', matiere: 'energie solaire', sujet: 'energie solaire',
    membres: ['kiki sourou', 'KINSY Sergio', "jean-pierre o'neil"] };
  const copy = JSON.stringify(src);
  const P = C.normalizeProfile(src);
  assert.strictEqual(P.nom, 'Kiki Sourou');
  assert.strictEqual(P.enseignant, 'Dr Dupont');
  assert.strictEqual(P.filiere, 'Électrotechnique');
  assert.strictEqual(P.sujet, 'Énergie solaire');
  assert.deepStrictEqual(P.membres, ['Kiki Sourou', 'KINSY Sergio', "Jean-Pierre O'Neil"]);
  assert.strictEqual(JSON.stringify(src), copy, 'la saisie a été modifiée');
});

test('officialCover exposé : bannière THÈME + sujet en majuscules, membres', () => {
  const o = C.officialCover({ sujet: 'energie solaire', numTheme: '8', membres: ['a b', 'c d'], numGroupe: '3' }, { header: '', banner: 'ruban', color: '#0F6B5B' }, 'expose');
  assert.deepStrictEqual(o.banner.map(function (b) { return b.t; }), ['THÈME : 8', 'ÉNERGIE SOLAIRE']);
  assert.deepStrictEqual(o.left.names, ['A B', 'C D']);
});

test('officialCover stage : le nom vient du champ nom (pas des membres vides)', () => {
  const o = C.officialCover({ nom: 'test utilisateur', entreprise: 'sbee', membres: [''] }, { header: '', banner: 'ruban', color: '#0F6B5B' }, 'stage');
  assert.deepStrictEqual(o.left.names, ['Test Utilisateur']);
  assert.strictEqual(o.left.title, 'Rédigé par :');
});
