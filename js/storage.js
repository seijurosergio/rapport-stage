(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AppStorage = factory();
  }
})(this, function () {
  'use strict';

  const SCHEMA_VERSION = 6;
  const KEY = 'rapport-stage-v1';
  const LOGO_KEY = 'rapport-stage-logos';
  const FIG_KEY = 'rapport-stage-figs';
  const PEND_KEY = 'rapport-stage-pending';

  function safeParse(key, defaultValue) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return defaultValue;
      return JSON.parse(raw);
    } catch (e) {
      return defaultValue;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function safeRemove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  }

  function migrateState(s) {
    if (!s || typeof s !== 'object') return null;
    if (!s.schemaVersion) s.schemaVersion = 1;
    if (s.schemaVersion === 1) {
      if (s.sections) {
        s.sections.forEach(function (x) {
          if (typeof x.notes !== 'string') {
            x.notes = x.text || '';
            x.text = '';
          }
        });
      }
      if (!s.cover || !/^(officiel|cadre|moderne|sobre|aucune)$/.test(s.cover.model) || !/^#[0-9A-Fa-f]{6}$/.test(s.cover.color || '')) {
        s.cover = { model: 'officiel', color: '#0F6B5B', header: 'RÉPUBLIQUE DU BÉNIN\n*******\nMINISTÈRE DE L\'ENSEIGNEMENT SUPÉRIEUR ET DE LA RECHERCHE SCIENTIFIQUE\n*******', banner: 'ruban' };
      }
      if (!/^(ruban|bandeau|encadre|double|lignes)$/.test(s.cover.banner)) s.cover.banner = 'ruban';
      if (!/^(apa|mla|harvard|simple)$/.test(s.citeStyle)) s.citeStyle = 'apa';
      s.research = s.research !== false;
      s.sources = Array.isArray(s.sources) ? s.sources.filter(function (x) { return typeof x === 'string' && x.trim(); }).slice(0, 60).map(function (x) { return x.slice(0, 500); }) : [];
      if (typeof s.cover.header !== 'string') s.cover.header = 'RÉPUBLIQUE DU BÉNIN\n*******\nMINISTÈRE DE L\'ENSEIGNEMENT SUPÉRIEUR ET DE LA RECHERCHE SCIENTIFIQUE\n*******';
      s.cover.header = s.cover.header.replace(/Université de ton choix \(modifie cette ligne\)\n?(\*{2,}\n?)?/, '').replace(/\n+$/, '');
      if (typeof s.cover.template !== 'string') s.cover.template = '';
      ['labelColor', 'headColor', 'bannerText', 'artColor'].forEach(function (k) { if (!/^#[0-9A-Fa-f]{6}$/.test(s.cover[k] || '')) s.cover[k] = ''; });
      if (!/^[A-Za-z0-9]{0,40}$/.test(s.cover.art || '')) s.cover.art = '';
      s.cover.etiquettes = !!s.cover.etiquettes;
      if (typeof s.profile.email !== 'string') s.profile.email = '';
      ['sujet', 'matiere', 'enseignant', 'departement', 'numTheme', 'numGroupe', 'niveau', 'pages', 'titreRapport'].forEach(function (k) { if (typeof s.profile[k] !== 'string') s.profile[k] = ''; });
      if (!/^(stage|expose)$/.test(s.mode)) s.mode = 'stage';
      if (!Array.isArray(s.profile.membres) || !s.profile.membres.length || s.profile.membres.length > 5) s.profile.membres = [String(s.profile.nom || '')];
      s.profile.membres = s.profile.membres.map(function (x) { return String(x == null ? '' : x); });
      if (!s.paid || !/^\d+$/.test(String(s.paid.id)) || !/^[0-9a-f]{12}$/.test(s.paid.nonce || '')) s.paid = null;
      s.schemaVersion = 2;
    }
    if (s.schemaVersion === 2) {
      if (!Array.isArray(s.profile.membres)) s.profile.membres = [String(s.profile.nom || '')];
      s.profile.membres = s.profile.membres.slice(0, 5).map(function (x) { return String(x == null ? '' : x); });
      if (s.sections) {
        s.sections.forEach(function (sec) {
          if (typeof sec.text !== 'string') sec.text = '';
          if (typeof sec.notes !== 'string') sec.notes = '';
        });
      }
      if (typeof s.cover.bannerText !== 'string') s.cover.bannerText = '';
      if (typeof s.cover.headColor !== 'string') s.cover.headColor = '';
      if (typeof s.cover.labelColor !== 'string') s.cover.labelColor = '';
      if (typeof s.cover.artColor !== 'string') s.cover.artColor = '';
      if (typeof s.cover.art !== 'string') s.cover.art = '';
      s.schemaVersion = 3;
    }
    if (s.schemaVersion === 3) {
      if (!Array.isArray(s.profile.membres)) s.profile.membres = [String(s.profile.nom || '')];
      s.profile.membres = s.profile.membres.slice(0, 5).map(function (x) { return String(x == null ? '' : x); });
      if (s.sections) {
        s.sections.forEach(function (sec) {
          if (typeof sec.text !== 'string') sec.text = '';
          if (typeof sec.notes !== 'string') sec.notes = '';
        });
      }
      if (typeof s.cover.bannerText !== 'string') s.cover.bannerText = '';
      if (typeof s.cover.headColor !== 'string') s.cover.headColor = '';
      if (typeof s.cover.labelColor !== 'string') s.cover.labelColor = '';
      if (typeof s.cover.artColor !== 'string') s.cover.artColor = '';
      if (typeof s.cover.art !== 'string') s.cover.art = '';
      s.schemaVersion = 4;
    }
    if (s.schemaVersion === 4) {
      if (typeof s.tocMode !== 'string' || !/^(simple|auto)$/.test(s.tocMode)) {
        s.tocMode = 'simple';
      }
      s.schemaVersion = 5;
    }
    if (s.schemaVersion === 5) {
      if (typeof s.partPageBreak !== 'boolean') {
        s.partPageBreak = false;
      }
      s.schemaVersion = 6;
    }
    return s;
  }

  function loadState() {
    const raw = safeParse(KEY, null);
    if (!raw) return null;
    return migrateState(raw);
  }

  function saveState(state) {
    const toSave = Object.assign({}, state, { schemaVersion: SCHEMA_VERSION });
    return safeSet(KEY, toSave);
  }

  function loadLogos() {
    return safeParse(LOGO_KEY, { ecole: null, entreprise: null });
  }

  function saveLogos(logos) {
    const o = {};
    ['ecole', 'entreprise'].forEach(function (k) {
      o[k] = logos[k] ? { d: toB64(logos[k].data), w: logos[k].w, h: logos[k].h } : null;
    });
    return safeSet(LOGO_KEY, o);
  }

  function loadFigsData() {
    return safeParse(FIG_KEY, {});
  }

  function saveFigsData(figs) {
    const o = {};
    Object.keys(figs).forEach(function (k) {
      o[k] = figs[k].map(function (f) { return { id: f.id, d: f.d, w: f.w, h: f.h, cap: f.cap }; });
    });
    return safeSet(FIG_KEY, o);
  }

  function loadPending() {
    return safeParse(PEND_KEY, null);
  }

  function savePending(p) {
    return safeSet(PEND_KEY, p);
  }

  function clearPendingData() {
    return safeRemove(PEND_KEY);
  }

  function toB64(u8) {
    let s = '';
    const step = 0x8000;
    for (let i = 0; i < u8.length; i += step) {
      s += String.fromCharCode.apply(null, u8.subarray(i, i + step));
    }
    return btoa(s);
  }

  return {
    SCHEMA_VERSION,
    KEY,
    LOGO_KEY,
    FIG_KEY,
    PEND_KEY,
    loadState,
    saveState,
    loadLogos,
    saveLogos,
    loadFigsData,
    saveFigsData,
    loadPending,
    savePending,
    clearPendingData,
    toB64
  };
});