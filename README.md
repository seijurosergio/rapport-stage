# Assistant rapport de stage

Site web simple pour aider les étudiants, de toutes filières, à préparer leur rapport de stage :

1. Un formulaire de quelques questions (stage, école, entreprise, missions).
2. Un plan : plan proposé, plan modifiable, ou plan de l'école saisi par l'étudiant (avec sous-parties).
3. Une zone d'écriture par partie, sauvegardée automatiquement sur l'appareil.
4. Un fichier Word prêt à rendre : page de garde, sommaire, titres, pagination.

L'étudiant écrit son contenu lui-même ; l'outil structure et met en forme.

## Fichiers

- `index.html` : le site (formulaire, plan, rédaction, fichier Word).
- `api/develop.js` : fonction serveur qui transforme les idées de l'étudiant en texte rédigé, sans inventer de faits.

## Activer la rédaction assistée

La fonction « Développer mon idée » a besoin d'une clé d'accès au service d'IA.

1. Créer la clé dans la console développeur d'Anthropic (console.anthropic.com), après avoir ajouté un petit crédit.
2. Y fixer une **limite de dépense mensuelle** (indispensable : le site est public).
3. Dans Vercel : projet `rapport-stage`, Settings, Environment Variables, ajouter `ANTHROPIC_API_KEY` avec la clé.
4. Redéployer (Deployments, puis Redeploy).

La clé ne doit jamais être écrite dans le code ni envoyée sur GitHub. Sans clé, le site fonctionne : seule la rédaction assistée affiche « pas encore activée ».

## Activer le paiement mobile money (FedaPay)

Le fichier Word se télécharge après paiement (MTN Mobile Money, Moov Money, cartes). Sans clé FedaPay, le paiement est désactivé et le téléchargement reste libre : c'est le mode « test avec les étudiants ».

Variables à ajouter dans Vercel (Settings, Environment Variables), puis redéployer :

| Variable | Valeur |
|---|---|
| `FEDAPAY_SECRET_KEY` | la clé secrète FedaPay (de test d'abord, `sk_sandbox_...`, puis la clé réelle) |
| `FEDAPAY_ENV` | `sandbox` pour tester ; supprimer la variable (ou autre valeur) pour le mode réel |
| `PRICE_FCFA` | prix d'un rapport, par exemple `2000` (2000 par défaut) |
| `SITE_URL` | facultatif : adresse du site, par exemple `https://rapport-stage-one.vercel.app` |

Numéros de test FedaPay (mode sandbox) : MTN `66000001` (succès), `66000000` (échec) ; Moov `64000001` (succès), `64000000` (échec).

Fonctionnement : `api/pay-start.js` crée la transaction et renvoie la page de paiement ; au retour, `api/pay-check.js` vérifie auprès de FedaPay que la transaction est bien approuvée (avec un code secret propre à chaque paiement). Limite connue : un paiement débloque le téléchargement sur l'appareil de l'étudiant, sans base de données pour compter les téléchargements.

## Mettre en ligne

Sur Vercel : « Add New Project », choisir ce dépôt, laisser les réglages par défaut, puis « Deploy ».

## À faire ensuite

- Remplacer `[NOM DE L'OUTIL]` par le vrai nom.
- Ajouter les exposés et le mémoire.
- Si les paiements décollent : base de données pour lier un paiement à un seul rapport.

## Types de document

Le site propose deux modes (choisis au début de l'étape 1) : **rapport de stage** et **exposé**. Tout ce qui change entre les deux (champs, plan, page de garde, nom du fichier) est regroupé dans l'objet `MODES` de `index.html`. La consigne donnée à l'IA est dans `api/develop.js` (`SYSTEM` pour le stage, `SYSTEM_EXPOSE` pour l'exposé). Pour ajouter un type de document, ajoute une entrée dans `MODES` et, si besoin, une consigne dédiée.

## Images, figures et sources

- **Images** : chaque partie (étape 3) accepte des schémas et des photos, réduits sur l'appareil (JPEG, 900 px) et gardés dans le navigateur (clé `rapport-stage-figs`, 16 images maximum). Chaque image a une légende ; dans le fichier Word elle reçoit « Figure N » (champ SEQ) et une **liste des figures** est créée après le sommaire (Word la remplit à l'ouverture, comme le sommaire).
- **Sources** : le panneau « Sources et références » imprime la liste, numérotée, en fin de fichier. En mode exposé, `api/sources.js` cherche des pages sur le web avec l'outil de recherche de l'API Anthropic (`web_search_20250305`, 3 recherches maximum, environ 1 cent par recherche, 6 demandes par heure et par adresse). Seuls les liens réellement renvoyés par la recherche sont gardés. Ce sont des pistes à vérifier : le texte rédigé par l'IA ne provient pas de ces pages. La recherche web doit être autorisée dans la console Anthropic (Settings, Capabilities).

## Aides au démarrage (IA)

- `api/angle.js` : bouton « Je ne sais pas par où commencer » (étape 1) : 3 questions, puis une problématique.
- `api/plans.js` : bouton « Me proposer 3 plans » (étape 2) : trois variantes de plan à appliquer puis réorganiser.
- `api/_ai.js` : outils communs (limite par IP, appel Anthropic).
- Le niveau d'études et le nombre de pages visé (étape 1) règlent la longueur et le style de chaque partie dans `api/develop.js`.
- Ces fonctions utilisent la même variable `ANTHROPIC_API_KEY` ; sans elle, elles répondent « pas encore activée ».

## Modèles de page de garde

Le dossier `modeles-couverture/` contient un fichier par modèle (voir `_registre.js` pour les champs : catégories université / lycée / professionnel, moteur, style du ruban, couleur, en-tête). Pour ajouter un modèle : créer un fichier dans ce dossier et ajouter sa ligne `<script>` dans `index.html`. La galerie (étape « Page de garde ») montre ces modèles remplis avec les infos de l'étudiant ; le niveau choisi à l'étape 1 adapte les libellés (par exemple « Classe » au lieu de « Filière »).

## Rédaction avec recherche (exposé)

- Case décochée par défaut (pour limiter le coût) à l'étape 3 : pour chaque partie, `api/develop.js` active l'outil de recherche web (2 recherches maximum), rédige à partir des pages trouvées et renvoie les pages réellement utilisées ; le site les ajoute à la liste des sources (style de citation choisi).
- Fonctionne même sans idées notées (le sujet suffit). Les liens ne sont gardés que s'ils font partie des résultats réels de la recherche.
- Coût indicatif : environ 10 $ pour 1 000 recherches, soit ~0,02 $ par partie, plus les jetons. Limite : 24 rédactions avec recherche par heure et par adresse IP.
- La recherche web doit être activée dans la console Anthropic (Settings, Capabilities). `vercel.json` autorise 60 s par appel.

Pour le rapport de stage, la recherche et la génération automatique existent aussi : la recherche ne sert qu'au contexte (secteur, notions, informations publiques) ; ce que l'étudiant a fait lui-même vient seulement de ses notes, et ce qui manque est marqué `[À compléter : …]`. Le téléchargement prévient s'il en reste.

## Structure des fichiers

- `index.html` : la structure de la page (chargement des fichiers).
- `style.css` : tout le style (couleurs en variables au début du fichier).
- `app.js` : tout le comportement (écrans, plan, rédaction, pages de garde, fabrication du fichier Word).
- `modeles-couverture/` : un fichier par modèle de page de garde.
- `api/` : fonctions serveur (IA, recherche de sources, paiement). Les clés restent dans Vercel, jamais dans le dépôt.

## Tester sans dépenser de crédit (mode simulation)

- `MOCK_AI=1` : les routes `/api/develop`, `/api/sources`, `/api/angle` et `/api/plans` renvoient de faux textes, sans aucun appel à Anthropic et sans clé. Scénario au choix avec `MOCK_CASE` : `ok` (défaut), `questions`, `error`, `slow` (5 s), `broken`.
- `AI_ENABLED=0` : coupe toute l'IA (réponse « pas encore activée »), même si la clé est présente.
- Réglage recommandé dans Vercel (Settings, Environment Variables) : **Production** = vraie clé `ANTHROPIC_API_KEY` ; **Preview** et **Development** = `MOCK_AI=1`, aucune clé.
- Chaque appel réel écrit dans les logs Vercel une ligne `usage {...}` (jetons et recherches consommés) : c'est le coût réel.
- Tests des routes sans appel réel : `node --test tests/api.test.js`.
