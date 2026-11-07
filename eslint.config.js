module.exports = [
  {
    files: ['app.js'],
    ignores: ['vendor/**', 'node_modules/**'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        Uint8Array: 'readonly',
        Image: 'readonly',
        FileReader: 'readonly',
        URL: 'readonly',
        AbortController: 'readonly',
        AbortError: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        Promise: 'readonly',
        Map: 'readonly',
        Date: 'readonly',
        JSON: 'readonly',
        Object: 'readonly',
        Array: 'readonly',
        String: 'readonly',
        Number: 'readonly',
        Math: 'readonly',
        RegExp: 'readonly',
        Error: 'readonly',
        encodeURIComponent: 'readonly',
        decodeURIComponent: 'readonly',
        parseInt: 'readonly',
        isNaN: 'readonly',
        isFinite: 'readonly'
      },
      sourceType: 'script'
    },
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
      'no-undef': 'error',
      'no-use-before-define': ['error', { functions: false, classes: false, variables: true }]
    }
  },
  {
    files: ['dev-server.js'],
    languageOptions: {
      globals: {
        require: 'readonly',
        process: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        Promise: 'readonly',
        Map: 'readonly',
        Date: 'readonly',
        JSON: 'readonly',
        Object: 'readonly',
        Array: 'readonly',
        String: 'readonly',
        Number: 'readonly',
        Math: 'readonly',
        RegExp: 'readonly',
        Error: 'readonly',
        Buffer: 'readonly'
      },
      sourceType: 'commonjs'
    },
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
      'no-undef': 'error',
      'no-use-before-define': ['error', { functions: false, classes: false, variables: true }]
    }
  },
  {
    files: ['api/**/*.js', 'tests/**/*.js'],
    languageOptions: {
      globals: {
        require: 'readonly',
        process: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        global: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        Promise: 'readonly',
        Map: 'readonly',
        Date: 'readonly',
        JSON: 'readonly',
        Object: 'readonly',
        Array: 'readonly',
        String: 'readonly',
        Number: 'readonly',
        Math: 'readonly',
        RegExp: 'readonly',
        Error: 'readonly',
        Buffer: 'readonly',
        fetch: 'readonly',
        URL: 'readonly'
      },
      sourceType: 'commonjs'
    },
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
      'no-undef': 'error',
      'no-use-before-define': ['error', { functions: false, classes: false, variables: true }]
    }
  },
  {
    files: ['eslint.config.js'],
    languageOptions: {
      globals: {
        module: 'readonly',
        require: 'readonly'
      },
      sourceType: 'commonjs'
    },
    rules: {
      'no-var': 'error',
      'prefer-const': 'error'
    }
  }
];