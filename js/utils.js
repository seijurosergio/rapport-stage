(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AppUtils = factory();
  }
})(this, function () {
  'use strict';

  const KEY = 'rapport-stage-v1';
  let counter = 0;
  function nid() { counter += 1; return 's' + Date.now().toString(36) + counter; }
  function sec(level, title, guide, nonum) {
    return { id: nid(), level: level, title: title, guide: guide, nonum: !!nonum, notes: '', text: '' };
  }

  const NONUM = /^(introduction|conclusion|remerciements|r[ée]sum[ée]|sommaire|bibliographie|annexes?|avant-propos|d[ée]dicace)/i;

  function esc(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>')
      .replace(/"/g, '"').replace(/'/g, "'");
  }

  function words(t) {
    const m = String(t || '').trim().match(/\S+/g);
    return m ? m.length : 0;
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

  function slug(t) {
    return String(t || 'rapport').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'rapport';
  }

  function parseCustom(txt) {
    const out = [];
    txt.split(/\r?\n/).forEach(function (raw) {
      if (!raw.trim()) return;
      const line = raw.trim();
      let level = 1;
      if (/^\d+\.\d+/.test(line) || /^(\s{2,}|\t)/.test(raw) || (/^(\s{2,}|\t)/.test(raw) && /^[-•*]\s/.test(line))) level = 2;
      let title = line.replace(/^(\d+(\.\d+)*[.)]?|[IVXLC]+[.)]|[A-Za-z][.)]|[-•*])\s+/, '').trim();
      if (!title) title = line;
      if (level === 2 && out.length === 0) level = 1;
      const nonum = level === 1 && NONUM.test(title);
      let guide;
      if (/^introduction/i.test(title)) guide = "Pourquoi as-tu fait ce stage ? Quels étaient tes objectifs ? Comment ton rapport est-il organisé ?";
      else if (/^conclusion/i.test(title)) guide = "Qu'as-tu appris, et en quoi ce stage sert-il ton projet professionnel ?";
      else if (level === 1) guide = "Que veux-tu présenter dans cette partie ? Écris l'essentiel en quelques paragraphes.";
      else guide = "Quels points précis veux-tu développer ici ?";
      out.push(sec(level, title, guide, nonum));
    });
    return out;
  }

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

  function fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const timeout = setTimeout(function () { controller.abort(); }, 60000);
    return fetch(url, Object.assign({}, options, { signal: controller.signal }))
      .then(function (r) { clearTimeout(timeout); return r; })
      .catch(function (e) { clearTimeout(timeout); throw e; });
  }

  function makeDebouncedSave() {
    let saveTimer = null;
    let savePending = false;
    let saveFn = function () { return true; };
    let statusFn = function () {};

    function debouncedSave() {
      savePending = true;
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(function () {
        savePending = false;
        saveFn();
        statusFn();
      }, 400);
    }

    function flushSave() {
      if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
      if (savePending) { savePending = false; saveFn(); statusFn(); }
    }

    function setSaveFn(fn) { saveFn = fn; }
    function setStatusFn(fn) { statusFn = fn; }
    function pending() { return savePending; }
    function getTimer() { return saveTimer; }

    return { debouncedSave, flushSave, setSaveFn, setStatusFn, pending, getTimer };
  }

  return {
    esc,
    words,
    roman,
    labels,
    slug,
    parseCustom,
    fmtCite,
    todayFr,
    isSafeUrl,
    fetchWithTimeout,
    makeDebouncedSave,
    NONUM,
    nid,
    sec
  };
});
