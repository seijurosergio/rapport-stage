const read = ['window', 'document', 'localStorage', 'fetch', 'atob', 'btoa', 'Uint8Array', 'Image', 'FileReader', 'URL', 'AbortController', 'setTimeout', 'clearTimeout', 'navigator', 'location', 'Blob', 'Event', 'HTMLElement', 'requestAnimationFrame', 'getComputedStyle'];
const node = ['require', 'process', 'module', '__dirname', 'global', 'Buffer', 'fetch', 'URL', 'setTimeout', 'clearTimeout', 'setImmediate', 'AbortController', 'console'];
const toGlobals = function (names) { return Object.fromEntries(names.map(function (n) { return [n, 'readonly']; })); };
const rules = {
  'no-var': 'error',
  'prefer-const': 'error',
  'no-undef': 'error',
  'no-use-before-define': ['error', { functions: false, classes: false, variables: true }],
  'no-unused-vars': ['error', { args: 'after-used', caughtErrors: 'none' }]
};

module.exports = [
  { ignores: ['vendor/**', 'node_modules/**', 'output/**'] },
  {
    // Navigateur : app.js, modules js/ (aussi chargés par Node pour les tests), modèles de page de garde
    files: ['app.js', 'js/**/*.js', 'modeles-couverture/**/*.js'],
    languageOptions: { sourceType: 'script', globals: Object.assign({ console: 'readonly' }, toGlobals(read), toGlobals(['module', 'require'])) },
    rules: Object.assign({}, rules, { 'no-console': ['error', { allow: ['error'] }] })
  },
  {
    // Serveur : aucun console.* sauf api/_log.js (journaux filtrés)
    files: ['api/**/*.js'],
    languageOptions: { sourceType: 'commonjs', globals: toGlobals(node) },
    rules: Object.assign({}, rules, { 'no-console': 'error' })
  },
  {
    files: ['api/_log.js', 'dev-server.js', 'tests/**/*.js', 'eslint.config.js'],
    languageOptions: { sourceType: 'commonjs', globals: Object.assign(toGlobals(node), toGlobals(read)) },
    rules: Object.assign({}, rules, { 'no-console': 'off' })
  }
];
