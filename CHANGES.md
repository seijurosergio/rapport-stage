# Étape 2 : bugs visibles, mode simulation, garde-fous de coût

Corrigé
- Texte généré avec du JSON brut ({"texte":", \n visibles, balises ```json, liste "sources_utilisees", texte coupé) :
  api/develop.js recollait les morceaux de réponse avec un retour à la ligne, ce qui cassait le JSON quand la recherche web
  était active, puis renvoyait le texte brut au site. Les morceaux sont maintenant recollés tels quels, une réponse coupée
  (max_tokens) ou illisible renvoie une erreur claire, jamais du JSON dans le texte. Même correction dans sources.js, angle.js, plans.js.
- La page ne remonte plus en haut à chaque clic : seulement quand on change d'écran (app.js, render).
- « [NOM DE L'OUTIL] » remplacé par la constante APP_NAME (app.js, ligne 5) : à changer pour le vrai nom.
- Titres du Word : la couleur grise claire du modèle « Palmiers » (#C9CCD2) était reprise pour les titres. Elle est assombrie
  automatiquement (contraste d'au moins 4,5) quand elle est trop claire.

Ajouté
- MOCK_AI=1 : fausses réponses, aucun appel à Anthropic, aucune clé nécessaire (api/_mock.js). MOCK_CASE choisit le scénario.
- AI_ENABLED=0 : coupe toute l'IA.
- Journal de consommation : chaque appel réel écrit « usage {...} » dans les logs Vercel.
- La recherche web est décochée par défaut (c'est elle qui coûte le plus).
- tests/api.test.js (10 tests) et tests/ui.test.js (3 tests) : aucun appel réel à l'IA.

Pas touché : design, textes affichés, format de sauvegarde, paiement, modèles de page de garde.
