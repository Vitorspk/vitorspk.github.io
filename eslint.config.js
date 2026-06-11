// Flat config (ESLint v9+). Replaces the legacy .eslintrc.json.
// Lints the root-level browser script (script.js); playwright.config.js and
// tests/ stay excluded (they're Node/CommonJS with their own conventions).
const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
    js.configs.recommended,
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'script',
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            'no-console': 'warn',
            'no-debugger': 'error',
            'no-unused-vars': 'warn',
            'semi': ['error', 'always'],
            'quotes': ['error', 'single', { avoidEscape: true }],
            'indent': ['error', 4],
            'no-multiple-empty-lines': ['error', { max: 1 }],
            'eol-last': ['error', 'always'],
        },
    },
    {
        // Node/CommonJS files and generated assets — not part of the browser
        // bundle. eslint.config.js itself is CommonJS, so exclude it too.
        ignores: ['eslint.config.js', 'playwright.config.js', 'tests/', 'scripts/', 'styles.css'],
    },
];
