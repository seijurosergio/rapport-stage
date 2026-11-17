(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AppCoverData = factory();
  }
})(this, function () {
  'use strict';

  const NONUM = /^(introduction|conclusion|remerciements|r[ée]sum[ée]|sommaire|bibliographie|annexes?|avant-propos|d[ée]dicace)/i;


  /* Mots courants sans accent : corrigés à l'affichage (la saisie n'est jamais modifiée). */
  const ACCENTS = {
    electrotechnique: 'électrotechnique', electrique: 'électrique', electriques: 'électriques', electronique: 'électronique',
    electricite: 'électricité', energie: 'énergie', energies: 'énergies', genie: 'génie', ecole: 'école', universite: 'université',
    systeme: 'système', systemes: 'systèmes', reseau: 'réseau', reseaux: 'réseaux', mecanique: 'mécanique',
    photovoltaique: 'photovoltaïque', ingenierie: 'ingénierie', telecommunications: 'télécommunications',
    batiment: 'bâtiment', securite: 'sécurité', qualite: 'qualité', comptabilite: 'comptabilité', economie: 'économie',
    mathematiques: 'mathématiques', eolienne: 'éolienne', eolien: 'éolien', developpement: 'développement',
    regulation: 'régulation', etudes: 'études', annee: 'année', academique: 'académique', theme: 'thème',
    matiere: 'matière', filiere: 'filière', departement: 'département', specialite: 'spécialité', premiere: 'première',
    deuxieme: 'deuxième', troisieme: 'troisième', terminale: 'terminale', hydroelectrique: 'hydroélectrique', thermique: 'thermique'
  };
  const HONORIFICS = { dr: 'Dr', pr: 'Pr', prof: 'Prof', ing: 'Ing.', mme: 'Mme', mlle: 'Mlle', m: 'M.', mr: 'M.' };

  function squeeze(t) { return String(t == null ? '' : t).replace(/\s+/g, ' ').trim(); }
  function fixAccents(t) {
    return String(t).replace(/[A-Za-zÀ-ÿ]+/g, function (w) {
      const low = w.toLowerCase();
      if (!Object.prototype.hasOwnProperty.call(ACCENTS, low)) return w;
      const r = ACCENTS[low];
      if (w === w.toUpperCase() && w.length > 1) return r.toUpperCase();
      return w.charAt(0) === w.charAt(0).toUpperCase() ? r.charAt(0).toUpperCase() + r.slice(1) : r;
    });
  }
  function capFirst(t) { return t ? t.charAt(0).toLocaleUpperCase('fr') + t.slice(1) : t; }
  function cleanText(t) { return capFirst(fixAccents(squeeze(t))); }
  function titleCaseName(t) {
    return squeeze(t).split(' ').map(function (w) {
      const low = w.toLowerCase().replace(/\.$/, '');
      if (Object.prototype.hasOwnProperty.call(HONORIFICS, low)) return HONORIFICS[low];
      if (w.length > 1 && w === w.toUpperCase()) return w;
      return w.split(/([-'’])/).map(function (x) { return /^[-'’]$/.test(x) ? x : x.charAt(0).toLocaleUpperCase('fr') + x.slice(1).toLocaleLowerCase('fr'); }).join('');
    }).join(' ');
  }
  /* Copie du profil prête à être affichée (aperçu et Word) : espaces nettoyés, majuscules, accents courants. */
  function normalizeProfile(profile) {
    const P = Object.assign({}, profile);
    ['ecole', 'filiere', 'departement', 'matiere', 'entreprise', 'sujet', 'titreRapport', 'duree'].forEach(function (k) { P[k] = cleanText(P[k]); });
    ['nom', 'enseignant'].forEach(function (k) { P[k] = titleCaseName(P[k]); });
    P.membres = (profile.membres || []).map(titleCaseName);
    return P;
  }

  function cat(profile) {
    const n = profile.niveau;
    return n === 'lycee' ? 'lycee' : n === 'pro' ? 'pro' : 'univ';
  }

  function members(profile) {
    const m = (profile.membres || []).map(function (x) { return String(x || '').trim(); }).filter(Boolean);
    return m;
  }

  function officialCover(profile, cover, mode) {
    const c = cover;
    const P = normalizeProfile(profile);
    const ex = mode === 'expose';
    const head = String(c.header || '').split(/\r?\n/).map(function (t) { return t.trim(); }).filter(Boolean).map(function (t, k) {
      const star = /^[*•]{2,}$/.test(t);
      return { t: star ? '*******' : t, star: star, bold: !star && (k === 0 || (c.etiquettes && k >= 4)), color: c.etiquettes && !star && (k === 0 || k === 2) ? c.headColor : undefined };
    });
    const top = [], rest = head.slice();
    if (rest.length) { top.push(rest.shift()); if (rest.length && rest[0].star) top.push(rest.shift()); }
    const lines = [], et = !!c.etiquettes, lc = c.labelColor || '#2E75B6';
    function lab(t) { return { t: t, color: lc, ul: true }; }
    if (et) {
      if (P.ecole) { lines.push({ t: P.ecole.toUpperCase(), bold: true }); lines.push({ t: '*******', star: true }); }
      if (P.departement) lines.push({ segs: [lab('Département : '), { t: P.departement, b: true }], left: true });
      const fl = (cat(P) === 'lycee' ? 'Classe : ' : 'Spécialité : ');
      if (P.filiere || P.annee) lines.push({ row: [P.filiere ? [lab(fl), { t: P.filiere }] : [], P.annee ? [lab("Années d'études : "), { t: P.annee }] : []] });
      if (ex && P.matiere) lines.push({ segs: [{ t: P.matiere.toUpperCase(), color: lc, b: true, i: true }], big: true });
    } else if (P.ecole) { lines.push({ t: P.ecole.toUpperCase(), bold: true, big: true }); lines.push({ t: '*******', star: true }); }
    if (!et && P.departement) lines.push({ t: P.departement, ul: true });
    if (!et && P.filiere) lines.push({ t: (/^(fili|class)/i.test(P.filiere) ? '' : (cat(P) === 'lycee' ? 'Classe : ' : 'Filière : ')) + P.filiere });
    if (!et && ex && P.matiere) { if (lines.length) lines.push({ t: '*******', star: true }); lines.push({ t: 'UE : ' + P.matiere, ul: true }); }
    if (!et && !ex && P.entreprise) { if (lines.length) lines.push({ t: '*******', star: true }); lines.push({ t: 'Entreprise : ' + P.entreprise, ul: true }); }
    const banner = [];
    if (ex) {
      if (P.numTheme) banner.push({ t: 'THÈME : ' + P.numTheme });
      if (P.sujet) banner.push({ t: P.sujet.toLocaleUpperCase('fr') });
      if (!banner.length) banner.push({ t: 'EXPOSÉ', bold: true });
    } else {
      banner.push({ t: (P.titreRapport || '').trim() || 'RAPPORT DE STAGE', bold: true });
    }
    if (et && !ex && P.entreprise) lines.push({ segs: [lab('Entreprise : '), { t: P.entreprise }], left: true });
    const after = !ex && P.duree ? [{ t: 'Période de stage : ' + P.duree, ul: true }] : [];
    const names = ex ? members(P) : (P.nom ? [P.nom] : members(P));
    const left = { title: ex ? (names.length > 1 ? 'Membre du Groupe' + (P.numGroupe ? ' ' + P.numGroupe : '') : 'Présenté par') + ' :' : 'Rédigé par :', names: names, numbered: names.length > 1, color: et ? lc : undefined };
    const right = String(P.enseignant || '').trim() ? { title: ex ? (et ? 'Sous la direction de :' : 'Par la Supervision de :') : 'Supervisé par :', name: String(P.enseignant).trim(), color: et ? lc : undefined } : null;
    return { top: top, rest: rest, lines: lines, banner: banner, after: after, left: left, right: right, year: P.annee ? 'Année académique : ' + P.annee : '', yearSegs: et && P.annee ? [lab('Année Académique : '), { t: P.annee }] : null };
  }

  return {
    officialCover,
    cat,
    members,
    normalizeProfile,
    titleCaseName,
    fixAccents,
    NONUM
  };
});