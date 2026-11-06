(function () {
  'use strict';

  /* Nom affiché en haut des écrans : à remplacer par le vrai nom de l'outil. */
  const APP_NAME = 'Assistant rapport';

  const KEY = 'rapport-stage-v1';
  let counter = 0;
  function nid() { counter += 1; return 's' + Date.now().toString(36) + counter; }
  function sec(level, title, guide, nonum) {
    return { id: nid(), level: level, title: title, guide: guide, nonum: !!nonum, notes: '', text: '' };
  }

  function defaultPlan() {
    return [
      sec(1, 'Introduction', "Pourquoi as-tu fait ce stage ? Quels étaient tes objectifs ? Comment ton rapport est-il organisé ?", true),
      sec(1, "Présentation de l'entreprise", "Que fait l'entreprise, depuis quand, et comment est-elle organisée ?"),
      sec(2, 'Historique et activités', "Quand l'entreprise a-t-elle été créée et quels produits ou services propose-t-elle ?"),
      sec(2, 'Organisation et fonctionnement', "Quels sont les services, et qui fait quoi ? Décris l'organigramme en quelques phrases."),
      sec(1, 'Déroulement du stage', "Quelles missions as-tu reçues, semaine après semaine ?"),
      sec(2, 'Missions confiées', "Pour chaque mission : l'objectif, ce que tu as fait et le résultat."),
      sec(2, 'Outils et méthodes utilisés', "Quels outils, logiciels, équipements ou méthodes as-tu utilisés ?"),
      sec(1, 'Difficultés et solutions', "Quel problème as-tu rencontré, et comment l'as-tu résolu ?"),
      sec(1, 'Conclusion', "Qu'as-tu appris, et en quoi ce stage sert-il ton projet professionnel ?", true)
    ];
  }

  function exposePlan() {
    return [
      sec(1, 'Introduction', "De quoi parle ton exposé, pourquoi ce sujet est-il important, et comment vas-tu l'organiser ?", true),
      sec(1, 'Définitions et contexte', "Quels mots ou notions faut-il définir ? Dans quel contexte le sujet se place-t-il ?"),
      sec(1, 'Les idées principales', "Quelles sont les deux ou trois idées essentielles que tu veux faire comprendre ?"),
      sec(2, 'Premier axe', "Quel est le premier point à développer, avec ses explications ?"),
      sec(2, 'Deuxième axe', "Quel est le deuxième point à développer ?"),
      sec(2, 'Troisième axe', "Quel est le troisième point à développer ?"),
      sec(1, 'Exemples et applications', "Quels exemples concrets illustrent ton sujet ?"),
      sec(1, 'Avantages, limites et enjeux', "Quels sont les points forts, les limites ou les enjeux du sujet ?"),
      sec(1, 'Conclusion', "Quelles idées veux-tu faire retenir ? Quelle ouverture proposes-tu ?", true)
    ];
  }

  const MAX_MEMBRES = 10;
  const HEADER_PRESETS = [
    ['', 'Choisir un modèle d\'en-tête…', null],
    ['unstim', 'Bénin : UNSTIM (ENSET Lokossa, ENSET, etc.)', "RÉPUBLIQUE DU BÉNIN\n*******\nMINISTÈRE DE L'ENSEIGNEMENT SUPÉRIEUR ET DE LA RECHERCHE SCIENTIFIQUE\n*******\nUNIVERSITÉ NATIONALE DES SCIENCES, TECHNOLOGIES, INGÉNIERIES ET MATHÉMATIQUES D'ABOMEY (UNSTIM)\n*******"],
    ['benin', 'Bénin : sans université de tutelle', "RÉPUBLIQUE DU BÉNIN\n*******\nMINISTÈRE DE L'ENSEIGNEMENT SUPÉRIEUR ET DE LA RECHERCHE SCIENTIFIQUE\n*******"],
    ['lycee', 'Bénin : lycée ou collège', "RÉPUBLIQUE DU BÉNIN\n*******\nMINISTÈRE DES ENSEIGNEMENTS SECONDAIRE, TECHNIQUE ET DE LA FORMATION PROFESSIONNELLE\n*******"],
    ['vide', 'Seulement le nom de mon établissement', '']
  ];
  const DEFAULT_HEADER = "RÉPUBLIQUE DU BÉNIN\n*******\nMINISTÈRE DE L'ENSEIGNEMENT SUPÉRIEUR ET DE LA RECHERCHE SCIENTIFIQUE\n*******";

  const MODES = {
    stage: {
      name: 'Rapport de stage',
      plan: defaultPlan,
      fields: [
        ['nom', 'Ton nom complet', 'Nom et prénoms'],
        ['annee', 'Année universitaire', 'Ex : 2025-2026'],
        ['filiere', 'Ta filière', 'Ex : Gestion, Génie civil, Informatique'],
        ['ecole', 'Ton école ou université', 'Nom de ton établissement'],
        ['entreprise', "Entreprise d'accueil", "Nom de l'entreprise ou de l'institution"],
        ['duree', 'Période du stage', 'Ex : Du 22 juin 2026 au 29 août 2026 (10 semaines)'],
        ['titreRapport', 'Intitulé du rapport (facultatif)', 'Ex : RAPPORT DE STAGE DE CONSOLIDATION EN ENTREPRISE'],
        ['departement', 'Département (facultatif)', 'Ex : Département de Génie électrique'],
        ['enseignant', 'Superviseur ou maître de stage (facultatif)', 'Ex : Mme Carine SOSSOUKPE']
      ],
      required: [['nom', 'ton nom'], ['filiere', 'ta filière'], ['ecole', 'ton école'], ['entreprise', "l'entreprise d'accueil"]],
      h1: 'Parle-nous de ton stage',
      lead: 'Quelques réponses suffisent pour préparer le plan de ton rapport, quelle que soit ta filière.',
      areaLabel: 'Tes missions principales',
      areaPh: 'Décris en quelques lignes ce que tu as fait pendant ton stage',
      planHint: "Voici un plan classique de rapport de stage. Tu peux l'utiliser tel quel ou le modifier ensuite.",
      planH1: 'Le plan de ton rapport',
      customPh: "Introduction\n1. Présentation de l'entreprise\n  1.1 Historique\n  1.2 Organisation\n2. Déroulement du stage\nConclusion",
      writeBtn: 'Rédiger mon rapport',
      writeH1: 'Rédige ton rapport',
      writeLead: 'Pour chaque partie, note tes idées puis clique sur « Développer mon idée » : le site les transforme en texte rédigé, sans rien inventer. Relis et corrige chaque texte : ce rapport est le tien. Ton travail est sauvegardé automatiquement sur cet appareil.',
      notesTitle: 'Tes notes sur tes missions',
      textLabel: 'Texte du rapport (tu peux le corriger)',
      introGuide: "Pourquoi as-tu fait ce stage ? Quels étaient tes objectifs ? Comment ton rapport est-il organisé ?",
      conclGuide: "Qu'as-tu appris, et en quoi ce stage sert-il ton projet professionnel ?",
      logoEntreprise: true,
      coverTitle: 'RAPPORT DE STAGE',
      docTitle: 'Rapport de stage',
      presentedBefore: 2600,
      coverPrev: function (P) { return P.entreprise ? 'Stage à ' + P.entreprise : ''; },
      coverLines: function (P) {
        const o = [];
        if (P.entreprise) o.push(['Stage effectué à : ' + P.entreprise, 28, false, 240, 120]);
        if (P.duree) o.push(['Durée : ' + P.duree, 26, false, 0, 120]);
        return o;
      },
      fileBase: function (P) { return 'rapport-de-stage-' + slug(P.entreprise); }
    },
    expose: {
      name: 'Exposé',
      plan: exposePlan,
      fields: [
        ['__group'],
        ['annee', 'Année universitaire', 'Ex : 2025-2026'],
        ['filiere', 'Ta filière ou ta classe (facultatif)', 'Ex : Licence 2 Énergie renouvelable'],
        ['ecole', 'Ton école ou université', 'Nom de ton établissement'],
        ['sujet', "Sujet de l'exposé", "Ex : Les énergies renouvelables en Afrique"],
        ['numTheme', 'Numéro du thème (facultatif)', 'Ex : 5'],
        ['numGroupe', 'Numéro du groupe (facultatif)', 'Ex : 10'],
        ['departement', 'Département (facultatif)', 'Ex : Département des Sciences Techniques'],
        ['matiere', 'Matière ou cours (UE) (facultatif)', 'Ex : Énergie solaire'],
        ['enseignant', "Nom de l'enseignant (facultatif)", 'Ex : Dr Dupont'],
        ['duree', "Durée de l'exposé (facultatif)", 'Ex : 15 minutes']
      ],
      required: [['nom', 'ton nom'], ['ecole', 'ton école'], ['sujet', "le sujet de l'exposé"]],
      h1: 'Parle-nous de ton exposé',
      lead: 'Donne le sujet et les points que tu veux aborder : le site prépare le plan, puis rédige chaque partie.',
      areaLabel: 'Les points que tu veux aborder',
      areaPh: "Note en vrac les idées, les consignes de l'enseignant ou les notions à traiter",
      planHint: "Voici un plan classique d'exposé. Tu peux l'utiliser tel quel ou le modifier ensuite.",
      planH1: 'Le plan de ton exposé',
      customPh: "Introduction\n1. Définitions\n2. Les causes\n  2.1 Causes naturelles\n  2.2 Causes humaines\n3. Les solutions\nConclusion",
      writeBtn: "Rédiger mon exposé",
      writeH1: "Rédige ton exposé",
      writeLead: "Pour chaque partie, note tes idées puis clique sur « Développer mon idée » : le site les transforme en texte rédigé et peut les expliquer avec des notions générales. Vérifie les informations, ajoute tes sources et corrige chaque texte : cet exposé est le tien. Ton travail est sauvegardé automatiquement sur cet appareil.",
      notesTitle: "Les points que tu veux aborder",
      textLabel: "Texte de l'exposé (tu peux le corriger)",
      introGuide: "De quoi parle ton exposé, pourquoi ce sujet est-il important, et comment vas-tu l'organiser ?",
      conclGuide: "Quelles idées veux-tu faire retenir ? Quelle ouverture proposes-tu ?",
      logoEntreprise: false,
      coverTitle: 'EXPOSÉ',
      docTitle: 'Exposé',
      presentedBefore: 1800,
      coverPrev: function (P) { return P.sujet ? P.sujet : ''; },
      coverLines: function (P) {
        const o = [];
        if (P.sujet) o.push(['« ' + P.sujet + ' »', 36, true, 600, 240, 'head']);
        if (P.matiere) o.push(['Matière : ' + P.matiere, 26, false, 0, 120]);
        if (P.enseignant) o.push(['Enseignant : ' + P.enseignant, 26, false, 0, 120]);
        if (P.duree) o.push(["Durée de l'exposé : " + P.duree, 26, false, 0, 120]);
        return o;
      },
      fileBase: function (P) { return 'expose-' + slug(P.sujet); }
    }
  };
  function M() { return MODES[state.mode] || MODES.stage; }

  function freshState(mode) {
    const m = MODES[mode] ? mode : 'stage';
    return {
      step: 1,
      mode: m,
      profile: { nom: '', annee: '', filiere: '', ecole: '', entreprise: '', duree: '', missions: '', email: '', sujet: '', matiere: '', enseignant: '', departement: '', numTheme: '', numGroupe: '', titreRapport: '', niveau: '', pages: '', membres: [''] },
      tab: 'default',
      sections: MODES[m].plan(),
      customText: '',
      cover: { model: 'officiel', color: '#0F6B5B', header: DEFAULT_HEADER, banner: 'ruban' },
      sources: [],
      citeStyle: 'apa',
      research: false,
      paid: null
    };
  }
  const logos = { ecole: null, entreprise: null };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || !Array.isArray(s.sections) || !s.profile) return null;
      s.sections.forEach(function (x) {
        if (typeof x.notes !== 'string') { x.notes = x.text || ''; x.text = ''; }
      });
      if (!s.cover || !/^(officiel|cadre|moderne|sobre|aucune)$/.test(s.cover.model) || !/^#[0-9A-Fa-f]{6}$/.test(s.cover.color || '')) {
        s.cover = { model: 'officiel', color: '#0F6B5B', header: DEFAULT_HEADER, banner: 'ruban' };
      }
      if (!/^(ruban|bandeau|encadre|double|lignes)$/.test(s.cover.banner)) s.cover.banner = 'ruban';
      if (!/^(apa|mla|harvard|simple)$/.test(s.citeStyle)) s.citeStyle = 'apa';
      s.research = s.research !== false;
      s.sources = Array.isArray(s.sources) ? s.sources.filter(function (x) { return typeof x === 'string' && x.trim(); }).slice(0, 60).map(function (x) { return x.slice(0, 500); }) : [];
      if (typeof s.cover.header !== 'string') s.cover.header = DEFAULT_HEADER;
      s.cover.header = s.cover.header.replace(/Université de ton choix \(modifie cette ligne\)\n?(\*{2,}\n?)?/, '').replace(/\n+$/, '');
      if (typeof s.cover.template !== 'string') s.cover.template = '';
      ['labelColor', 'headColor', 'bannerText', 'artColor'].forEach(function (k) { if (!/^#[0-9A-Fa-f]{6}$/.test(s.cover[k] || '')) s.cover[k] = ''; });
      if (!/^[A-Za-z0-9]{0,40}$/.test(s.cover.art || '')) s.cover.art = '';
      s.cover.etiquettes = !!s.cover.etiquettes;
      if (typeof s.profile.email !== 'string') s.profile.email = '';
      ['sujet', 'matiere', 'enseignant', 'departement', 'numTheme', 'numGroupe', 'niveau', 'pages', 'titreRapport'].forEach(function (k) { if (typeof s.profile[k] !== 'string') s.profile[k] = ''; });
      if (!/^(stage|expose)$/.test(s.mode)) s.mode = 'stage';
      if (!Array.isArray(s.profile.membres) || !s.profile.membres.length || s.profile.membres.length > MAX_MEMBRES) s.profile.membres = [String(s.profile.nom || '')];
      s.profile.membres = s.profile.membres.map(function (x) { return String(x == null ? '' : x); });
      if (!s.paid || !/^\d+$/.test(String(s.paid.id)) || !/^[0-9a-f]{12}$/.test(s.paid.nonce || '')) s.paid = null;
      return s;
    } catch (e) { return null; }
  }
  let state = load() || freshState();
  let view = 'home'; /* 'home' = page d'accueil, 'app' = les étapes d'un document */
  let saveTimer = null;
  let savePending = false;
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      return false;
    }
  }
  function debouncedSave() {
    savePending = true;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      savePending = false;
      save();
      updateSavedStatus();
    }, 400);
  }
  function flushSave() {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    if (savePending) { savePending = false; save(); updateSavedStatus(); }
  }
  function updateSavedStatus() {
    const el = document.getElementById('saved');
    if (el) {
      const ok = save();
      el.textContent = ok ? 'Sauvegardé sur cet appareil' : 'Échec de sauvegarde : espace plein';
      el.className = ok ? 'saved' : 'saved err';
    }
  }

  const LOGO_KEY = 'rapport-stage-logos';
  function toB64(u8) {
    let s = '', i; const step = 0x8000;
    for (i = 0; i < u8.length; i += step) { s += String.fromCharCode.apply(null, u8.subarray(i, i + step)); }
    return btoa(s);
  }
  function fromB64(b) {
    const s = atob(b), u = new Uint8Array(s.length); let i;
    for (i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
    return u;
  }
  function saveLogos() {
    try {
      const o = {};
      ['ecole', 'entreprise'].forEach(function (k) {
        o[k] = logos[k] ? { d: toB64(logos[k].data), w: logos[k].w, h: logos[k].h } : null;
      });
      localStorage.setItem(LOGO_KEY, JSON.stringify(o));
    } catch (e) { /* stockage indisponible ou plein */ }
  }
  function loadLogos() {
    try {
      const o = JSON.parse(localStorage.getItem(LOGO_KEY) || 'null');
      if (!o) return;
      ['ecole', 'entreprise'].forEach(function (k) {
        const l = o[k];
        if (l && typeof l.d === 'string' && l.w > 0 && l.h > 0 && l.w <= 1000 && l.h <= 1000) {
          logos[k] = { data: fromB64(l.d), w: l.w, h: l.h };
        }
      });
    } catch (e) { /* données illisibles : on ignore */ }
  }
  loadLogos();

  function esc(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function words(t) {
    const m = String(t || '').trim().match(/\S+/g);
    return m ? m.length : 0;
  }
  function finalText(s) {
    return (s.text && s.text.trim()) ? s.text : (s.notes || '');
  }
  function hasText() {
    return state.sections.some(function (s) { return finalText(s).trim(); });
  }

  function fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const timeout = setTimeout(function () { controller.abort(); }, 60000);
    return fetch(url, Object.assign({}, options, { signal: controller.signal }))
      .then(function (r) { clearTimeout(timeout); return r; })
      .catch(function (e) { clearTimeout(timeout); throw e; });
  }

  function roman(n) {
    const r = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let o = '';
    r.forEach(function (p) { while (n >= p[0]) { o += p[1]; n -= p[0]; } });
    return o;
  }
  function labels(list) {
    let a = 0, b = 0;
    return list.map(function (s) {
      if (s.level === 1) {
        if (s.nonum) { return ''; }
        a += 1; b = 0; return roman(a) + '.';
      }
      b += 1;
      return a > 0 ? b + '.' : '';
    });
  }

  const app = document.getElementById('app');

  function header(n) {
    const back = n > 1
      ? '<button type="button" class="back" data-action="goto" data-step="' + (n - 1) + '" aria-label="Revenir à l\'étape précédente">← Retour</button>'
      : '<button type="button" class="back" data-action="home" aria-label="Retour à l\'accueil">← Accueil</button>';
    function st(k, label) {
      return '<button type="button" data-action="goto" data-step="' + k + '" class="' + (k === n ? 'on' : '') + '"' + (k === n ? ' aria-current="step"' : '') + '>' + k + '. ' + label + '</button>';
    }
    return '<div class="nav"><div class="top">' + back + '<button type="button" class="brand brandbtn" data-action="home">' + esc(APP_NAME) + '</button><div class="stepn">Étape ' + n + '/3</div></div>' +
      '<div class="stepsnav">' + st(1, 'Infos') + st(2, 'Plan') + st(3, 'Rédaction') + '</div></div>';
  }

  const FIG_KEY = 'rapport-stage-figs';
  const MAX_FIGS_SECTION = 8, MAX_FIGS_TOTAL = 16;
  let figs = {};
  function figCount() {
    let n = 0;
    state.sections.forEach(function (x) { n += (figs[x.id] || []).length; });
    return n;
  }
  function figNumber(sid, fid) {
    let n = 0, k, j, l;
    for (k = 0; k < state.sections.length; k++) {
      l = figs[state.sections[k].id] || [];
      for (j = 0; j < l.length; j++) { n += 1; if (state.sections[k].id === sid && l[j].id === fid) return n; }
    }
    return n;
  }
  function saveFigs() {
    try {
      const ids = {}, o = {};
      state.sections.forEach(function (x) { ids[x.id] = 1; });
      Object.keys(figs).forEach(function (k) { if (ids[k] && figs[k].length) o[k] = figs[k]; });
      localStorage.setItem(FIG_KEY, JSON.stringify(o));
      return true;
    } catch (e) { return false; }
  }
  function loadFigs() {
    try {
      const o = JSON.parse(localStorage.getItem(FIG_KEY) || 'null');
      if (!o) return;
      Object.keys(o).forEach(function (k) {
        if (!Array.isArray(o[k])) return;
        figs[k] = o[k].filter(function (f) { return f && typeof f.d === 'string' && f.w > 0 && f.h > 0 && f.w <= 2000 && f.h <= 2000; })
          .map(function (f) { return { id: String(f.id), d: f.d, w: f.w, h: f.h, cap: String(f.cap || '').slice(0, 300) }; });
      });
    } catch (e) { /* données illisibles : on ignore */ }
  }
  loadFigs();

  function figsListHtml(sid) {
    return (figs[sid] || []).map(function (f) {
      return '<div class="fig"><img alt="" src="data:image/jpeg;base64,' + f.d + '"><div class="fig-b"><div class="fig-n">Figure ' + figNumber(sid, f.id) + '</div>' +
        '<input class="in sm" type="text" data-figcap="' + sid + '" data-fid="' + f.id + '" placeholder="Légende (ex : Schéma d\'un onduleur On-grid)" value="' + esc(f.cap) + '" aria-label="Légende de la figure">' +
        '<button type="button" class="linkbtn" data-action="rmFig" data-sid="' + sid + '" data-fid="' + f.id + '">Retirer cette image</button></div></div>';
    }).join('');
  }
  function figBox(sid) {
    return '<div class="figbox"><div class="lbl">Schémas et photos de cette partie (facultatif)</div>' +
      '<input class="in" type="file" accept="image/png,image/jpeg,image/webp" multiple data-figfile="' + sid + '" id="ff-' + sid + '" aria-label="Ajouter des schémas ou des photos">' +
      '<div class="hint" id="figst-' + sid + '">Chaque image reçoit un numéro et une légende, et apparaît dans la liste des figures.</div>' +
      '<div class="figlist" id="figs-' + sid + '">' + figsListHtml(sid) + '</div></div>';
  }
  function refreshFigs() {
    state.sections.forEach(function (x) {
      const el = document.getElementById('figs-' + x.id);
      if (el) el.innerHTML = figsListHtml(x.id);
    });
  }
  function figStatus(sid, msg) {
    const el = document.getElementById('figst-' + sid);
    if (el) el.textContent = msg;
  }
  function readOneFigure(sid, file) {
    return new Promise(function (resolve) {
      if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { resolve('« ' + file.name + ' » : format non accepté (PNG ou JPG).'); return; }
      if (file.size > 8000000) { resolve('« ' + file.name + ' » : image trop lourde (8 Mo maximum).'); return; }
      if ((figs[sid] || []).length >= MAX_FIGS_SECTION) { resolve('Maximum ' + MAX_FIGS_SECTION + ' images par partie.'); return; }
      if (figCount() >= MAX_FIGS_TOTAL) { resolve('Maximum ' + MAX_FIGS_TOTAL + ' images dans le document.'); return; }
      const fail = function () { resolve('« ' + file.name + ' » : image illisible.'); };
      const fr = new FileReader();
      fr.onerror = fail;
      fr.onload = function () {
        const img = new Image();
        img.onerror = fail;
        img.onload = function () {
          const sc = Math.min(1, 900 / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * sc)), h = Math.max(1, Math.round(img.height * sc));
          const cv = document.createElement('canvas');
          cv.width = w; cv.height = h;
          const g = cv.getContext('2d');
          g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, w, h);
          g.drawImage(img, 0, 0, w, h);
          const d = cv.toDataURL('image/jpeg', 0.84).split(',')[1];
          if (!d) { fail(); return; }
          const list = figs[sid] || (figs[sid] = []);
          const f = { id: 'f' + Date.now().toString(36) + Math.floor(Math.random() * 1000), d: d, w: w, h: h, cap: '' };
          list.push(f);
          if (!saveFigs()) {
            list.pop();
            resolve("L'espace de sauvegarde de l'appareil est plein : retire une image avant d'en ajouter.");
            return;
          }
          resolve('');
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
  function readFigures(sid, files) {
    const msgs = []; let chain = Promise.resolve(), i;
    figStatus(sid, 'Ajout en cours…');
    for (i = 0; i < files.length; i++) {
      (function (f) {
        chain = chain.then(function () { return readOneFigure(sid, f); }).then(function (m) { if (m) msgs.push(m); });
      })(files[i]);
    }
    chain.then(function () {
      refreshFigs();
      figStatus(sid, msgs.length ? msgs.join(' ') : 'Image ajoutée. Écris sa légende ci-dessous.');
      const fi = document.getElementById('ff-' + sid);
      if (fi) fi.value = '';
    });
  }

  let foundSources = [];
  let srcBusy = false;
  const CITE_STYLES = [['apa', 'APA'], ['mla', 'MLA'], ['harvard', 'Harvard'], ['simple', 'Simple (numérotée)']];
  const CITE_TYPES = [['web', 'Site web'], ['livre', 'Livre'], ['cours', 'Cours, article ou rapport']];
  let citeForm = { type: 'web', auteur: '', titre: '', annee: '', editeur: '', url: '' };

  function fmtCite(it, style) {
    const a = String(it.auteur || '').trim(), t = String(it.titre || '').trim(), y = String(it.annee || '').trim();
    const e = String(it.editeur || '').trim(), u = String(it.url || '').trim(), web = it.type === 'web';
    const cons = web && it.consulte ? ' (consulté le ' + it.consulte + ')' : '';
    function dot(x) { x = String(x).trim(); return !x ? '' : (/[.!?]$/.test(x) ? x : x + '.'); }
    const parts = []; let head, rest;
    if (style === 'mla') {
      if (a) parts.push(dot(a));
      parts.push(web ? '« ' + dot(t) + ' »' : dot(t));
      rest = [e, y, web ? u : ''].filter(Boolean).join(', ');
      if (rest) parts.push(rest + '.');
    } else if (style === 'harvard') {
      head = a || e || t;
      parts.push(head + ' (' + (y || 's. d.') + ')');
      if (head !== t) parts.push(dot(t));
      if (a && e) parts.push(dot(e));
      if (web && u) parts.push('Disponible à : ' + u + cons + '.');
    } else if (style === 'simple') {
      rest = [a, t, e, y, web ? u : ''].filter(Boolean).join(', ');
      parts.push(rest + cons + '.');
    } else {
      if (a) { parts.push(a + ' (' + (y || 's. d.') + ').'); parts.push(dot(t)); }
      else { parts.push(dot(t) + ' (' + (y || 's. d.') + ').'); }
      if (e) parts.push(dot(e));
      if (web && u) parts.push(u + (cons ? cons : ''));
    }
    return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim().slice(0, 500);
  }
  function todayFr() { return new Date().toLocaleDateString('fr-FR'); }

  function isSafeUrl(u) {
    if (typeof u !== 'string') return false;
    try {
      const url = new URL(u);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  function foundHtml() {
    return foundSources.map(function (x, i) {
      const done = state.sources.some(function (l) { return l.indexOf(x.url) >= 0; });
      const safe = isSafeUrl(x.url);
      return '<div class="srow"><div><a href="' + esc(safe ? x.url : '#') + '" target="_blank" rel="noopener noreferrer"' + (safe ? '' : ' aria-disabled="true" style="pointer-events:none;color:inherit;text-decoration:none"') + '>' + esc(x.title) + '</a><div class="sm2">' + esc(x.site) + '</div></div>' +
        '<button type="button" data-action="addSource" data-i="' + i + '"' + (done || !safe ? ' disabled' : '') + '>' + (done ? 'Ajoutée' : (safe ? 'Ajouter' : 'Lien non sécurisé')) + '</button></div>';
    }).join('');
  }
  function sourcesPanel() {
    const ex = state.mode === 'expose';
    const styles = CITE_STYLES.map(function (m) { return '<option value="' + m[0] + '"' + (state.citeStyle === m[0] ? ' selected' : '') + '>' + esc(m[1]) + '</option>'; }).join('');
    const types = CITE_TYPES.map(function (m) { return '<option value="' + m[0] + '"' + (citeForm.type === m[0] ? ' selected' : '') + '>' + esc(m[1]) + '</option>'; }).join('');
    function cf(k, label, ph) {
      return '<div class="field"><label for="ci-' + k + '">' + label + '</label><input class="in sm" id="ci-' + k + '" type="text" data-cite="' + k + '" placeholder="' + esc(ph) + '" value="' + esc(citeForm[k]) + '"></div>';
    }
    return '<div class="panel"><h2>Sources et références</h2>' +
      '<p class="hint">Les sources sont imprimées à la fin du fichier. Cite seulement ce que tu as réellement lu ou utilisé.</p>' +
      '<div class="field"><label for="cite-style">Style de citation</label><select class="in" id="cite-style" data-citestyle="1">' + styles + '</select>' +
      '<div class="hint">APA, MLA et Harvard : liste classée par ordre alphabétique. Simple : liste numérotée. Le style s\'applique aux sources que tu ajoutes ici ; les lignes déjà écrites ne changent pas.</div></div>' +
      '<details class="addcite"><summary>Ajouter un livre, un cours ou un site</summary>' +
      '<div class="field"><label for="ci-type">Type de source</label><select class="in" id="ci-type" data-cite="type">' + types + '</select></div>' +
      cf('auteur', 'Auteur ou organisme (facultatif)', 'Ex : DUPONT, Marie') + cf('titre', 'Titre', 'Titre du livre, du cours ou de la page') +
      cf('annee', 'Année (facultatif)', 'Ex : 2024') + cf('editeur', 'Éditeur, établissement ou site (facultatif)', 'Ex : Eyrolles, ENSET, ademe.fr') +
      cf('url', 'Lien (facultatif, pour un site)', 'https://…') +
      '<div class="tools"><button type="button" data-action="addCite">Ajouter à ma liste</button></div></details>' +
      '<div class="field"><label for="src">Ta liste de sources (une par ligne, tu peux la corriger)</label>' +
      '<textarea class="ta" id="src" data-sources="1" rows="5" placeholder="Les sources ajoutées apparaissent ici, y compris celles utilisées par la rédaction avec recherche. Tu peux aussi écrire les tiennes.">' + esc(state.sources.join('\n')) + '</textarea></div>' +
      (ex ? '<div class="tools"><button type="button" data-action="findSources">Trouver des pistes de sources sur le web</button></div>' +
        '<div class="hint">Le site cherche sur le web des pages sur ton sujet. Ce sont des pistes à lire et à vérifier : le texte généré par l\'IA ne vient pas de ces pages.</div>' : '') +
      '<div class="dev" id="src-st" role="status"></div><div class="figlist" id="src-found">' + foundHtml() + '</div></div>';
  }
  function setSrcStatus(cls, msg) {
    const el = document.getElementById('src-st');
    if (el) { el.className = 'dev ' + cls; el.textContent = msg; }
  }
  function findSources() {
    if (srcBusy) return;
    const P = state.profile;
    if (!String(P.sujet || '').trim()) { setSrcStatus('err', "Renseigne d'abord le sujet de l'exposé (étape 1)."); return; }
    srcBusy = true;
    setSrcStatus('', 'Recherche en cours (10 à 30 secondes)…');
    const parties = state.sections.filter(function (x) { return x.level === 1; }).map(function (x) { return x.title; }).slice(0, 10);
    const notes = state.sections.map(function (x) { return x.notes || ''; }).join(' ').slice(0, 600);
    fetchWithTimeout('/api/sources', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sujet: P.sujet, matiere: P.matiere, parties: parties, notes: notes })
    }).then(function (r) {
      return r.json().catch(function () { return { status: 'error', message: 'Réponse illisible.' }; });
    }).then(function (d) {
      srcBusy = false;
      if (d.status === 'ok' && Array.isArray(d.sources) && d.sources.length) {
        foundSources = d.sources;
        const box = document.getElementById('src-found');
        if (box) box.innerHTML = foundHtml();
        setSrcStatus('ok', 'Voici des pistes trouvées sur le web. Ouvre-les, lis-les, puis ajoute seulement celles qui te servent vraiment.');
      } else {
        setSrcStatus(d.status === 'empty' ? 'warn' : 'err', d.message || "Aucune source trouvée. Ajoute les tiennes à la main.");
      }
    }).catch(function (e) {
      srcBusy = false;
      if (e && e.name === 'AbortError') { setSrcStatus('err', 'Le service met trop de temps, réessaie.'); }
      else { setSrcStatus('err', 'Connexion impossible. Vérifie internet et réessaie.'); }
    });
  }
  function addWebSources(list) {
    let n = 0; const day = todayFr();
    list.forEach(function (x) {
      if (!x || typeof x.url !== 'string' || state.sources.length >= 60) return;
      if (!isSafeUrl(x.url)) return;
      if (state.sources.some(function (l) { return l.indexOf(x.url) >= 0; })) return;
      state.sources.push(fmtCite({ type: 'web', auteur: '', titre: x.title || x.site || x.url, annee: '', editeur: x.site || '', url: x.url, consulte: day }, state.citeStyle));
      n += 1;
    });
    if (n) {
      flushSave(); save();
      const ta = document.getElementById('src');
      if (ta) ta.value = state.sources.join('\n');
    }
    return n;
  }
  function addSource(i) {
    const x = foundSources[i];
    if (!x || state.sources.some(function (l) { return l.indexOf(x.url) >= 0; })) return;
    if (state.sources.length >= 60) return;
    const day = todayFr();
    state.sources.push(fmtCite({ type: 'web', auteur: '', titre: x.title, annee: '', editeur: x.site, url: x.url, consulte: day }, state.citeStyle));
    flushSave(); save();
    const ta = document.getElementById('src');
    if (ta) ta.value = state.sources.join('\n');
    const box = document.getElementById('src-found');
    if (box) box.innerHTML = foundHtml();
  }

  function addCite() {
    const f = citeForm;
    if (!String(f.titre).trim()) { setSrcStatus('err', 'Écris au moins le titre de la source.'); return; }
    const u = String(f.url).trim();
    if (u && !/^https?:\/\/\S+$/i.test(u)) { setSrcStatus('err', 'Le lien doit commencer par http:// ou https://.'); return; }
    if (state.sources.length >= 60) { setSrcStatus('err', 'Maximum 60 sources.'); return; }
    state.sources.push(fmtCite({ type: f.type, auteur: f.auteur, titre: f.titre, annee: f.annee, editeur: f.editeur, url: u, consulte: f.type === 'web' && u ? todayFr() : '' }, state.citeStyle));
    flushSave(); save();
    citeForm = { type: f.type, auteur: '', titre: '', annee: '', editeur: '', url: '' };
    ['auteur', 'titre', 'annee', 'editeur', 'url'].forEach(function (k) { const el = document.getElementById('ci-' + k); if (el) el.value = ''; });
    const ta = document.getElementById('src');
    if (ta) ta.value = state.sources.join('\n');
    setSrcStatus('ok', 'Source ajoutée à ta liste.');
  }

  function members() {
    const m = (state.profile.membres || []).map(function (x) { return String(x || '').trim(); }).filter(Boolean);
    return m;
  }
  function syncNom() {
    const m = members();
    state.profile.nom = m.length ? m[0] : '';
  }
  function groupHtml() {
    const arr = state.profile.membres, n = arr.length; let opts = '', i;
    for (i = 1; i <= MAX_MEMBRES; i++) {
      opts += '<option value="' + i + '"' + (i === n ? ' selected' : '') + '>' + (i === 1 ? '1 personne (je travaille seul)' : i + ' personnes') + '</option>';
    }
    const inputs = arr.map(function (nm, k) {
      return '<div class="field"><label for="m-' + k + '">' + (n === 1 ? 'Ton nom complet' : 'Nom du membre ' + (k + 1)) + '</label>' +
        '<input class="in" id="m-' + k + '" type="text" data-member="' + k + '" placeholder="Nom et prénoms" value="' + esc(nm) + '"></div>';
    }).join('');
    return '<div class="field"><label for="f-count">Nombre de personnes dans le groupe</label>' +
      '<select class="in" id="f-count" data-count="1">' + opts + '</select></div>' + inputs;
  }

  function cat() { const n = state.profile.niveau; return n === 'lycee' ? 'lycee' : n === 'pro' ? 'pro' : 'univ'; }
  const COVER_CATS = [['univ', 'Université et écoles'], ['lycee', 'Lycée et collège'], ['pro', 'Formation professionnelle']];
  let coverCat = '';
  function headerParts() {
    const l = String(state.cover.header || '').split(/\r?\n/).map(function (x) { return x.trim(); }).filter(function (x) { return x && !/^[*•]{2,}$/.test(x); });
    return { pays: l[0] || '', min: l[1] || '', univ: l[2] || '' };
  }
  function headerFieldsHtml() {
    const h = headerParts();
    function f(k, label, ph) { return '<div class="field"><label for="hd-' + k + '">' + label + '</label><input class="in sm" id="hd-' + k + '" type="text" data-hdr="' + k + '" placeholder="' + esc(ph) + '" value="' + esc(h[k]) + '"></div>'; }
    return f('pays', 'Pays ou institution (1re ligne)', 'Ex : RÉPUBLIQUE DU BÉNIN') +
      f('min', 'Ministère de tutelle (facultatif)', "Ex : MINISTÈRE DE L'ENSEIGNEMENT SUPÉRIEUR ET DE LA RECHERCHE SCIENTIFIQUE") +
      f('univ', 'Université de rattachement (facultatif)', "Ex : UNIVERSITÉ NATIONALE … (UNSTIM) D'ABOMEY") +
      '<div class="hint">Laisse vide ce qui ne concerne pas ton établissement : la ligne disparaît de la page de garde. Le nom de ton école vient des informations ci-dessus.</div>';
  }
  function coverInfoHtml() {
    const P = state.profile, ex = state.mode === 'expose';
    const L = cat() === 'lycee';
    const fields = ex
      ? [['ecole', L ? 'Établissement' : 'École ou université'], ['departement', L ? 'Série ou option' : 'Département'], ['filiere', L ? 'Classe' : 'Filière ou spécialité'], ['annee', 'Année'],
         ['matiere', 'Matière ou UE'], ['sujet', "Thème de l'exposé"], ['numTheme', 'Numéro du thème'], ['numGroupe', 'Numéro du groupe'], ['enseignant', 'Enseignant (supervision)']]
      : [['ecole', L ? 'Établissement' : 'École ou université'], ['departement', L ? 'Série ou option' : 'Département'], ['filiere', L ? 'Classe' : 'Filière ou spécialité'], ['annee', 'Année'],
         ['entreprise', 'Entreprise'], ['titreRapport', 'Intitulé du rapport'], ['duree', 'Période du stage'], ['enseignant', 'Superviseur']];
    let h = fields.map(function (f) {
      return '<div class="field"><label for="ci2-' + f[0] + '">' + f[1] + '</label><input class="in sm" id="ci2-' + f[0] + '" type="text" data-cfield="' + f[0] + '" value="' + esc(P[f[0]]) + '"></div>';
    }).join('');
    h += ex
      ? '<div class="field"><label for="ci2-membres">Membres du groupe (un nom par ligne)</label><textarea class="ta" id="ci2-membres" rows="4" data-cmembres="1">' + esc((P.membres || []).join('\n')) + '</textarea></div>'
      : '<div class="field"><label for="ci2-nom">Ton nom</label><input class="in sm" id="ci2-nom" type="text" data-cfield="nom" value="' + esc(P.nom) + '"></div>';
    return '<details class="addcite"><summary>Modifier les informations de la page de garde</summary>' + h + '</details>';
  }
  function refreshCover() {
    const pv = document.getElementById('cover-prev'); if (pv) pv.innerHTML = coverPreview();
    const g = document.getElementById('gal');
    if (g) {
      const cc = coverCat || cat();
      g.innerHTML = (window.COVER_TEMPLATES || []).filter(function (t) { return t.cats.indexOf(cc) >= 0; }).map(function (t) {
        return '<button type="button" class="gcard' + (state.cover.template === t.id ? ' on' : '') + '" data-action="pickCover" data-tid="' + t.id + '" aria-pressed="' + (state.cover.template === t.id) + '"><div class="gp">' + coverPreview(tplCfg(t, state.cover)) + '</div><div class="gn">' + esc(t.nom) + '</div></button>';
      }).join('');
    }
  }
  function resetCoverForCat() {
    const known = [DEFAULT_HEADER].concat(HEADER_PRESETS.map(function (h) { return h[2]; }).filter(function (x) { return x !== null; }));
    (window.COVER_TEMPLATES || []).forEach(function (t) { if (typeof t.header === 'string') known.push(t.header); });
    if (known.indexOf(state.cover.header) >= 0) {
      const k = cat();
      state.cover.header = k === 'lycee' ? HEADER_PRESETS.filter(function (h) { return h[0] === 'lycee'; })[0][2] : k === 'pro' ? '' : DEFAULT_HEADER;
    }
    state.cover.template = '';
    flushSave(); save();
  }
  function tplCfg(t, cur) {
    return { model: t.model, banner: t.banner, color: t.color, header: typeof t.header === 'string' ? t.header : cur.header,
      etiquettes: !!t.etiquettes, labelColor: t.labelColor || '', headColor: t.headColor || '', bannerText: t.bannerText || '', art: t.art || '', artColor: t.artColor || '' };
  }
  const LABELS_LYCEE = {
    filiere: ['Ta classe', 'Ex : Terminale D, 3ème'],
    ecole: ['Ton établissement', 'Nom de ton lycée ou collège'],
    departement: ['Série ou option (facultatif)', 'Ex : Série D'],
    enseignant: ['Professeur ou superviseur (facultatif)', 'Ex : M. Dupont'],
    matiere: ['Matière (facultatif)', 'Ex : Physique-Chimie']
  };
  const NIVEAUX = [['', 'Non précisé'], ['lycee', 'Lycée ou collège'], ['licence', 'Université (licence)'], ['master', 'Université (master)'], ['pro', 'Formation professionnelle']];
  function niveauHtml() {
    const opts = NIVEAUX.map(function (n) { return '<option value="' + n[0] + '"' + (state.profile.niveau === n[0] ? ' selected' : '') + '>' + esc(n[1]) + '</option>'; }).join('');
    return '<div class="field"><label for="f-niveau">Ton niveau d\'études</label><select class="in" id="f-niveau" data-field="niveau">' + opts + '</select><div class="hint">Les questions et les pages de garde proposées s\'adaptent à ton niveau.</div></div>';
  }
  function framingHtml() {
    const opts = NIVEAUX.map(function (n) { return '<option value="' + n[0] + '"' + (state.profile.niveau === n[0] ? ' selected' : '') + '>' + esc(n[1]) + '</option>'; }).join('');
    return '<div class="field"><label for="f-pages">Nombre de pages visé (facultatif)</label>' +
      '<input class="in" id="f-pages" type="number" min="1" max="200" inputmode="numeric" data-field="pages" placeholder="Ex : 25" value="' + esc(state.profile.pages) + '"></div>';
  }
  const aid = { qs: null, ans: ['', '', ''], res: null, busy: false, msg: '' };
  const planAi = { plans: null, busy: false, msg: '' };
  function aidHtml() {
    let h = '<details class="addcite"' + (aid.qs || aid.busy ? ' open' : '') + '><summary>Je ne sais pas par où commencer</summary>' +
      '<p class="hint">Réponds à 3 petites questions : le site te propose ensuite une problématique à partir de tes réponses.</p>';
    if (!aid.qs) {
      h += '<button class="btn line" type="button" data-action="aidStart"' + (aid.busy ? ' disabled' : '') + '>' + (aid.busy ? 'Un instant…' : 'Poser-moi les 3 questions') + '</button>';
    } else {
      h += aid.qs.map(function (q, k) {
        return '<div class="field"><label for="aid-' + k + '">' + esc(q) + '</label><textarea class="ta" id="aid-' + k + '" rows="2" data-aid="' + k + '">' + esc(aid.ans[k]) + '</textarea></div>';
      }).join('') + '<button class="btn line" type="button" data-action="aidGo"' + (aid.busy ? ' disabled' : '') + '>' + (aid.busy ? 'Un instant…' : 'Trouver ma problématique') + '</button>';
    }
    if (aid.res) {
      h += '<div class="dev ok"><b>Problématique proposée :</b> ' + esc(aid.res.problematique) + (aid.res.angle ? '<br>' + esc(aid.res.angle) : '') + '</div>' +
        '<button class="btn line" type="button" data-action="aidUse">Ajouter à mes idées</button>';
    }
    if (aid.msg) h += '<div class="dev warn">' + esc(aid.msg) + '</div>';
    return h + '</details>';
  }
  function planAiHtml() {
    let h = '<details class="addcite"' + (planAi.plans || planAi.busy ? ' open' : '') + '><summary>Proposer 3 plans adaptés à mon sujet</summary>' +
      '<button class="btn line" type="button" data-action="plansGo"' + (planAi.busy ? ' disabled' : '') + '>' + (planAi.busy ? 'Un instant…' : 'Me proposer 3 plans') + '</button>';
    if (planAi.plans) {
      h += planAi.plans.map(function (pl, k) {
        return '<div class="card"><div><div class="ct">' + esc(pl.nom) + '</div><div class="cg">' +
          pl.parties.map(function (x) { return (x.level === 2 ? '&nbsp;&nbsp;– ' : '• ') + esc(x.titre); }).join('<br>') + '</div></div></div>' +
          '<button class="btn line" type="button" data-action="plansUse" data-i="' + k + '">Utiliser le plan « ' + esc(pl.nom) + ' »</button>';
      }).join('');
    }
    if (planAi.msg) h += '<div class="dev warn">' + esc(planAi.msg) + '</div>';
    return h + '</details>';
  }
  function aiCtx() {
    const P = state.profile;
    return { mode: state.mode, sujet: P.sujet, filiere: P.filiere, entreprise: P.entreprise, niveau: P.niveau, pages: P.pages, missions: P.missions };
  }
  function postAi(url, extra) {
    const b = aiCtx(); Object.keys(extra || {}).forEach(function (k) { b[k] = extra[k]; });
    return fetchWithTimeout(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })
      .then(function (r) { return r.json().catch(function () { return { status: 'error', message: 'Réponse illisible.' }; }); })
      .catch(function (e) { return { status: 'error', message: e && e.name === 'AbortError' ? 'Le service met trop de temps, réessaie.' : 'Connexion impossible. Réessaie.' }; });
  }
  function renderStep1(error) {
    const f = M().fields.map(function (x) {
      if (x[0] === '__group') return groupHtml();
      let lab = x[1], ph = x[2];
      if (cat() === 'lycee' && LABELS_LYCEE[x[0]]) { lab = LABELS_LYCEE[x[0]][0]; ph = LABELS_LYCEE[x[0]][1]; }
      return '<div class="field"><label for="f-' + x[0] + '">' + lab + '</label>' +
        '<input class="in" id="f-' + x[0] + '" type="text" data-field="' + x[0] + '" placeholder="' + esc(ph) + '" value="' + esc(state.profile[x[0]]) + '"></div>';
    }).join('');
    return header(1) +
      '<div><h1>' + esc(M().h1) + '</h1><p class="lead">' + esc(M().lead) + '</p></div>' +
      niveauHtml() + f + framingHtml() +
      '<div class="field"><label for="f-missions">' + esc(M().areaLabel) + '</label>' +
      '<textarea class="ta" id="f-missions" data-field="missions" placeholder="' + esc(M().areaPh) + '">' + esc(state.profile.missions) + '</textarea></div>' +
      aidHtml() +
      '<div class="err" role="alert" id="err">' + esc(error || '') + '</div>' +
      '<button class="btn" type="button" data-action="next1">' + (state.sections.length ? 'Continuer vers mon plan →' : 'Générer mon plan') + '</button>';
  }

  function renderPlanDefaultView() {
    const def = M().plan();
    const lb = labels(def);
    const cards = def.map(function (s, i) {
      return '<div class="card' + (s.level === 2 ? ' sub' : '') + '"><div class="num">' + (lb[i] || '•') + '</div><div><div class="ct">' + esc(s.title) + '</div><div class="cg">' + esc(s.guide) + '</div></div></div>';
    }).join('');
    return '<p class="hint">' + esc(M().planHint) + '</p><div class="list">' + cards + '</div>' +
      '<button class="btn line" type="button" data-action="useDefault">Utiliser ce plan</button>';
  }

  function renderPlanEdit() {
    const lb = labels(state.sections);
    const rows = state.sections.map(function (s, i) {
      return '<div class="row' + (s.level === 2 ? ' sub' : '') + '">' +
        '<div class="head"><span class="num">' + (lb[i] || '•') + '</span>' +
        '<input class="in sm" type="text" data-title="' + i + '" value="' + esc(s.title) + '" aria-label="Titre de la ligne ' + (i + 1) + '"></div>' +
        '<div class="tools">' +
        '<button type="button" data-action="up" data-i="' + i + '" aria-label="Monter">↑ Monter</button>' +
        '<button type="button" data-action="down" data-i="' + i + '" aria-label="Descendre">↓ Descendre</button>' +
        '<button type="button" data-action="level" data-i="' + i + '">' + (s.level === 1 ? 'Passer en sous-partie' : 'Passer en partie') + '</button>' +
        '<button type="button" class="del" data-action="del" data-i="' + i + '">Supprimer</button>' +
        '</div></div>';
    }).join('');
    return '<p class="hint">Renomme, déplace ou supprime les parties pour suivre le plan de ton école. Les sous-parties sont décalées vers la droite.</p>' +
      '<div class="list" id="plan-list">' + rows + '</div>' +
      '<div class="tools"><button type="button" data-action="addPart">+ Ajouter une partie</button><button type="button" data-action="addSub">+ Ajouter une sous-partie</button></div>';
  }

  function renderPlanCustom() {
    return '<p class="hint">Écris ou colle le plan donné par ton école, une ligne par partie. Décale la ligne avec des espaces, un tiret ou une numérotation comme 1.1 pour en faire une sous-partie.</p>' +
      '<textarea class="ta" id="custom" data-custom="1" rows="9" placeholder="' + esc(M().customPh) + '">' + esc(state.customText) + '</textarea>' +
      '<div class="err" role="alert" id="err"></div>' +
      '<button class="btn line" type="button" data-action="useCustom">Utiliser mon plan</button>';
  }

  function renderStep2() {
    const body = state.tab === 'default' ? renderPlanDefaultView() : state.tab === 'edit' ? renderPlanEdit() : renderPlanCustom();
    function tab(id, label) { return '<button type="button" data-tab="' + id + '" class="' + (state.tab === id ? 'on' : '') + '">' + label + '</button>'; }
    return header(2) +
      '<div><h1>' + esc(M().planH1) + '</h1><p class="lead">Choisis le plan proposé, modifie-le, ou saisis celui de ton école.</p></div>' +
      planAiHtml() +
      '<div class="tabs">' + tab('default', 'Plan proposé') + tab('edit', 'Modifier') + tab('custom', 'Mon propre plan') + '</div>' +
      body +
      '<div class="actions"><button class="btn" type="button" data-action="to3">' + esc(M().writeBtn) + '</button>' +
      '<button class="btn ghost" type="button" data-action="to1">Modifier mes réponses</button></div>';
  }

  const COVER_MODELS = [['officiel', 'Officiel (style université : en-tête, logos, bandeau, groupe)'], ['cadre', 'Avec cadre'], ['moderne', 'Moderne, avec bandeau de couleur'], ['sobre', 'Sobre'], ['aucune', "Pas de page de garde (j'ajoute celle de mon école)"]];
  const BANNER_STYLES = [['ruban', 'Ruban'], ['bandeau', 'Bandeau plein'], ['encadre', 'Encadré'], ['double', 'Double cadre'], ['lignes', 'Entre deux lignes']];
  const COVER_COLORS = [['#0F6B5B', 'Vert'], ['#1D4ED8', 'Bleu'], ['#7F1D1D', 'Bordeaux'], ['#111827', 'Noir'], ['#C2410C', 'Orange'], ['#6D28D9', 'Violet']];

  function officialCover(c) {
    c = c || state.cover;
    const P = state.profile, ex = state.mode === 'expose';
    const head = String(c.header || '').split(/\r?\n/).map(function (t) { return t.trim(); }).filter(Boolean).map(function (t, k) {
      const star = /^[*•]{2,}$/.test(t);
      return { t: star ? '*******' : t, star: star, bold: !star && (k === 0 || (c.etiquettes && k >= 4)), color: c.etiquettes && !star && (k === 0 || k === 2) ? c.headColor : undefined };
    });
    const top = [], rest = head.slice(), i0 = 0;
    if (rest.length) { top.push(rest.shift()); if (rest.length && rest[0].star) top.push(rest.shift()); }
    const lines = [], et = !!c.etiquettes, lc = c.labelColor || '#2E75B6';
    function lab(t) { return { t: t, color: lc, ul: true }; }
    if (et) {
      if (P.ecole) { lines.push({ t: P.ecole.toUpperCase(), bold: true }); lines.push({ t: '*******', star: true }); }
      if (P.departement) lines.push({ segs: [lab('Département : '), { t: P.departement, b: true }], left: true });
      const fl = (cat() === 'lycee' ? 'Classe : ' : 'Spécialité : ');
      if (P.filiere || P.annee) lines.push({ row: [P.filiere ? [lab(fl), { t: P.filiere }] : [], P.annee ? [lab("Années d'études : "), { t: P.annee }] : []] });
      if (ex && P.matiere) lines.push({ segs: [{ t: P.matiere.toUpperCase(), color: lc, b: true, i: true }], big: true });
    } else if (P.ecole) { lines.push({ t: P.ecole.toUpperCase(), bold: true, big: true }); lines.push({ t: '*******', star: true }); }
    if (!et && P.departement) lines.push({ t: P.departement, ul: true });
    if (!et && P.filiere) lines.push({ t: (/^(fili|class)/i.test(P.filiere) ? '' : (cat() === 'lycee' ? 'Classe : ' : 'Filière : ')) + P.filiere });
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
    const names = ex ? members() : (String(P.nom || '').trim() ? [String(P.nom).trim()] : []);
    const left = { title: ex ? (names.length > 1 ? 'Membre du Groupe' + (P.numGroupe ? ' ' + P.numGroupe : '') : 'Présenté par') + ' :' : 'Rédigé par :', names: names, numbered: names.length > 1, color: et ? lc : undefined };
    const right = String(P.enseignant || '').trim() ? { title: ex ? (et ? 'Sous la direction de :' : 'Par la Supervision de :') : 'Supervisé par :', name: String(P.enseignant).trim(), color: et ? lc : undefined } : null;
    return { top: top, rest: rest, lines: lines, banner: banner, after: after, left: left, right: right, year: P.annee ? 'Année académique : ' + P.annee : '', yearSegs: et && P.annee ? [lab('Année Académique : '), { t: P.annee }] : null };
  }
  function logoDataUrl(l) { return l ? 'data:image/png;base64,' + toB64(l.data) : ''; }

  function officialPreview(c) {
    c = c || state.cover;
    const o = officialCover(c), col = c.color;
    function segsHtml(a) { return a.map(function (g) { return '<span style="' + (g.color ? 'color:' + g.color + ';' : '') + (g.ul ? 'text-decoration:underline;' : '') + (g.b ? 'font-weight:700;' : '') + (g.i ? 'font-style:italic;' : '') + '">' + esc(g.t) + '</span>'; }).join(''); }
    function ln(x) {
      if (x.star) return '<div class="o-st">*******</div>';
      if (x.row) return '<div class="o-row"><span>' + segsHtml(x.row[0]) + '</span><span>' + segsHtml(x.row[1]) + '</span></div>';
      if (x.segs) return '<div class="o-l' + (x.left ? ' o-left' : '') + '">' + segsHtml(x.segs) + '</div>';
      if (x.color) return '<div class="o-l' + (x.bold ? ' b' : '') + '" style="color:' + x.color + '">' + esc(x.t) + '</div>';
      return '<div class="o-l' + (x.bold ? ' b' : '') + (x.ul ? ' u' : '') + '">' + esc(x.t) + '</div>';
    }
    const lg = '<div class="o-lg">' + (logos.ecole ? '<img alt="" src="' + logoDataUrl(logos.ecole) + '">' : '<span></span>') +
      '<div class="o-c">' + o.top.map(ln).join('') + '</div>' +
      (logos.entreprise ? '<img alt="" src="' + logoDataUrl(logos.entreprise) + '">' : '<span></span>') + '</div>';
    const btxt = o.banner.map(function (x) { return '<div class="o-l' + (x.bold ? ' b' : '') + '">' + esc(x.t) + '</div>'; }).join('');
    const bst = c.banner;
    const rib = bst === 'ruban' ? '<div class="o-rib"><i></i><div>' + btxt + '</div><i></i></div>' : '<div class="o-bn o-' + bst + '">' + btxt + '</div>';
    const names = o.left.names.length ? o.left.names.map(function (n, k) { return '<div class="o-l b">' + (o.left.numbered ? (k + 1) + '. ' : '') + esc(n) + '</div>'; }).join('') : '<div class="o-l">Ton nom</div>';
    const bt = '<div class="o-bt"><div><div class="o-l b u"' + (o.left.color ? ' style="color:' + o.left.color + '"' : '') + '>' + esc(o.left.title) + '</div>' + names + '</div>' +
      '<div>' + (o.right ? '<div class="o-l b u"' + (o.right.color ? ' style="color:' + o.right.color + '"' : '') + '>' + esc(o.right.title) + '</div><div class="o-l b">' + esc(o.right.name) + '</div>' : '') + '</div></div>';
    return '<div class="cpo" style="--cc:' + col + ';--ct:' + (c.bannerText || '#fff') + ';' + (c.art ? 'border:7px dotted ' + (c.artColor || col) : '') + '">' + lg + o.rest.map(ln).join('') + o.lines.map(ln).join('') + rib + o.after.map(ln).join('') + bt +
      (o.yearSegs ? '<div class="o-yr" style="text-decoration:none">' + segsHtml(o.yearSegs) + '</div>' : o.year ? '<div class="o-yr">' + esc(o.year) + '</div>' : '') + '</div>';
  }

  function coverPreview(c) {
    c = c || state.cover;
    const P = state.profile, col = c.color;
    if (c.model === 'aucune') {
      return '<div class="cpn">Pas de page de garde : le fichier commence par le sommaire. Tu ajoutes ensuite la page de ton école dans Word.</div>';
    }
    if (c.model === 'officiel') return officialPreview(c);
    const frame = c.model === 'cadre' ? 'border:5px double ' + col + ';' : 'border:1px solid #C4CBC6;';
    const title = c.model === 'moderne'
      ? '<div class="cp-band" style="background:' + col + '">' + M().coverTitle + '</div>'
      : '<div class="cp-t" style="color:' + (c.model === 'sobre' ? '#16211E' : col) + '">' + M().coverTitle + '</div>';
    return '<div class="cp" style="' + frame + '"><div class="cp-s">' + esc(P.ecole ? P.ecole.toUpperCase() : 'ÉCOLE') + '</div>' + title +
      '<div class="cp-m">' + esc(M().coverPrev(P)) + '</div>' +
      '<div class="cp-m"><b>' + esc(state.mode === 'expose' ? (members().join(', ') || 'Ton nom') : (P.nom || 'Ton nom')) + '</b></div></div>';
  }

  function logoStatusHtml(key) {
    return logos[key]
      ? 'Logo ajouté. <button type="button" class="linkbtn" data-action="rmLogo" data-key="' + key + '">Retirer</button>'
      : 'Facultatif. Image PNG ou JPG.';
  }
  function setLogoStatus(key, msg) {
    const el = document.getElementById('logo-st-' + key);
    if (!el) return;
    if (msg) { el.textContent = msg; } else { el.innerHTML = logoStatusHtml(key); }
  }

  function coverPanel() {
    const c = state.cover;
    const models = COVER_MODELS.map(function (m) {
      return '<label class="opt"><input type="radio" name="cover-model" data-cover="model" value="' + m[0] + '"' + (c.model === m[0] ? ' checked' : '') + '>' + esc(m[1]) + '</label>';
    }).join('');
    const colors = COVER_COLORS.map(function (m) {
      return '<label class="sw" title="' + m[1] + '"><input type="radio" name="cover-color" data-cover="color" value="' + m[0] + '" aria-label="' + m[1] + '"' + (c.color.toLowerCase() === m[0].toLowerCase() ? ' checked' : '') + '><span style="background:' + m[0] + '"></span></label>';
    }).join('');
    const bannerOpts = BANNER_STYLES.map(function (m) {
      return '<label class="opt"><input type="radio" name="cover-banner" data-cover="banner" value="' + m[0] + '"' + (c.banner === m[0] ? ' checked' : '') + '>' + esc(m[1]) + '</label>';
    }).join('');
    function logoField(key, label) {
      return '<div class="field"><label for="logo-' + key + '">' + label + '</label>' +
        '<input class="in" type="file" id="logo-' + key + '" data-logo="' + key + '" accept="image/png,image/jpeg,image/webp">' +
        '<div class="hint" id="logo-st-' + key + '">' + logoStatusHtml(key) + '</div></div>';
    }
    const cc = coverCat || cat();
    const ctabs = COVER_CATS.map(function (k) { return '<button type="button" data-action="coverCat" data-cat="' + k[0] + '" class="' + (cc === k[0] ? 'on' : '') + '">' + k[1] + '</button>'; }).join('');
    const cards = (window.COVER_TEMPLATES || []).filter(function (t) { return t.cats.indexOf(cc) >= 0; }).map(function (t) {
      const cfg = tplCfg(t, c);
      return '<button type="button" class="gcard' + (c.template === t.id ? ' on' : '') + '" data-action="pickCover" data-tid="' + t.id + '" aria-pressed="' + (c.template === t.id) + '">' +
        '<div class="gp">' + coverPreview(cfg) + '</div><div class="gn">' + esc(t.nom) + '</div></button>';
    }).join('');
    return '<div class="panel"><h2>Page de garde</h2>' +
      '<p class="hint">Choisis un modèle : il se remplit avec tes informations. Tu peux ensuite changer la couleur, l\'en-tête et les logos plus bas.</p>' +
      '<div class="tabs">' + ctabs + '</div><div class="gal" id="gal">' + cards + '</div>' +
      coverInfoHtml() +
      '<div class="lbl">Ou choisis directement le moteur</div>' +
      '<div class="opts" role="radiogroup" aria-label="Modèle de page de garde">' + models + '</div>' +
      '<div class="lbl">Couleur</div><div class="swatches" role="radiogroup" aria-label="Couleur">' + colors + '</div>' +
      '<div id="cover-header-box" style="' + (c.model === 'officiel' ? '' : 'display:none') + '"><div class="field"><label for="cover-preset">En-tête officiel : modèle de départ</label>' +
      '<select class="in" id="cover-preset" data-cover="preset" aria-label="Modèle d\'en-tête">' + HEADER_PRESETS.map(function (h) { return '<option value="' + h[0] + '">' + esc(h[1]) + '</option>'; }).join('') + '</select></div>' +
      headerFieldsHtml() +
      '<div class="lbl">Style de la zone du thème</div><div class="opts" role="radiogroup" aria-label="Style de la zone du thème">' + bannerOpts + '</div></div>' +
      logoField('ecole', 'Logo de gauche (école ou université)') + logoField('entreprise', 'Logo de droite (université, ministère, entreprise)') +
      '<div class="lbl">Aperçu</div><div id="cover-prev">' + coverPreview() + '</div></div>';
  }

  function renderStep3() {
    const lb = labels(state.sections);
    const blocks = state.sections.map(function (s, i) {
      const title = (lb[i] ? lb[i] + ' ' : '') + s.title;
      const h = s.level === 1 ? 'h2' : 'h3';
      return '<div class="sec"><' + h + '>' + esc(title) + '</' + h + '>' +
        '<p class="guide">' + esc(s.guide) + '</p>' +
        '<label class="lbl" for="n-' + s.id + '">Tes idées (en vrac, comme tu veux)</label>' +
        '<textarea class="ta" id="n-' + s.id + '" data-nid="' + s.id + '" rows="4" placeholder="Écris les points, les faits, les exemples de cette partie, même sans faire de belles phrases">' + esc(s.notes) + '</textarea>' +
        '<div class="tools"><button type="button" class="main" data-action="develop" data-sid="' + s.id + '">Développer mon idée</button></div>' +
        '<div class="dev" id="dev-' + s.id + '" role="status"></div>' +
        '<label class="lbl" for="t-' + s.id + '">' + esc(M().textLabel) + '</label>' +
        '<textarea class="ta" id="t-' + s.id + '" data-sid="' + s.id + '" rows="7" placeholder="Le texte rédigé apparaît ici après « Développer mon idée ». Tu peux aussi l\'écrire toi-même.">' + esc(s.text) + '</textarea>' +
        '<div class="wc" id="wc-' + s.id + '">' + words(finalText(s)) + ' mots</div>' + figBox(s.id) + '</div>';
    }).join('');
    const notes = state.profile.missions && state.profile.missions.trim()
      ? '<div class="note"><b>' + esc(M().notesTitle) + '</b>' + esc(state.profile.missions).replace(/\n/g, '<br>') + '</div>' : '';
    return header(3) +
      '<div><h1>' + esc(M().writeH1) + '</h1><p class="lead">' + esc(M().writeLead) + '</p></div>' +
      notes +
      '<label class="opt"><input type="checkbox" data-research="1"' + (state.research ? ' checked' : '') + '><span><b>Appuyer la rédaction sur des sources fiables du web</b> : ' + (state.mode === 'expose' ? "le site cherche des pages sur chaque partie, rédige à partir de ce qu'il trouve" : "le site cherche le contexte (secteur, notions techniques, informations publiques) et rédige avec tes notes ; ce que tu as fait toi-même ne vient que de toi, et ce qui manque est marqué [À compléter]") + ', et ajoute les pages utilisées à la liste des sources en dernière page. Un peu plus long (20 à 40 s par partie).</span></label>' +
      '<div class="tools"><button type="button" class="main" data-action="autoAll">Générer tout ' + (state.mode === 'expose' ? "l'exposé" : 'le rapport') + ' automatiquement</button></div><div class="hint">Un clic : le site rédige toutes les parties vides sans te poser de questions' + (state.mode === 'expose' ? ' (avec recherche de sources si la case est cochée)' : ' à partir de ton sujet, de tes missions et de la recherche ; les passages que seul toi peux écrire sont marqués [À compléter : …]') + '. Tu relis et corriges ensuite.</div>' +
      '<div class="tools"><button type="button" class="main" data-action="developAll">Développer toutes les parties remplies</button></div>' +
      '<div class="progress" id="dev-all" role="status"></div>' + blocks +
      sourcesPanel() + coverPanel() + payPanel() +
      '<div class="saved" id="saved">Sauvegardé sur cet appareil</div>' +
      '<p class="hint">À l\'ouverture du fichier dans Word, réponds « Oui » à la question sur la mise à jour : le sommaire se remplit alors. S\'il reste vide, fais un clic droit sur le sommaire, puis « Mettre à jour les champs ».</p>' +
      '<div class="actions">' + (canDownload() ? '<button class="btn" type="button" data-action="download">Télécharger le fichier Word</button>' : '') +
      '<button class="btn ghost" type="button" data-action="to2">← Retour au plan</button>' +
      '<button class="btn ghost" type="button" data-action="to1">← Modifier mes informations</button>' +
      '<button class="btn ghost" type="button" data-action="reset">Tout effacer et recommencer</button></div>';
  }

  const SOON = [
    ['Résumé de cours', 'Colle ton cours et reçois un résumé clair et une fiche de révision.'],
    ['Quiz de révision', 'Des questions pour tester ce que tu as retenu.'],
    ['Correction d\'exercices', 'Vérifie ta démarche et comprends tes erreurs.'],
    ['Mémoire', 'Plan, rédaction et mise en forme de ton mémoire.']
  ];
  function hasWork(k) {
    const P = state.profile;
    return state.mode === k && (hasText() || String(P.nom || '').trim() || String(P.sujet || '').trim() || String(P.entreprise || '').trim());
  }
  const HOME_DESC = {
    stage: 'Plan adapté à ton école, rédaction de chaque partie à partir de tes idées, page de garde et fichier Word.',
    expose: 'Plan, texte rédigé de chaque partie à partir de ton sujet et de tes points, page de garde et fichier Word.'
  };
  const HOME_ICON = {
    stage: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="15" width="36" height="25" rx="3"/><path d="M17 15v-4a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4"/><path d="M6 26h36"/><path d="M21 26v4h6v-4"/></svg>',
    expose: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="8" width="36" height="24" rx="3"/><path d="M24 32v8M16 41h16"/><path d="M14 25l7-7 5 5 8-9"/></svg>'
  };
  function renderHome() {
    const cards = Object.keys(MODES).map(function (k) {
      return '<button type="button" class="hcard main" data-action="open" data-mode="' + k + '">' + (HOME_ICON[k] || '') +
        '<b>' + esc(MODES[k].name) + '</b>' +
        '<span class="d">' + esc(HOME_DESC[k] || '') + '</span>' +
        '<span class="go">' + (hasWork(k) ? 'Reprendre mon travail →' : 'Commencer →') + '</span></button>';
    }).join('');
    const soon = SOON.map(function (x) {
      return '<div class="hcard soon"><b>' + esc(x[0]) + '</b><span class="d">' + esc(x[1]) + '</span><span class="tag">Bientôt</span></div>';
    }).join('');
    return '<div class="top"><div class="brand">' + esc(APP_NAME) + '</div></div>' +
      '<div><h1>Que veux-tu faire ?</h1><p class="lead">Choisis ce que tu veux préparer. Le site te guide ensuite, étape par étape.</p></div>' +
      '<div class="hgrid mainG">' + cards + '</div>' +
      '<div class="lbl">Bientôt disponible</div><div class="hgrid soonG">' + soon + '</div>';
  }

  let lastScreen = '';
  function render(error) {
    const screen = view === 'home' ? 'home' : 'app:' + state.step;
    const y = window.pageYOffset || 0;
    app.className = view === 'home' ? 'app wide' : 'app';
    if (view === 'home') { app.innerHTML = renderHome(); }
    else { app.innerHTML = state.step === 1 ? renderStep1(error) : state.step === 2 ? renderStep2() : renderStep3(); }
    window.scrollTo(0, screen === lastScreen ? y : 0);
    lastScreen = screen;
  }

  let busy = false;
  function parentTitle(idx) {
    for (let j = idx - 1; j >= 0; j--) { if (state.sections[j].level === 1) return state.sections[j].title; }
    return '';
  }
  function setDev(id, html, cls) {
    const el = document.getElementById('dev-' + id);
    if (el) { el.className = 'dev ' + (cls || ''); el.innerHTML = html; }
  }
  function develop(id, auto) {
    let idx = -1;
    state.sections.forEach(function (x, k) { if (x.id === id) idx = k; });
    if (idx < 0) return Promise.resolve('error');
    const s = state.sections[idx];
    setDev(id, 'Rédaction en cours…', '');
    return fetchWithTimeout('/api/develop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titre: s.title,
        parent: s.level === 2 ? parentTitle(idx) : '',
        consigne: s.guide,
        notes: s.notes || '',
        mode: state.mode,
        filiere: state.profile.filiere,
        entreprise: state.profile.entreprise,
        sujet: state.profile.sujet,
        matiere: state.profile.matiere,
        duree: state.profile.duree,
        recherche: !!state.research,
        missions: state.profile.missions,
        auto: !!auto,
        niveau: state.profile.niveau,
        pages: state.profile.pages,
        nbParties: state.sections.filter(function (x) { return x.level === 1 && !x.nonum; }).length,
        autres: state.sections.filter(function (x) { return x.id !== s.id; }).map(function (x) { return x.title; }).slice(0, 30)
      })
    }).then(function (r) {
      return r.json().catch(function () { return { status: 'error', message: 'Réponse illisible.' }; });
    }).then(function (d) {
      if (d.status === 'ok') {
        s.text = d.texte;
        flushSave(); save();
        const ta = document.getElementById('t-' + id);
        if (ta) ta.value = d.texte;
        const wc = document.getElementById('wc-' + id);
        if (wc) wc.textContent = words(d.texte) + ' mots';
        const nAdded = Array.isArray(d.sources) ? addWebSources(d.sources) : 0;
        const srcMsg = d.recherche ? (d.sources && d.sources.length ? ' ' + d.sources.length + ' source(s) utilisée(s) : ' + (nAdded ? nAdded + ' ajoutée(s) à ta liste en dernière page.' : 'déjà dans ta liste.') : ' Aucune source n\'a pu être confirmée pour cette partie : vérifie les informations avant de les garder.') : '';
        setDev(id, 'Texte proposé ci-dessous. Relis-le et corrige-le : ce travail est le tien.' + srcMsg, 'ok');
        return 'ok';
      }
      if (d.status === 'questions') {
        const qs = (d.questions || []).map(function (q) { return '<li>' + esc(q) + '</li>'; }).join('');
        setDev(id, '<b>Pour bien rédiger cette partie, ajoute ces précisions dans tes idées :</b><ul>' + qs + '</ul>', 'warn');
        return 'questions';
      }
      setDev(id, esc(d.message || 'Une erreur est survenue.'), 'err');
      return d.status === 'unavailable' ? 'unavailable' : 'error';
    }).catch(function (e) {
      setDev(id, e && e.name === 'AbortError' ? 'Le service met trop de temps, réessaie.' : 'Connexion impossible. Vérifie internet et réessaie.', 'err');
      return 'error';
    });
  }
  function developOne(id) {
    if (busy) return;
    let s = null;
    state.sections.forEach(function (x) { if (x.id === id) s = x; });
    if (!s) return;
    if (s.text && s.text.trim() && !confirm('Remplacer le texte actuel de cette partie par une nouvelle version ?')) return;
    busy = true;
    develop(id).then(function () { busy = false; });
  }
  function developAll(auto) {
    if (busy) return;
    auto = auto === true;
    const box = document.getElementById('dev-all');
    const ids = state.sections.filter(function (x) {
      const rs = state.research || auto;
      return (rs || (x.notes || '').trim().length >= 15) && !(x.text || '').trim();
    }).map(function (x) { return x.id; });
    if (!ids.length) {
      box.textContent = state.research || auto ? 'Toutes les parties ont déjà un texte : elles ne sont pas refaites.' : "Écris d'abord tes idées dans les parties (au moins une phrase). Les parties qui ont déjà un texte ne sont pas refaites.";
      return;
    }
    busy = true;
    let k = 0, done = 0, stop = false;
    function next() {
      if (k >= ids.length || stop) {
        busy = false;
        const todo = state.sections.filter(function (x) { return /\[À compléter/.test(x.text || ''); }).length;
        box.textContent = done + ' partie(s) rédigée(s) sur ' + ids.length + '.' + (stop ? ' Arrêt : la rédaction automatique est indisponible.' : '') + (todo ? ' ' + todo + ' partie(s) contiennent un passage [À compléter] : seul toi peux l\'écrire, remplace-le avant de télécharger.' : '') + ' Relis chaque texte.';
        return;
      }
      box.textContent = 'Rédaction de la partie ' + (k + 1) + ' sur ' + ids.length + '…';
      develop(ids[k], auto).then(function (r) {
        if (r === 'ok') done++;
        if (r === 'unavailable') stop = true;
        k++;
        next();
      });
    }
    next();
  }

  const NONUM = /^(introduction|conclusion|remerciements|r[ée]sum[ée]|sommaire|bibliographie|annexes?|avant-propos|d[ée]dicace)/i;
  function parseCustom(txt) {
    const out = [];
    txt.split(/\r?\n/).forEach(function (raw) {
      if (!raw.trim()) return;
      const line = raw.trim();
      let level = 1;
      if (/^\d+\.\d+/.test(line) || /^(\s{2,}|\t)/.test(raw) || /^[-•*]\s/.test(line)) level = 2;
      let title = line.replace(/^(\d+(\.\d+)*[.)]?|[IVXLC]+[.)]|[A-Za-z][.)]|[-•*])\s+/, '').trim();
      if (!title) title = line;
      if (level === 2 && out.length === 0) level = 1;
      const nonum = level === 1 && NONUM.test(title);
      let guide;
      if (/^introduction/i.test(title)) guide = M().introGuide;
      else if (/^conclusion/i.test(title)) guide = M().conclGuide;
      else if (level === 1) guide = "Que veux-tu présenter dans cette partie ? Écris l'essentiel en quelques paragraphes.";
      else guide = "Quels points précis veux-tu développer ici ?";
      out.push(sec(level, title, guide, nonum));
    });
    return out;
  }

  function slug(t) {
    return String(t || 'rapport').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'rapport';
  }

  function ribbonTail(hex, right) {
    try {
      const cv = document.createElement('canvas');
      if (!cv || !cv.getContext) return null;
      const g = cv.getContext('2d');
      if (!g) return null;
      cv.width = 200; cv.height = 130;
      g.fillStyle = '#' + hex; g.strokeStyle = '#111111'; g.lineWidth = 3; g.lineJoin = 'round';
      g.beginPath();
      if (!right) { g.moveTo(2, 8); g.lineTo(198, 8); g.lineTo(198, 122); g.lineTo(2, 122); g.lineTo(52, 65); }
      else { g.moveTo(2, 8); g.lineTo(198, 8); g.lineTo(148, 65); g.lineTo(198, 122); g.lineTo(2, 122); }
      g.closePath(); g.fill(); g.stroke();
      return fromB64(cv.toDataURL('image/png').split(',')[1]);
    } catch (e) { return null; }
  }

  function buildOfficialCover(d, FONT, col, centered, none, noBorders, cellNoBorders) {
    const o = officialCover(), out = [];
    const tbl = { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none };
    function run(x, size, color) {
      return new d.TextRun({ text: x.t, font: FONT, size: size, bold: !!x.bold, underline: x.ul ? {} : undefined, color: color || (x.color ? x.color.replace('#', '') : '000000') });
    }
    function segRuns(a, size) {
      return a.map(function (g) { return new d.TextRun({ text: g.t, font: FONT, size: size, bold: !!g.b, italics: !!g.i, underline: g.ul ? {} : undefined, color: g.color ? g.color.replace('#', '') : '000000' }); });
    }
    function para(x, size, align, after, color) {
      if (x.row) {
        return new d.Paragraph({ spacing: { before: 120, after: 80 }, tabStops: [{ type: d.TabStopType.RIGHT, position: 9026 }],
          children: segRuns(x.row[0], size).concat([new d.TextRun({ children: [new d.Tab()], font: FONT, size: size })], segRuns(x.row[1], size)) });
      }
      if (x.segs) {
        return new d.Paragraph({ alignment: x.left ? d.AlignmentType.LEFT : (align || d.AlignmentType.CENTER), spacing: { before: x.left ? 60 : 160, after: 80 }, children: segRuns(x.segs, x.big ? 26 : size) });
      }
      return new d.Paragraph({
        alignment: align || d.AlignmentType.CENTER,
        spacing: { before: 0, after: after == null ? 40 : after },
        children: [run(x, x.star ? 20 : (x.big ? 26 : size), color)]
      });
    }
    function cell(pct, kids, align) {
      return new d.TableCell({ borders: noBorders, width: { size: pct, type: d.WidthType.DXA }, verticalAlign: d.VerticalAlign.CENTER, children: kids });
    }
    function logoPara(l, align) {
      if (!l) return new d.Paragraph({ children: [] });
      let h = 72, w = Math.round(l.w * h / l.h);
      if (w > 110) { w = 110; h = Math.round(l.h * w / l.w); }
      return new d.Paragraph({ alignment: align, children: [new d.ImageRun({ type: 'png', data: l.data, transformation: { width: w, height: h } })] });
    }

    const topKids = o.top.map(function (x) { return para(x, 22, d.AlignmentType.CENTER, 40); });
    if (logos.ecole || logos.entreprise) {
      out.push(new d.Table({
        width: { size: 9026, type: d.WidthType.DXA }, columnWidths: [1800, 5426, 1800], borders: tbl,
        rows: [new d.TableRow({ children: [
          cell(1800, [logoPara(logos.ecole, d.AlignmentType.LEFT)]),
          cell(5426, topKids.length ? topKids : [new d.Paragraph({ children: [] })]),
          cell(1800, [logoPara(logos.entreprise, d.AlignmentType.RIGHT)])
        ] })]
      }));
    } else {
      topKids.forEach(function (k) { out.push(k); });
    }
    o.rest.forEach(function (x) { out.push(para(x, 20, d.AlignmentType.CENTER, 50)); });
    o.lines.forEach(function (x) { out.push(para(x, 22, d.AlignmentType.CENTER, 50)); });

    const bst = state.cover.banner;
    out.push(new d.Paragraph({ spacing: { before: 500, after: 0 }, children: [] }));
    const txtColor = (bst === 'ruban' || bst === 'bandeau') ? (state.cover.bannerText ? state.cover.bannerText.replace('#', '') : 'FFFFFF') : (bst === 'lignes' ? col : '000000');
    const bannerKids = o.banner.map(function (x) { return para(x, 26, d.AlignmentType.CENTER, 60, txtColor); });
    const FULL = 9026, TAIL = 1400;
    function boxTable(kids, border) {
      const noneBorder = { style: d.BorderStyle.NONE, size: 0, color: 'auto' };
      const bd = border ? { style: border.style, size: border.size, color: col } : noneBorder;
      const cellBorders = { top: bd, bottom: bd, left: bd, right: bd };
      if (!border) {
        cellBorders.top = noneBorder;
        cellBorders.bottom = noneBorder;
        cellBorders.left = noneBorder;
        cellBorders.right = noneBorder;
      }
      return new d.Table({
        width: { size: FULL, type: d.WidthType.DXA }, columnWidths: [FULL], borders: { top: noneBorder, bottom: noneBorder, left: noneBorder, right: noneBorder, insideHorizontal: noneBorder, insideVertical: noneBorder },
        rows: [new d.TableRow({ children: [new d.TableCell({
          borders: cellBorders,
          width: { size: FULL, type: d.WidthType.DXA },
          shading: border ? undefined : { type: d.ShadingType.CLEAR, fill: col, color: 'auto' },
          verticalAlign: d.VerticalAlign.CENTER,
          margins: { top: 200, bottom: 200, left: 200, right: 200 },
          children: kids
        })] })]
      });
    }
    if (bst === 'lignes') {
      const ln = { style: d.BorderStyle.SINGLE, size: 18, color: col, space: 10 };
      o.banner.forEach(function (x) {
        out.push(new d.Paragraph({ alignment: d.AlignmentType.CENTER, border: { top: ln, bottom: ln }, spacing: { before: 60, after: 60 },
          children: [new d.TextRun({ text: x.t, font: FONT, size: 28, bold: true, color: col })] }));
      });
    } else if (bst === 'encadre') {
      out.push(boxTable(bannerKids, { style: d.BorderStyle.SINGLE, size: 18 }));
    } else if (bst === 'double') {
      out.push(boxTable(bannerKids, { style: d.BorderStyle.DOUBLE, size: 18 }));
    } else if (bst === 'bandeau') {
      out.push(boxTable(bannerKids, null));
    } else {
      const tailL = ribbonTail(col, false), tailR = ribbonTail(col, true);
      const okT = !!(tailL && tailR);
      const tailCell = function (data, align) {
        return new d.TableCell({ borders: noBorders, width: { size: TAIL, type: d.WidthType.DXA }, verticalAlign: d.VerticalAlign.CENTER,
          children: [new d.Paragraph({ alignment: align, children: [new d.ImageRun({ type: 'png', data: data, transformation: { width: 84, height: 55 } })] })] });
      };
      const mid = new d.TableCell({
        borders: noBorders,
        width: { size: okT ? FULL - 2 * TAIL : FULL, type: d.WidthType.DXA },
        shading: { type: d.ShadingType.CLEAR, fill: col, color: 'auto' },
        verticalAlign: d.VerticalAlign.CENTER,
        margins: { top: 200, bottom: 200, left: 200, right: 200 },
        children: bannerKids
      });
      out.push(new d.Table({
        width: { size: FULL, type: d.WidthType.DXA }, columnWidths: okT ? [TAIL, FULL - 2 * TAIL, TAIL] : [FULL], borders: tblNoBorders,
        rows: [new d.TableRow({ children: okT ? [tailCell(tailL, d.AlignmentType.RIGHT), mid, tailCell(tailR, d.AlignmentType.LEFT)] : [mid] })]
      }));
    }
    o.after.forEach(function (x, k) { out.push(para(x, 22, d.AlignmentType.CENTER, 50)); out.splice(out.length - 1, 1, new d.Paragraph({ alignment: d.AlignmentType.CENTER, spacing: { before: k ? 0 : 300, after: 50 }, children: [run(x, 22)] })); });
    out.push(new d.Paragraph({ spacing: { before: 700, after: 0 }, children: [] }));

    const L = [new d.Paragraph({ spacing: { after: 120 }, children: [new d.TextRun({ text: o.left.title, font: FONT, size: 22, bold: true, underline: {}, color: o.left.color ? o.left.color.replace('#', '') : undefined })] })];
    o.left.names.forEach(function (n, k) {
      L.push(new d.Paragraph({ spacing: { after: 80 }, indent: o.left.numbered ? { left: 300 } : undefined,
        children: [new d.TextRun({ text: (o.left.numbered ? (k + 1) + '.  ' : '') + n, font: FONT, size: 21, bold: true })] }));
    });
    const R = [];
    if (o.right) {
      R.push(new d.Paragraph({ alignment: d.AlignmentType.CENTER, spacing: { after: 120 }, children: [new d.TextRun({ text: o.right.title, font: FONT, size: 22, bold: true, underline: {}, color: o.right.color ? o.right.color.replace('#', '') : undefined })] }));
      R.push(new d.Paragraph({ alignment: d.AlignmentType.CENTER, spacing: { after: 80 }, children: [new d.TextRun({ text: o.right.name, font: FONT, size: 21, bold: true })] }));
    }
    if (!R.length) R.push(new d.Paragraph({ children: [] }));
    const noneBorder = { style: d.BorderStyle.NONE, size: 0, color: 'auto' };
    const tblNoBorders = { top: noneBorder, bottom: noneBorder, left: noneBorder, right: noneBorder, insideHorizontal: noneBorder, insideVertical: noneBorder };
    out.push(new d.Table({
      width: { size: 9026, type: d.WidthType.DXA }, columnWidths: [4964, 4062], borders: tblNoBorders,
      rows: [new d.TableRow({ children: [
        new d.TableCell({ borders: tblNoBorders, width: { size: 4964, type: d.WidthType.DXA }, children: L }),
        new d.TableCell({ borders: tblNoBorders, width: { size: 4062, type: d.WidthType.DXA }, children: R })
      ] })]
    }));

    if (o.yearSegs) {
      out.push(new d.Paragraph({ alignment: d.AlignmentType.CENTER, spacing: { before: 900, after: 0 }, children: segRuns(o.yearSegs, 22) }));
    } else if (o.year) {
      out.push(new d.Paragraph({ alignment: d.AlignmentType.CENTER, spacing: { before: 900, after: 0 },
        children: [new d.TextRun({ text: o.year, font: FONT, size: 20, bold: true, underline: {} })] }));
    }
    return out;
  }

  function readableColor(hex) {
    const c = String(hex || '').replace('#', '');
    if (!/^[0-9A-Fa-f]{6}$/.test(c)) return '000000';
    function lum(r, g, b) {
      return [r, g, b].map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); })
        .reduce(function (a, v, i) { return a + v * [0.2126, 0.7152, 0.0722][i]; }, 0);
    }
    let rgb = [0, 2, 4].map(function (i) { return parseInt(c.substr(i, 2), 16); });
    for (let k = 0; k < 12; k++) {
      if (1.05 / (lum(rgb[0], rgb[1], rgb[2]) + 0.05) >= 4.5) break;
      rgb = rgb.map(function (v) { return Math.round(v * 0.8); });
    }
    return rgb.map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join('').toUpperCase();
  }

  function buildDoc() {
    const d = window.docx;
    const P = state.profile;
    const FONT = 'Times New Roman';

    const model = state.cover.model;
    const col = state.cover.color.replace('#', '');
    const headColor = model === 'sobre' ? '000000' : readableColor(col);

    function centered(text, size, bold, before, after, color) {
      return new d.Paragraph({
        alignment: d.AlignmentType.CENTER,
        spacing: { before: before || 0, after: after || 120 },
        children: [new d.TextRun({ text: text, size: size, bold: !!bold, font: FONT, color: color || '000000' })]
      });
    }

    const none = { style: d.BorderStyle.NONE, size: 0, color: 'FFFFFF' };
    const noBorders = { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none };
    const cellNoBorders = { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none };

    function logoRun(l) {
      let h = 70, w = Math.round(l.w * h / l.h);
      if (w > 170) { w = 170; h = Math.round(l.h * w / l.w); }
      return new d.ImageRun({ type: 'png', data: l.data, transformation: { width: w, height: h } });
    }
    function logoCell(l, align) {
      return new d.TableCell({
        borders: noBorders,
        width: { size: 50, type: d.WidthType.PERCENTAGE },
        children: [new d.Paragraph({ alignment: align, children: l ? [logoRun(l)] : [] })]
      });
    }

    let cover = [];
    if (model === 'officiel') {
      cover = buildOfficialCover(d, FONT, col, centered, none, noBorders, cellNoBorders);
    } else {
    if (logos.ecole || (M().logoEntreprise && logos.entreprise)) {
      cover.push(new d.Table({
        width: { size: 100, type: d.WidthType.PERCENTAGE },
        borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none },
        rows: [new d.TableRow({ children: [logoCell(logos.ecole, d.AlignmentType.LEFT), logoCell(M().logoEntreprise ? logos.entreprise : null, d.AlignmentType.RIGHT)] })]
      }));
    }
    if (P.ecole) cover.push(centered(P.ecole.toUpperCase(), 30, true, 240, 120));
    if (P.filiere) cover.push(centered('Filière : ' + P.filiere, 26, false, 0, 120));
    if (model === 'moderne') {
      cover.push(new d.Paragraph({ spacing: { before: 1800, after: 0 }, children: [] }));
      cover.push(new d.Table({
        width: { size: 100, type: d.WidthType.PERCENTAGE },
        borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none },
        rows: [new d.TableRow({ children: [new d.TableCell({
          borders: noBorders,
          shading: { type: d.ShadingType.CLEAR, fill: col, color: 'auto' },
          margins: { top: 300, bottom: 300, left: 200, right: 200 },
          children: [centered(M().coverTitle, 56, true, 0, 0, 'FFFFFF')]
        })] })]
      }));
      cover.push(new d.Paragraph({ spacing: { before: 0, after: 360 }, children: [] }));
    } else {
      cover.push(centered(M().coverTitle, 60, true, 2800, 360, headColor));
    }
    M().coverLines(P).forEach(function (ln) {
      cover.push(centered(ln[0], ln[1], ln[2], ln[3], ln[4], ln[5] === 'head' ? headColor : undefined));
    });
    const mem = state.mode === 'expose' ? members() : [];
    if (mem.length > 1) {
      cover.push(centered('Présenté par :', 28, true, M().presentedBefore, 120));
      mem.forEach(function (nm) { cover.push(centered(nm, 28, false, 0, 60)); });
    } else if (mem.length === 1 || (state.mode !== 'expose' && P.nom)) {
      cover.push(centered('Présenté par : ' + (mem.length ? mem[0] : P.nom), 28, true, M().presentedBefore, 120));
    }
    if (P.annee) cover.push(centered('Année universitaire : ' + P.annee, 26, false, 600, 120));
    }

    const main = [];
    main.push(centered('SOMMAIRE', 30, true, 0, 240, headColor));

    function tocEntry(text, level, pageNum) {
      const indent = level === 2 ? 720 : 0;
      const size = level === 1 ? 24 : 22;
      const bold = level === 1;
      return new d.Paragraph({
        alignment: d.AlignmentType.LEFT,
        spacing: { before: 60, after: 60, line: 360 },
        indent: indent > 0 ? { left: indent } : undefined,
        tabStops: [{ type: d.TabStopType.RIGHT, position: 8500, leader: d.TabStopLeader.DOT }],
        children: [
          new d.TextRun({ text: text, font: FONT, size: size, bold: bold, color: '000000' }),
          new d.TextRun({ children: [new d.Tab()], font: FONT, size: size }),
          new d.TextRun({ text: String(pageNum), font: FONT, size: size, bold: bold, color: '000000' })
        ]
      });
    }

    let estimatedPage = 3;
    const lb = labels(state.sections);
    state.sections.forEach(function (s, i) {
      const title = (lb[i] ? lb[i] + '  ' : '') + (s.level === 1 ? s.title.toUpperCase() : s.title);
      main.push(tocEntry(title, s.level, estimatedPage));
      let lines = String(finalText(s)).split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean);
      if (!lines.length) lines = ['[À compléter]'];
      const wordsCount = lines.join(' ').split(/\s+/).filter(Boolean).length;
      const figsCount = (figs[s.id] || []).length;
      estimatedPage += Math.max(1, Math.ceil((wordsCount / 350) + (figsCount * 0.5)));
    });

    if (figCount() > 0) {
      main.push(new d.Paragraph({ pageBreakBefore: true, alignment: d.AlignmentType.CENTER, spacing: { after: 240 },
        children: [new d.TextRun({ text: 'LISTE DES FIGURES', font: FONT, size: 30, bold: true, color: headColor })] }));
      main.push(new d.TableOfContents('Liste des figures', { hyperlink: true, captionLabelIncludingNumbers: 'Figure' }));
    }

    state.sections.forEach(function (s, i) {
      const title = (lb[i] ? lb[i] + '  ' : '') + (s.level === 1 ? s.title.toUpperCase() : s.title);
      main.push(new d.Paragraph({
        heading: s.level === 1 ? d.HeadingLevel.HEADING_1 : d.HeadingLevel.HEADING_2,
        pageBreakBefore: i === 0,
        keepNext: true,
        spacing: { before: i === 0 ? 0 : (s.level === 1 ? 480 : 300), after: 160 },
        children: [new d.TextRun({ text: title, font: FONT })]
      }));
      let lines = String(finalText(s)).split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean);
      if (!lines.length) lines = ['[À compléter]'];
      lines.forEach(function (line) {
        main.push(new d.Paragraph({
          alignment: d.AlignmentType.JUSTIFIED,
          spacing: { line: 360, after: 120 },
          children: [new d.TextRun({ text: line, font: FONT, size: 24, italics: line === '[À compléter]' })]
        }));
      });
      (figs[s.id] || []).forEach(function (f) {
        figNo += 1;
        const sc = Math.min(1, 470 / f.w, 360 / f.h);
        main.push(new d.Paragraph({
          alignment: d.AlignmentType.CENTER, keepNext: true, spacing: { before: 160, after: 60 },
          children: [new d.ImageRun({ type: 'jpg', data: fromB64(f.d), transformation: { width: Math.max(1, Math.round(f.w * sc)), height: Math.max(1, Math.round(f.h * sc)) } })]
        }));
        main.push(new d.Paragraph({
          alignment: d.AlignmentType.CENTER, spacing: { after: 280 },
          children: [
            new d.TextRun({ text: 'Figure ', font: FONT, size: 22, bold: true }),
            new d.SimpleField('SEQ Figure \\* ARABIC', String(figNo)),
            new d.TextRun({ text: f.cap ? ' : ' + f.cap : '', font: FONT, size: 22, italics: true })
          ]
        }));
      });
    });
    if (state.sources.length) {
      main.push(new d.Paragraph({ heading: d.HeadingLevel.HEADING_1, pageBreakBefore: true, keepNext: true, children: [new d.TextRun({ text: 'SOURCES ET RÉFÉRENCES', font: FONT })] }));
      const numbered = state.citeStyle === 'simple';
      const srcList = state.sources.slice();
      if (!numbered) srcList.sort(function (x, y) { return x.localeCompare(y, 'fr', { sensitivity: 'base' }); });
      srcList.forEach(function (src, i) {
        main.push(new d.Paragraph({
          alignment: d.AlignmentType.LEFT, spacing: { line: 300, after: 140 }, indent: { left: 560, hanging: 560 },
          children: [new d.TextRun({ text: (numbered ? '[' + (i + 1) + ']  ' : '') + src, font: FONT, size: 24 })]
        }));
      });
    }

    let coverProps = {};
    if (model === 'cadre' || model === 'officiel') {
      const bd = state.cover.art && /^[A-Za-z0-9]+$/.test(state.cover.art) ? { style: state.cover.art, size: 24, color: 'auto', space: 24 } : { style: d.BorderStyle.DOUBLE, size: 18, color: col, space: 24 };
      coverProps = {
        page: {
          borders: {
            pageBorders: { display: d.PageBorderDisplay.ALL_PAGES, offsetFrom: d.PageBorderOffsetFrom.PAGE },
            pageBorderTop: bd, pageBorderRight: bd, pageBorderBottom: bd, pageBorderLeft: bd
          }
        }
      };
    }

    const footer = new d.Footer({
      children: [new d.Paragraph({
        alignment: d.AlignmentType.CENTER,
        children: [new d.TextRun({ children: [d.PageNumber.CURRENT], font: FONT, size: 22 })]
      })]
    });

    return new d.Document({
      creator: 'Assistant rapport de stage et exposé',
      title: M().docTitle,
      features: { updateFields: true },
      styles: {
        default: { document: { run: { font: FONT, size: 24 } } },
        paragraphStyles: [
          { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
            run: { font: FONT, size: 30, bold: true, color: headColor },
            paragraph: { alignment: d.AlignmentType.CENTER, spacing: { before: 240, after: 240 } } },
          { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
            run: { font: FONT, size: 26, bold: true, color: headColor },
            paragraph: { alignment: d.AlignmentType.CENTER, spacing: { before: 200, after: 160 } } }
        ]
      },
      sections: (model === 'aucune' ? [] : [{ properties: coverProps, children: cover }]).concat([
        { properties: { page: { pageNumbers: { start: 1 } } }, footers: { default: footer }, children: main }
      ])
    });
  }

  function download() {
    const nTodo = state.sections.filter(function (x) { return /\[À compléter/.test(x.text || ''); }).length;
    if (nTodo && !confirm(nTodo + " partie(s) contiennent encore un passage [À compléter]. Télécharger quand même ?")) return;
    if (!payCfg.enabled) { doDownload(); return; }
    if (!state.paid) { alert('Le téléchargement se fait après paiement.'); return; }
    fetchWithTimeout('/api/pay-check?id=' + encodeURIComponent(state.paid.id) + '&nonce=' + encodeURIComponent(state.paid.nonce))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.paid) { doDownload(); return; }
        alert("Ton paiement n'a pas pu être confirmé. Réessaie dans un moment. S'il persiste, écris-nous avec la référence " + state.paid.id + '.');
      })
      .catch(function (e) { alert(e && e.name === 'AbortError' ? 'Le service met trop de temps, réessaie.' : 'Connexion impossible. Vérifie internet et réessaie.'); });
  }

  function doDownload() {
    if (!window.docx) {
      alert("Le module qui crée le fichier Word n'a pas pu se charger. Vérifie ta connexion internet puis recharge la page.");
      return;
    }
    if (!hasText() && !confirm("Aucune partie n'est encore rédigée. Le fichier contiendra seulement le plan. Continuer ?")) return;
    const doc = buildDoc();
    window.docx.Packer.toBlob(doc).then(function (blob) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = M().fileBase(state.profile) + '.docx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    }).catch(function () {
      alert("Le fichier n'a pas pu être créé. Réessaie, ou recharge la page.");
    });
  }

  function setGroupSize(n) {
    if (!(n >= 1 && n <= MAX_MEMBRES) || n === state.profile.membres.length) return;
    const arr = state.profile.membres.slice(0, n);
    while (arr.length < n) arr.push('');
    state.profile.membres = arr;
    syncNom();
    debouncedSave();
    const y = window.pageYOffset || 0;
    render();
    if (window.scrollTo) window.scrollTo(0, y);
  }
  function missingFields() {
    return M().required.filter(function (r) { return !String(state.profile[r[0]] || '').trim(); }).map(function (r) { return r[1]; });
  }
  function confirmReplace() {
    return !hasText() || confirm('Ce changement remplace ton plan actuel et efface les textes déjà écrits. Continuer ?');
  }

  app.addEventListener('click', function (e) {
    const t = e.target.closest('button');
    if (!t) return;
    const tab = t.getAttribute('data-tab');
    if (tab) { state.tab = tab; flushSave(); save(); render(); return; }
    const a = t.getAttribute('data-action');
    if (!a) return;
    const i = parseInt(t.getAttribute('data-i'), 10);
    const list = state.sections;

    if (a === 'rmFig') {
      const rs = t.getAttribute('data-sid'), rf = t.getAttribute('data-fid');
      figs[rs] = (figs[rs] || []).filter(function (f) { return f.id !== rf; });
      saveFigs(); refreshFigs();
    }
    else if (a === 'findSources') { findSources(); }
    else if (a === 'addCite') { addCite(); }
    else if (a === 'addSource') { addSource(parseInt(t.getAttribute('data-i'), 10)); }
    else if (a === 'home') { view = 'home'; render(); }
    else if (a === 'open') {
      const nm = t.getAttribute('data-mode');
      if (MODES[nm]) {
        if (nm !== state.mode) {
          if (hasText() && !confirm('Tu as un travail en cours dans un autre type de document. Commencer celui-ci va effacer ce travail. Continuer ?')) return;
          state.mode = nm; state.sections = MODES[nm].plan(); state.tab = 'default'; state.customText = ''; state.step = 1;
          if (nm === 'expose' && state.profile.membres.length === 1 && String(state.profile.nom || '').trim()) state.profile.membres[0] = state.profile.nom;
        }
        view = 'app';
        flushSave(); save(); render();
      }
    }
    else if (a === 'goto') {
      const gs = parseInt(t.getAttribute('data-step'), 10);
      const gm = missingFields();
      if (gs >= 2 && gm.length) {
        state.step = 1; flushSave(); save(); render('Il manque : ' + gm.join(', ') + '.'); return;
      }
      if (gs === 3 && !list.length) { alert('Ajoute au moins une partie à ton plan.'); return; }
      if (gs >= 1 && gs <= 3 && gs !== state.step) { state.step = gs; flushSave(); save(); render(); }
    }
    else if (a === 'to1') { state.step = 1; flushSave(); save(); render(); }
    else if (a === 'next1') {
      const missing = missingFields();
      if (missing.length) { render('Il manque : ' + missing.join(', ') + '.'); return; }
      state.step = 2; flushSave(); save(); render();
    }
    else if (a === 'to2') { state.step = 2; flushSave(); save(); render(); }
    else if (a === 'to3') {
      if (!list.length) { alert('Ajoute au moins une partie à ton plan.'); return; }
      state.step = 3; flushSave(); save(); render();
    }
    else if (a === 'download') { download(); }
    else if (a === 'develop') { developOne(t.getAttribute('data-sid')); }
    else if (a === 'developAll') { developAll(); }
    else if (a === 'pay') { startPay(); }
    else if (a === 'checkPay') { checkPending(false); }
    else if (a === 'reset') {
      if (confirm('Tout effacer : tes réponses, ton plan et tes textes ? Cette action est définitive.' + (state.paid ? ' Tu as déjà payé : un nouveau rapport demandera un nouveau paiement.' : ''))) {
        state = freshState(state.mode); logos.ecole = null; logos.entreprise = null; saveLogos(); figs = {}; saveFigs(); foundSources = []; clearPending(); flushSave(); save(); render();
      }
    }
    else if (a === 'rmLogo') {
      const lk = t.getAttribute('data-key');
      if (lk === 'ecole' || lk === 'entreprise') {
        logos[lk] = null;
        saveLogos();
        const fi = document.getElementById('logo-' + lk); if (fi) fi.value = '';
        setLogoStatus(lk);
      }
    }
    else if (a === 'autoAll') { developAll(true); }
    else if (a === 'coverCat') { coverCat = t.getAttribute('data-cat') || ''; render(); }
    else if (a === 'pickCover') {
      const tid = t.getAttribute('data-tid');
      const tp = (window.COVER_TEMPLATES || []).filter(function (x) { return x.id === tid; })[0];
      if (tp) {
        const nc = tplCfg(tp, state.cover);
        Object.keys(nc).forEach(function (k) { state.cover[k] = nc[k]; });
        state.cover.template = tp.id;
        flushSave(); save(); render();
      }
    }
    else if (a === 'aidStart') {
      aid.busy = true; aid.msg = ''; render();
      postAi('/api/angle').then(function (d) {
        aid.busy = false;
        if (d.status === 'questions') { aid.qs = d.questions; aid.ans = ['', '', '']; } else { aid.msg = d.message || 'Impossible pour le moment.'; }
        render();
      });
    }
    else if (a === 'aidGo') {
      aid.busy = true; aid.msg = ''; render();
      postAi('/api/angle', { questions: aid.qs, reponses: aid.ans }).then(function (d) {
        aid.busy = false;
        if (d.status === 'ok') { aid.res = { problematique: d.problematique, angle: d.angle }; } else { aid.msg = d.message || 'Impossible pour le moment.'; }
        render();
      });
    }
    else if (a === 'aidUse' && aid.res) {
      const cur = state.profile.missions || '';
      state.profile.missions = (cur ? cur + '\n' : '') + 'Problématique : ' + aid.res.problematique;
      flushSave(); save(); aid.res = null; render();
    }
    else if (a === 'plansGo') {
      planAi.busy = true; planAi.msg = ''; render();
      postAi('/api/plans').then(function (d) {
        planAi.busy = false;
        if (d.status === 'ok') { planAi.plans = d.plans; } else { planAi.msg = d.message || 'Impossible pour le moment.'; }
        render();
      });
    }
    else if (a === 'plansUse' && planAi.plans && planAi.plans[i]) {
      if (!confirmReplace()) return;
      const pl = planAi.plans[i];
      state.sections = pl.parties.map(function (x, k) {
        const edge = x.level === 1 && (/^(introduction|conclusion)/i.test(x.titre));
        return sec(x.level, x.titre, 'Que veux-tu dire dans cette partie ?', edge);
      });
      state.tab = 'edit'; flushSave(); save(); render();
    }
    else if (a === 'useDefault') {
      if (!confirmReplace()) return;
      state.sections = M().plan(); state.tab = 'edit'; flushSave(); save(); render();
    }
else if (a === 'useCustom') {
      const parsed = parseCustom(state.customText || '');
      if (!parsed.length) { document.getElementById('err').textContent = 'Écris au moins une ligne pour ton plan.'; return; }
      if (!confirmReplace()) return;
      state.sections = parsed; state.tab = 'edit'; flushSave(); save(); render();
    }
    else if (a === 'up' && i > 0) { const x = list[i]; list[i] = list[i - 1]; list[i - 1] = x; flushSave(); save(); render(); }
    else if (a === 'down' && i < list.length - 1) { const y = list[i]; list[i] = list[i + 1]; list[i + 1] = y; flushSave(); save(); render(); }
    else if (a === 'level') {
      const s = list[i];
      if (s.level === 1) { if (i === 0) { alert('La première ligne doit rester une partie.'); return; } s.level = 2; s.nonum = false; }
      else { s.level = 1; }
      flushSave(); save(); render();
    }
    else if (a === 'del') {
      if (finalText(list[i]).trim() && !confirm('Cette partie contient du texte. La supprimer quand même ?')) return;
      list.splice(i, 1); flushSave(); save(); render();
    }
    else if (a === 'addPart') {
      list.push(sec(1, 'Nouvelle partie', "Que veux-tu présenter dans cette partie ? Écris l'essentiel en quelques paragraphes."));
      flushSave(); save(); render();
      const inputs = document.querySelectorAll('[data-title]'); if (inputs.length) inputs[inputs.length - 1].focus();
    }
    else if (a === 'addSub') {
      list.push(sec(list.length ? 2 : 1, 'Nouvelle sous-partie', 'Quels points précis veux-tu développer ici ?'));
      flushSave(); save(); render();
      const inputs2 = document.querySelectorAll('[data-title]'); if (inputs2.length) inputs2[inputs2.length - 1].focus();
    }
  });

  app.addEventListener('input', function (e) {
    const el = e.target;
    const cv = el.getAttribute('data-cover');
    if (cv) {
      if (cv === 'model' && /^(officiel|cadre|moderne|sobre|aucune)$/.test(el.value)) { state.cover.model = el.value; const hb = document.getElementById('cover-header-box'); if (hb && hb.style) hb.style.display = el.value === 'officiel' ? '' : 'none'; }
      if (cv === 'preset') {
        const hp = HEADER_PRESETS.filter(function (h) { return h[0] === el.value && h[2] !== null; })[0];
        if (hp) { state.cover.header = hp[2]; const hh = headerParts(); ['pays', 'min', 'univ'].forEach(function (k) { const i = document.getElementById('hd-' + k); if (i) i.value = hh[k]; }); }
      }
      if (cv === 'model' || cv === 'banner' || cv === 'color') state.cover.template = '';
      if (cv === 'header') state.cover.header = String(el.value).slice(0, 1500);
      if (cv === 'banner' && /^(ruban|bandeau|encadre|double|lignes)$/.test(el.value)) state.cover.banner = el.value;
      if (cv === 'color' && /^#[0-9A-Fa-f]{6}$/.test(el.value)) state.cover.color = el.value;
      debouncedSave();
      const pv = document.getElementById('cover-prev');
      if (pv) pv.innerHTML = coverPreview();
      return;
    }
    const fc = el.getAttribute('data-figcap');
    if (fc) {
      const fl = figs[fc] || [], fid = el.getAttribute('data-fid');
      for (let q = 0; q < fl.length; q++) { if (fl[q].id === fid) { fl[q].cap = String(el.value).slice(0, 300); break; } }
      saveFigs();
      return;
    }
    const ck = el.getAttribute('data-cite');
    if (ck && citeForm.hasOwnProperty(ck)) { citeForm[ck] = String(el.value).slice(0, 300); return; }
    if (el.getAttribute('data-citestyle')) {
      if (/^(apa|mla|harvard|simple)$/.test(el.value)) { state.citeStyle = el.value; debouncedSave(); }
      return;
    }
    if (el.getAttribute('data-sources')) {
      state.sources = String(el.value).split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 60).map(function (x) { return x.slice(0, 500); });
      debouncedSave();
      return;
    }
    const mi = el.getAttribute('data-member');
    if (mi !== null) {
      const mk = parseInt(mi, 10);
      if (mk >= 0 && mk < state.profile.membres.length) { state.profile.membres[mk] = el.value; syncNom(); debouncedSave(); }
      return;
    }
    if (el.getAttribute('data-hdr')) {
      const parts = ['pays', 'min', 'univ'].map(function (k) { const i = document.getElementById('hd-' + k); return i ? String(i.value).trim().slice(0, 200) : ''; }).filter(Boolean);
      state.cover.header = parts.length ? parts.join('\n*******\n') + '\n*******' : '';
      state.cover.template = ''; debouncedSave(); refreshCover(); return;
    }
    const cfd = el.getAttribute('data-cfield');
    if (cfd) { state.profile[cfd] = String(el.value).slice(0, 300); if (cfd === 'nom') { state.profile.membres = [state.profile.nom]; } debouncedSave(); refreshCover(); return; }
    if (el.getAttribute('data-cmembres')) {
      const arr = String(el.value).split(/\r?\n/).map(function (x) { return x.slice(0, 120); }).slice(0, MAX_MEMBRES);
      state.profile.membres = arr.length ? arr : [''];
      syncNom(); debouncedSave(); refreshCover(); return;
    }
    const ak = el.getAttribute('data-aid');
    if (ak !== null) { aid.ans[parseInt(ak, 10)] = el.value.slice(0, 600); return; }
    if (el.getAttribute('data-count')) { setGroupSize(parseInt(el.value, 10)); return; }
    const f = el.getAttribute('data-field');
    if (f) { state.profile[f] = el.value; debouncedSave(); if (f === 'niveau') { coverCat = ''; resetCoverForCat(); render(); } return; }
    const ti = el.getAttribute('data-title');
    if (ti !== null) { state.sections[parseInt(ti, 10)].title = el.value; debouncedSave(); return; }
    if (el.getAttribute('data-custom')) { state.customText = el.value; debouncedSave(); return; }
    const sid = el.getAttribute('data-sid') || el.getAttribute('data-nid');
    if (sid) {
      const isNotes = !!el.getAttribute('data-nid');
      for (let k = 0; k < state.sections.length; k++) {
        if (state.sections[k].id === sid) {
          if (isNotes) { state.sections[k].notes = el.value; } else { state.sections[k].text = el.value; }
          const wc = document.getElementById('wc-' + sid);
          if (wc) wc.textContent = words(finalText(state.sections[k])) + ' mots';
          break;
        }
      }
      debouncedSave();
    }
  });

  function readLogo(key, file) {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { setLogoStatus(key, 'Format non accepté. Choisis une image PNG ou JPG.'); return; }
    if (file.size > 5000000) { setLogoStatus(key, 'Image trop lourde (5 Mo maximum).'); return; }
    const fail = function () { setLogoStatus(key, "Cette image n'a pas pu être lue. Essaie un autre fichier."); };
    const fr = new FileReader();
    fr.onerror = fail;
    fr.onload = function () {
      const img = new Image();
      img.onerror = fail;
      img.onload = function () {
        const sc = Math.min(1, 500 / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * sc)), h = Math.max(1, Math.round(img.height * sc));
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        cv.getContext('2d').drawImage(img, 0, 0, w, h);
        cv.toBlob(function (blob) {
          if (!blob) { fail(); return; }
          blob.arrayBuffer().then(function (buf) {
            logos[key] = { data: new Uint8Array(buf), w: w, h: h };
            saveLogos();
            setLogoStatus(key);
          }).catch(fail);
        }, 'image/png');
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  }
  app.addEventListener('change', function (e) {
    const el = e.target;
    if (el.getAttribute && el.getAttribute('data-research')) { state.research = !!el.checked; debouncedSave(); return; }
    if (el.getAttribute && el.getAttribute('data-count')) { setGroupSize(parseInt(el.value, 10)); return; }
    const ffs = el.getAttribute && el.getAttribute('data-figfile');
    if (ffs && el.files && el.files.length) { readFigures(ffs, Array.prototype.slice.call(el.files)); return; }
    const key = el.getAttribute && el.getAttribute('data-logo');
    if ((key === 'ecole' || key === 'entreprise') && el.files && el.files[0]) readLogo(key, el.files[0]);
  });

  const PEND_KEY = 'rapport-stage-pending';
  const payCfg = { enabled: false, price: 0 };
  let payBusy = false;

  function getPending() {
    try {
      const p = JSON.parse(localStorage.getItem(PEND_KEY) || 'null');
      return p && /^\d+$/.test(String(p.id)) && /^[0-9a-f]{12}$/.test(p.nonce || '') ? p : null;
    } catch (e) { return null; }
  }
  function setPending(p) { try { localStorage.setItem(PEND_KEY, JSON.stringify(p)); } catch (e) { /* ignoré */ } }
  function clearPending() { try { localStorage.removeItem(PEND_KEY); } catch (e) { /* ignoré */ } }

  function money(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA'; }
  function canDownload() { return !payCfg.enabled || !!state.paid; }
  function setPayMsg(text, cls) {
    const el = document.getElementById('pay-msg');
    if (el) { el.className = 'progress ' + (cls || ''); el.textContent = text; }
  }

  function payPanel() {
    if (!payCfg.enabled) return '';
    if (state.paid) {
      return '<div class="panel"><h2>Paiement</h2><div class="dev ok">Paiement confirmé. Tu peux télécharger ton fichier.</div></div>';
    }
    const pend = getPending();
    return '<div class="panel"><h2>Paiement</h2>' +
      '<p class="hint">Écris et mets en forme ton document gratuitement. Le fichier Word se télécharge après paiement : ' + money(payCfg.price) +
      ' par document, par MTN Mobile Money ou Moov Money.</p>' +
      '<div class="field"><label for="f-email">Ton e-mail (pour le reçu)</label>' +
      '<input class="in" id="f-email" type="email" inputmode="email" autocomplete="email" data-field="email" placeholder="nom@exemple.com" value="' + esc(state.profile.email) + '"></div>' +
      '<div class="progress" id="pay-msg" role="status">' + (pend ? "Un paiement est en cours de vérification. Si tu as payé, clique sur « J'ai payé »." : '') + '</div>' +
      '<button class="btn" type="button" data-action="pay">Payer ' + money(payCfg.price) + '</button>' +
      (pend ? '<button class="btn line" type="button" data-action="checkPay">J\'ai payé : vérifier mon paiement</button>' : '') +
      '</div>';
  }

  function startPay() {
    if (payBusy) return;
    const email = (state.profile.email || '').trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setPayMsg('Écris une adresse e-mail valide : elle sert à envoyer ton reçu.', 'err');
      return;
    }
    payBusy = true;
    setPayMsg('Ouverture de la page de paiement…');
    fetchWithTimeout('/api/pay-start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, nom: state.profile.nom })
    }).then(function (r) {
      return r.json().catch(function () { return { status: 'error', message: 'Réponse illisible.' }; });
    }).then(function (d) {
      if (d.status === 'ok' && d.url) {
        setPending({ id: String(d.id), nonce: d.nonce });
        flushSave(); save();
        window.location.href = d.url;
        return;
      }
      payBusy = false;
      setPayMsg(d.message || 'Le paiement a échoué. Réessaie.', 'err');
    }).catch(function (e) {
      payBusy = false;
      setPayMsg(e && e.name === 'AbortError' ? 'Le service met trop de temps, réessaie.' : 'Connexion impossible. Vérifie internet et réessaie.', 'err');
    });
  }

  function checkPending(auto) {
    const p = getPending();
    if (!p) return Promise.resolve();
    setPayMsg('Vérification du paiement…');
    return fetchWithTimeout('/api/pay-check?id=' + encodeURIComponent(p.id) + '&nonce=' + encodeURIComponent(p.nonce))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.paid) {
          state.paid = { id: p.id, nonce: p.nonce };
          clearPending();
          view = 'app';
          state.step = 3;
          flushSave(); save();
          render();
          return;
        }
        if (d.status === 'declined' || d.status === 'canceled') {
          clearPending();
          setPayMsg('Le paiement a été refusé ou annulé. Tu peux réessayer.', 'err');
        } else if (d.status === 'pending') {
          setPayMsg(auto
            ? "Ton paiement n'est pas encore confirmé. Si tu as payé, attends quelques secondes puis clique sur « J'ai payé »."
            : "Pas encore confirmé. Réessaie dans quelques secondes.");
        } else {
          setPayMsg(d.message || 'Vérification impossible. Réessaie.', 'err');
        }
      })
      .catch(function (e) { setPayMsg(e && e.name === 'AbortError' ? 'Le service met trop de temps, réessaie.' : 'Connexion impossible. Vérifie internet et réessaie.', 'err'); });
  }

  render();

  fetchWithTimeout('/api/pay-start')
    .then(function (r) { return r.json(); })
    .then(function (d) { payCfg.enabled = !!d.enabled; payCfg.price = d.price || 0; })
    .catch(function () { /* paiement non disponible : le site reste utilisable */ })
    .then(function () {
      if (!payCfg.enabled) return;
      if (getPending()) {
        view = 'app';
        state.step = 3;
        render();
        checkPending(true);
      } else if (state.step === 3) {
        render();
      }
    });
  if (typeof window !== 'undefined') {
    window.isSafeUrl = isSafeUrl;
    window.fetchWithTimeout = fetchWithTimeout;
    Object.defineProperty(window, 'saveTimer', { get: function () { return saveTimer; } });
  }
})();