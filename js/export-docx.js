(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const CoverData = require('./cover-data.js');
    const AppUtils = require('./utils.js');
    module.exports = factory(CoverData, AppUtils);
  } else {
    root.AppExport = factory(root.AppCoverData, root.AppUtils);
  }
})(this, function (CoverData, AppUtils) {
  'use strict';

  const { labels } = AppUtils;

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

  function lightenColor(hex, percent) {
    const c = String(hex || '').replace('#', '');
    if (!/^[0-9A-Fa-f]{6}$/.test(c)) return c;
    const num = parseInt(c, 16);
    const r = Math.min(255, Math.round(((num >> 16) & 255) + (255 - ((num >> 16) & 255)) * percent));
    const g = Math.min(255, Math.round(((num >> 8) & 255) + (255 - ((num >> 8) & 255)) * percent));
    const b = Math.min(255, Math.round((num & 255) + (255 - (num & 255)) * percent));
    return (r << 16 | g << 8 | b).toString(16).padStart(6, '0').toUpperCase();
  }

  function textColorForBg(hex) {
    const c = String(hex || '').replace('#', '');
    if (!/^[0-9A-Fa-f]{6}$/.test(c)) return '000000';
    const r = parseInt(c.substr(0, 2), 16);
    const g = parseInt(c.substr(2, 2), 16);
    const b = parseInt(c.substr(4, 2), 16);
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return lum > 186 ? '000000' : 'FFFFFF';
  }


  /* ---- PNG sans dépendance (navigateur et Node) : le ruban à encoches est dessiné pixel par pixel, sans canvas ---- */
  const CRC_TABLE = (function () {
    const t = [];
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; }
    return t;
  })();
  function crc32(bytes) { let c = 0xFFFFFFFF; for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function u32(n) { return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]; }
  function pngChunk(type, data) {
    const body = new Uint8Array(4 + data.length);
    for (let i = 0; i < 4; i++) body[i] = type.charCodeAt(i);
    body.set(data, 4);
    return [].concat(u32(data.length), Array.from(body), u32(crc32(body)));
  }
  function zlibStored(raw) {
    const out = [0x78, 0x01];
    for (let i = 0; i < raw.length; i += 65535) {
      const len = Math.min(65535, raw.length - i);
      out.push(i + 65535 >= raw.length ? 1 : 0, len & 255, (len >>> 8) & 255, (~len) & 255, ((~len) >>> 8) & 255);
      for (let j = 0; j < len; j++) out.push(raw[i + j]);
    }
    let a = 1, b = 0;
    for (let i = 0; i < raw.length; i++) { a = (a + raw[i]) % 65521; b = (b + a) % 65521; }
    return Uint8Array.from(out.concat(u32(((b << 16) | a) >>> 0)));
  }
  function hexRgb(hex) { const h = String(hex).replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }

  /* Ruban d'origine : un morceau central (couleur d'accent, un peu plus bas que les côtés) et deux bouts en teinte claire,
     chacun avec une encoche en V sur son bord extérieur (mêmes proportions que l'aperçu : 12 % / 76 % / 12 %, encoche de 28 %).
     Palette : 0 = transparent, 1 à 4 = teinte claire (bords lissés), 5 = couleur d'accent. */
  function ribbonPng(accentHex, lightHex) {
    const W = 900, H = 124, PW = Math.round(W * 0.12), TOP = Math.round(H * 0.1), BOT = Math.round(H * 0.9);
    const SS = 4;
    const inNotch = function (dist, y) { return dist < 0.28 * PW * (1 - Math.abs(2 * y / H - 1)); };
    const raw = new Uint8Array(H * (W + 1));
    for (let y = 0; y < H; y++) {
      raw[y * (W + 1)] = 0;
      for (let x = 0; x < W; x++) {
        let idx = 0;
        if (x >= PW && x < W - PW) { idx = (y >= TOP && y < BOT) ? 5 : 0; }
        else {
          const left = x < PW, local = left ? x : x - (W - PW);
          let covered = 0;
          for (let sy = 0; sy < SS; sy++) {
            for (let sx = 0; sx < SS; sx++) {
              const px = local + (sx + 0.5) / SS, py = y + (sy + 0.5) / SS;
              const dist = left ? px : PW - px;
              if (!inNotch(dist, py)) covered++;
            }
          }
          idx = covered === 0 ? 0 : Math.min(4, Math.max(1, Math.round(covered / (SS * SS) * 4)));
        }
        raw[y * (W + 1) + 1 + x] = idx;
      }
    }
    const light = hexRgb(lightHex), accent = hexRgb(accentHex);
    const plte = Uint8Array.from([0, 0, 0].concat(light, light, light, light, accent));
    const trns = Uint8Array.from([0, 64, 128, 192, 255, 255]);
    const ihdr = Uint8Array.from([].concat(u32(W), u32(H), [8, 3, 0, 0, 0]));
    return Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10].concat(pngChunk('IHDR', ihdr), pngChunk('PLTE', plte), pngChunk('tRNS', trns), pngChunk('IDAT', zlibStored(raw)), pngChunk('IEND', new Uint8Array(0))));
  }

  /* Couleur du texte d'un bandeau : celle du modèle si elle est définie, sinon noir ou blanc selon le fond. */
  function bannerTextColor(cover, fill) {
    const t = String((cover && cover.bannerText) || '').replace('#', '');
    return /^[0-9A-Fa-f]{6}$/.test(t) ? t.toUpperCase() : textColorForBg(fill);
  }

  function fromB64(b) {
    try {
      if (typeof atob === 'function') {
        const s = atob(b), u = new Uint8Array(s.length); let i;
        for (i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
        return u;
      }
    } catch {}
    return new Uint8Array(0);
  }

  function buildOfficialCover(d, FONT, col, centered, none, noBorders, cellNoBorders, profile, cover, assets, modeInfo, mode) {
    const o = CoverData.officialCover(profile, cover, mode), out = [];
    const noneBorder = { style: d.BorderStyle.NONE, size: 0, color: 'auto' };
    const tblNoBorders = { top: noneBorder, bottom: noneBorder, left: noneBorder, right: noneBorder, insideHorizontal: noneBorder, insideVertical: noneBorder };
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
    function cell(pct, kids) {
      return new d.TableCell({ borders: noBorders, width: { size: pct, type: d.WidthType.DXA }, verticalAlign: d.VerticalAlign.CENTER, children: kids });
    }
    function logoPara(l, align) {
      if (!l) return new d.Paragraph({ children: [] });
      let h = 72, w = Math.round(l.w * h / l.h);
      if (w > 110) { w = 110; h = Math.round(l.h * w / l.w); }
      return new d.Paragraph({ alignment: align, children: [new d.ImageRun({ type: 'png', data: l.data, transformation: { width: w, height: h } })] });
    }

    const topKids = o.top.map(function (x) { return para(x, 22, d.AlignmentType.CENTER, 40); });
    if (assets.logos.ecole || assets.logos.entreprise) {
      out.push(new d.Table({
        width: { size: 9026, type: d.WidthType.DXA }, columnWidths: [1800, 5426, 1800], borders: tblNoBorders,
        rows: [new d.TableRow({ children: [
          cell(1800, [logoPara(assets.logos.ecole, d.AlignmentType.LEFT)]),
          cell(5426, topKids.length ? topKids : [new d.Paragraph({ children: [] })]),
          cell(1800, [logoPara(assets.logos.entreprise, d.AlignmentType.RIGHT)])
        ] })]
      }));
    } else {
      topKids.forEach(function (k) { out.push(k); });
    }
    o.rest.forEach(function (x) { out.push(para(x, 20, d.AlignmentType.CENTER, 50)); });
    o.lines.forEach(function (x) { out.push(para(x, 22, d.AlignmentType.CENTER, 50)); });

    const bst = cover.banner;
    out.push(new d.Paragraph({ spacing: { before: 500, after: 0 }, children: [] }));
    const txtColor = (bst === 'ruban' || bst === 'bandeau') ? bannerTextColor(cover, col) : (bst === 'lignes' ? col : '000000');
    const FULL = 9026;
    function boxTable(kids, border) {
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
      out.push(boxTable(o.banner.map(function (x) { return para(x, 26, d.AlignmentType.CENTER, 60, txtColor); }), { style: d.BorderStyle.SINGLE, size: 18 }));
    } else if (bst === 'double') {
      out.push(boxTable(o.banner.map(function (x) { return para(x, 26, d.AlignmentType.CENTER, 60, txtColor); }), { style: d.BorderStyle.DOUBLE, size: 18 }));
    } else if (bst === 'bandeau') {
      out.push(boxTable(o.banner.map(function (x) { return para(x, 26, d.AlignmentType.CENTER, 60, txtColor); }), null));
    } else {
      // Ruban d'origine (bouts en encoche) : une image dessinée placée DERRIÈRE le texte, ancrée à un petit paragraphe,
      // puis une ligne de texte centrée par ligne de bannière. Aucun tableau : rien à afficher comme bordure.
      const BAND_H = 62, LINE = 20;
      const nLines = Math.max(1, o.banner.length);
      const pad = Math.max(2, (BAND_H - nLines * LINE) / 2);
      const bannerTxt = bannerTextColor(cover, col);
      out.push(new d.Paragraph({
        spacing: { before: 0, after: 0, line: 20, lineRule: 'exact' },
        children: [new d.ImageRun({
          type: 'png', data: ribbonPng(col, lightenColor(col, 0.15)), transformation: { width: 601, height: 83 },
          altText: { title: 'Ruban', description: 'Ruban décoratif du thème', name: 'ruban' },
          floating: {
            horizontalPosition: { relative: d.HorizontalPositionRelativeFrom.COLUMN, offset: 0 },
            verticalPosition: { relative: d.VerticalPositionRelativeFrom.PARAGRAPH, offset: 0 },
            behindDocument: true, allowOverlap: true, wrap: { type: d.TextWrappingType.NONE }
          }
        })]
      }));
      o.banner.forEach(function (x, k) {
        out.push(new d.Paragraph({
          alignment: d.AlignmentType.CENTER,
          spacing: { before: k === 0 ? Math.round((pad - 1) * 20) : 0, after: k === nLines - 1 ? Math.round(pad * 20) : 0, line: LINE * 20, lineRule: 'exact' },
          children: [new d.TextRun({ text: x.t, font: FONT, size: 26, bold: true, color: bannerTxt })]
        }));
      });
    }
    o.after.forEach(function (x, k) { out.push(para(x, 22, d.AlignmentType.CENTER, 50)); out.splice(out.length - 1, 1, new d.Paragraph({ alignment: d.AlignmentType.CENTER, spacing: { before: k ? 0 : 300, after: 50 }, children: [run(x, 22)] })); });
    out.push(new d.Paragraph({ spacing: { before: 700, after: 0 }, children: [] }));

    // Bloc « Présenté par / Supervision » sans tableau : deux colonnes par tabulation (aucune bordure possible).
    const colorOf = function (c) { return c ? c.replace('#', '') : undefined; };
    const leftLines = [{ t: o.left.title, head: true, color: o.left.color }].concat(o.left.names.map(function (n, k) { return { t: (o.left.numbered ? (k + 1) + '.  ' : '') + n, num: o.left.numbered }; }));
    const rightLines = o.right ? [{ t: o.right.title, head: true, color: o.right.color }, { t: o.right.name }] : [];
    const nRows = Math.max(leftLines.length, rightLines.length);
    for (let r = 0; r < nRows; r++) {
      const lf = leftLines[r], rt = rightLines[r], kids = [];
      if (lf) kids.push(new d.TextRun({ text: lf.t, font: FONT, size: lf.head ? 22 : 21, bold: true, underline: lf.head ? {} : undefined, color: colorOf(lf.color) }));
      if (rt) {
        kids.push(new d.TextRun({ children: [new d.Tab()], font: FONT, size: 21 }));
        kids.push(new d.TextRun({ text: rt.t, font: FONT, size: rt.head ? 22 : 21, bold: true, underline: rt.head ? {} : undefined, color: colorOf(rt.color) }));
      }
      out.push(new d.Paragraph({
        tabStops: [{ type: d.TabStopType.CENTER, position: 6995 }],
        spacing: { after: lf && lf.head ? 120 : 80 },
        indent: lf && lf.num ? { left: 300 } : undefined,
        children: kids.length ? kids : []
      }));
    }

    if (o.yearSegs) {
      out.push(new d.Paragraph({ alignment: d.AlignmentType.CENTER, spacing: { before: 900, after: 0 }, children: segRuns(o.yearSegs, 22) }));
    } else if (o.year) {
      out.push(new d.Paragraph({ alignment: d.AlignmentType.CENTER, spacing: { before: 900, after: 0 },
        children: [new d.TextRun({ text: o.year, font: FONT, size: 20, bold: true, underline: {} })] }));
    }
    return out;
  }

  function buildDocument(docxLib, project, assets) {
    const d = docxLib;
    const state = Object.assign({}, project, { profile: CoverData.normalizeProfile(project.profile) });
    const FONT = 'Times New Roman';

    const model = state.cover.model;
    const col = state.cover.color.replace('#', '');
    const headColor = model === 'sobre' ? '000000' : readableColor(col);
    const tocMode = state.tocMode === 'auto' ? 'auto' : 'simple';

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
      cover = buildOfficialCover(d, FONT, col, centered, none, noBorders, cellNoBorders, state.profile, state.cover, assets, project.modeInfo, state.mode);
    } else {
      const mi = project.modeInfo;
      if (assets.logos.ecole || (mi.logoEntreprise && assets.logos.entreprise)) {
        cover.push(new d.Table({
          width: { size: 100, type: d.WidthType.PERCENTAGE },
          borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none },
          rows: [new d.TableRow({ children: [logoCell(assets.logos.ecole, d.AlignmentType.LEFT), logoCell(mi.logoEntreprise ? assets.logos.entreprise : null, d.AlignmentType.RIGHT)] })]
        }));
      }
      if (state.profile.ecole) cover.push(centered(state.profile.ecole.toUpperCase(), 30, true, 240, 120));
      if (state.profile.filiere) cover.push(centered('Filière : ' + state.profile.filiere, 26, false, 0, 120));
      if (model === 'moderne') {
        cover.push(new d.Paragraph({ spacing: { before: 1800, after: 0 }, children: [] }));
        cover.push(new d.Table({
          width: { size: 100, type: d.WidthType.PERCENTAGE },
          borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none },
          rows: [new d.TableRow({ children: [new d.TableCell({
            borders: noBorders,
            shading: { type: d.ShadingType.CLEAR, fill: col, color: 'auto' },
            margins: { top: 300, bottom: 300, left: 200, right: 200 },
            children: [centered(mi.coverTitle, 56, true, 0, 0, bannerTextColor(state.cover, col))]
          })] })]
        }));
        cover.push(new d.Paragraph({ spacing: { before: 0, after: 360 }, children: [] }));
      } else {
        cover.push(centered(mi.coverTitle, 60, true, 2800, 360, headColor));
      }
      mi.coverLines.forEach(function (ln) {
        cover.push(centered(ln[0], ln[1], ln[2], ln[3], ln[4], ln[5] === 'head' ? headColor : undefined));
      });
      const mem = CoverData.members(state.profile);
      if (mem.length > 1) {
        cover.push(centered('Présenté par :', 28, true, mi.presentedBefore, 120));
        mem.forEach(function (nm) { cover.push(centered(nm, 28, false, 0, 60)); });
      } else if (mem.length === 1 || (state.mode !== 'expose' && state.profile.nom)) {
        cover.push(centered('Présenté par : ' + (mem.length ? mem[0] : state.profile.nom), 28, true, mi.presentedBefore, 120));
      }
      if (state.profile.annee) cover.push(centered('Année universitaire : ' + state.profile.annee, 26, false, 600, 120));
    }

    const main = [];
    const lb = labels(state.sections);
    let figNo = 0;
    main.push(centered('SOMMAIRE', 30, true, 0, 240, headColor));

    if (tocMode === 'auto') {
      main.push(new d.TableOfContents('Sommaire', { hyperlink: true, headingStyleRange: '1-2' }));
    } else {
      // Sommaire simple : un lien interne par titre (signets posés sur les titres), sans numéro de page inventé.
      state.sections.forEach(function (s, i) {
        const title = (lb[i] ? lb[i] + '  ' : '') + (s.level === 1 ? s.title.toUpperCase() : s.title);
        main.push(new d.Paragraph({
          alignment: d.AlignmentType.LEFT,
          spacing: { before: 60, after: 60 },
          indent: s.level === 2 ? { left: 720 } : undefined,
          children: [new d.InternalHyperlink({
            anchor: 'sec_' + i,
            children: [new d.TextRun({ text: title, font: FONT, size: s.level === 1 ? 24 : 22, bold: s.level === 1, color: '000000' })]
          })]
        }));
      });
    }

    if (figCount(state, assets) > 0) {
      main.push(new d.Paragraph({ pageBreakBefore: true, alignment: d.AlignmentType.CENTER, spacing: { after: 240 },
        children: [new d.TextRun({ text: 'LISTE DES FIGURES', font: FONT, size: 30, bold: true, color: headColor })] }));
      if (tocMode === 'auto') {
        main.push(new d.TableOfContents('Liste des figures', { hyperlink: true, captionLabelIncludingNumbers: 'Figure' }));
      } else {
        // Simple figure list
        let figNo = 0;
        state.sections.forEach(function (s) {
          (assets.figs[s.id] || []).forEach(function (f) {
            figNo += 1;
            main.push(new d.Paragraph({
              alignment: d.AlignmentType.LEFT,
              spacing: { before: 60, after: 60 },
              children: [new d.TextRun({ text: 'Figure ' + figNo + (f.cap ? ' : ' + f.cap : ''), font: FONT, size: 22, color: '000000' })]
            }));
          });
        });
      }
    }

    state.sections.forEach(function (s, i) {
      const title = (lb[i] ? lb[i] + '  ' : '') + (s.level === 1 ? s.title.toUpperCase() : s.title);
      const isConclusion = /^conclusion$/i.test(s.title);
      const isMajorPart = s.level === 1 && !s.nonum && !/^introduction$/i.test(s.title);
      const needsPageBreak = i === 0 || isConclusion || (state.partPageBreak && isMajorPart);
      main.push(new d.Paragraph({
        heading: s.level === 1 ? d.HeadingLevel.HEADING_1 : d.HeadingLevel.HEADING_2,
        pageBreakBefore: needsPageBreak,
        keepNext: true,
        spacing: { before: i === 0 ? 0 : (s.level === 1 ? 480 : 300), after: 160 },
        children: [new d.Bookmark({ id: 'sec_' + i, children: [new d.TextRun({ text: title, font: FONT })] })]
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
      (assets.figs[s.id] || []).forEach(function (f) {
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
      title: project.modeInfo.docTitle,
      features: { updateFields: tocMode === 'auto' },
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

  function figCount(state, assets) {
    let n = 0;
    state.sections.forEach(function (x) { n += (assets.figs[x.id] || []).length; });
    return n;
  }

  function finalText(s) {
    return (s.text && s.text.trim()) ? s.text : (s.notes || '');
  }

  return { buildDocument, ribbonPng, readableColor, lightenColor, textColorForBg, bannerTextColor, buildOfficialCover, fromB64, figCount, finalText };
});