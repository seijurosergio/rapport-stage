# Correction globale (tâches 10 et suivantes)

Page de garde et Word
- Ruban d'origine rétabli (bouts en encoche en V, comme dans l'aperçu). Dans le Word, il est dessiné en une image (js/export-docx.js,
  ribbonPng, sans canvas) placée DERRIÈRE le texte, avec une ligne de texte centrée par ligne de bannière (une ligne = un paragraphe).
  La page de garde ne contient plus aucun tableau : le bloc « Présenté par / Supervision » utilise des tabulations. Plus de bords.
- Avant : le texte du ruban était perdu et les deux lignes collées (« THÈME : 8energie solaire ») : corrigé.
- Aperçu du site : les couleurs calculées n'avaient pas de « # » (le navigateur les ignorait : texte noir, côtés absents).
  Les couleurs du ruban sont désormais identiques dans l'aperçu et dans le Word (vérifié par test).
- Aperçu des modèles à étiquettes (Palmiers, Carrés) : lignes « Spécialité / Années d'études » et séparateurs rétablis.
- Mode stage : le nom saisi n'apparaissait pas sous « Rédigé par » (le code lisait la liste des membres, vide en mode stage).
- Saisies nettoyées à l'affichage (jamais dans ce que tu tapes) : majuscules des noms (« dr dupont » → « Dr Dupont »),
  accents courants (« energie » → « Énergie »), sujet du thème en majuscules.
- Couleur du texte des bandeaux : celle du modèle, sinon noir ou blanc selon le contraste.
- Titres du Word centrés (état validé ; je les avais remis à gauche par erreur).

Sommaire et pages
- Sommaire « simple » : liens internes vers des signets posés sur les titres, sans point de conduite ni numéro de page inventé.
- Sommaire « automatique » : champ Word avec mise à jour des champs (la question « Oui » n'est posée que dans ce mode).
- Les choix « Sommaire » et « chaque partie sur une nouvelle page » ne faisaient rien (attribut HTML vide) : corrigé,
  et ils sont maintenant transmis au Word.
- Introduction, conclusion et sources commencent sur une nouvelle page ; aucune page vide.

Journaux et secrets
- api/_log.js : journaux filtrés (clés, jetons, en-têtes, corps, environnement et contenu utilisateur jamais écrits).
  Le texte généré n'est plus écrit dans les journaux.
- ESLint contrôle maintenant TOUS les fichiers (avant, js/ n'était pas vérifié) ; no-console interdit console.log partout.
- .gitignore protège enfin .env et .env.* (il ne contenait que node_modules) ; script inline de index.html supprimé (bloqué par la CSP).

Tests (85, aucun ignoré)
- tests/e2e-export.test.js : vraie page + clic sur « Télécharger » pour les 20 modèles x 2 modes, lecture du contenu du Word.
- tests/cover-parity.test.js : chaque ligne de l'aperçu doit se retrouver dans le Word ; mêmes couleurs de ruban.
- tests/secrets.test.js, tests/log.test.js, tests/cover-data.test.js.
- `npm run check:visual` : 12 Word convertis en PDF par LibreOffice (pages vides, sommaire, thème, nom).
