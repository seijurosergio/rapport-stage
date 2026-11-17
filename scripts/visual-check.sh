#!/usr/bin/env bash
# Contrôle visuel : génère 12 Word (6 modèles x 2 modes) avec la vraie page, les convertit en PDF avec LibreOffice
# et vérifie : pas de page vide, sommaire rempli, thème et nom présents. Nécessite soffice, pdfinfo et pdftotext.
# Usage : npm run check:visual   (les PDF sont dans /tmp/rapport-stage-visuel pour les regarder)
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT=/tmp/rapport-stage-visuel
rm -rf "$OUT" && mkdir -p "$OUT"
cd "$ROOT"
OUT="$OUT" node - <<'JS'
const { openPage } = require('./tests/_page');
const fs = require('fs');
(async () => {
  for (const mode of ['expose', 'stage']) {
    const page = await openPage();
    await page.fill(mode);
    for (const id of ['univ-ruban-vert', 'etiq-palmiers', 'univ-cadre', 'lycee-ruban-orange', 'pro-bandeau-noir', 'etiq-carres-bleus']) {
      await page.pickTemplate(page.w.COVER_TEMPLATES.find((t) => t.id === id));
      fs.writeFileSync(process.env.OUT + '/' + mode + '__' + id + '.docx', await page.download());
    }
  }
  process.exit(0);
})();
JS
cd "$OUT" && soffice --headless --convert-to pdf ./*.docx >/dev/null 2>&1
python3 - "$OUT" <<'PY'
import glob, re, subprocess, sys
bad = 0
for pdf in sorted(glob.glob(sys.argv[1] + '/*.pdf')):
    n = int(re.search(r'Pages:\s+(\d+)', subprocess.check_output(['pdfinfo', pdf]).decode()).group(1))
    pages = [subprocess.check_output(['pdftotext', '-f', str(i), '-l', str(i), '-layout', pdf, '-']).decode() for i in range(1, n + 1)]
    blank = [i + 1 for i, t in enumerate(pages) if len(re.sub(r'[\s\d]', '', t)) < 5]
    som = [t for t in pages if 'SOMMAIRE' in t]
    som_lines = len([l for l in som[0].splitlines() if l.strip()]) if som else 0
    name = pdf.split('/')[-1][:-4]
    expose = name.startswith('expose')
    official = not name.endswith('univ-cadre')
    ok = not blank and som_lines >= 5 and 'Test Utilisateur' in pages[0] and (not (expose and official) or 'THÈME : 8' in pages[0])
    bad += 0 if ok else 1
    print(('OK  ' if ok else 'ERREUR ') + name + ' pages=' + str(n) + ' pages_vides=' + str(blank) + ' lignes_sommaire=' + str(som_lines))
sys.exit(1 if bad else 0)
PY
