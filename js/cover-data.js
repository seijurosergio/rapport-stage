(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AppCoverData = factory();
  }
})(this, function () {
  'use strict';

  const NONUM = /^(introduction|conclusion|remerciements|r[ée]sum[ée]|sommaire|bibliographie|annexes?|avant-propos|d[ée]dicace)/i;

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
    const P = profile;
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
      const fl = (cat(profile) === 'lycee' ? 'Classe : ' : 'Spécialité : ');
      if (P.filiere || P.annee) lines.push({ row: [P.filiere ? [lab(fl), { t: P.filiere }] : [], P.annee ? [lab("Années d'études : "), { t: P.annee }] : []] });
      if (ex && P.matiere) lines.push({ segs: [{ t: P.matiere.toUpperCase(), color: lc, b: true, i: true }], big: true });
    } else if (P.ecole) { lines.push({ t: P.ecole.toUpperCase(), bold: true, big: true }); lines.push({ t: '*******', star: true }); }
    if (!et && P.departement) lines.push({ t: P.departement, ul: true });
    if (!et && P.filiere) lines.push({ t: (/^(fili|class)/i.test(P.filiere) ? '' : (cat(profile) === 'lycee' ? 'Classe : ' : 'Filière : ')) + P.filiere });
    if (!et && ex && P.matiere) { if (lines.length) lines.push({ t: '*******', star: true }); lines.push({ t: 'UE : ' + P.matiere, ul: true }); }
    if (!et && !ex && P.entreprise) { if (lines.length) lines.push({ t: '*******', star: true }); lines.push({ t: 'Entreprise : ' + P.entreprise, ul: true }); }
    const banner = [];
    if (ex) {
      if (P.numTheme) banner.push({ t: 'THÈME : ' + P.numTheme });
      if (P.sujet) banner.push({ t: P.sujet });
      if (!banner.length) banner.push({ t: 'EXPOSÉ', bold: true });
    } else {
      banner.push({ t: (P.titreRapport || '').trim() || 'RAPPORT DE STAGE', bold: true });
    }
    if (et && !ex && P.entreprise) lines.push({ segs: [lab('Entreprise : '), { t: P.entreprise }], left: true });
    const after = !ex && P.duree ? [{ t: 'Période de stage : ' + P.duree, ul: true }] : [];
    const names = members(profile);
    const left = { title: ex ? (names.length > 1 ? 'Membre du Groupe' + (P.numGroupe ? ' ' + P.numGroupe : '') : 'Présenté par') + ' :' : 'Rédigé par :', names: names, numbered: names.length > 1, color: et ? lc : undefined };
    const right = String(P.enseignant || '').trim() ? { title: ex ? (et ? 'Sous la direction de :' : 'Par la Supervision de :') : 'Supervisé par :', name: String(P.enseignant).trim(), color: et ? lc : undefined } : null;
    return { top: top, rest: rest, lines: lines, banner: banner, after: after, left: left, right: right, year: P.annee ? 'Année académique : ' + P.annee : '', yearSegs: et && P.annee ? [lab('Année Académique : '), { t: P.annee }] : null };
  }

  return {
    officialCover,
    cat,
    members,
    NONUM
  };
});