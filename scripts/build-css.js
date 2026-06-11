/* eslint-disable no-undef */
// Concatenates the CSS modules in css/ into the deployed styles.css.
// GitHub Pages serves styles.css directly (no bundler), so this generated
// file is committed. Module order defines the cascade — do not reorder.
//
// Usage:
//   node scripts/build-css.js          # regenerate styles.css
//   node scripts/build-css.js --check  # exit 1 if styles.css is stale
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MODULES = [
    'tokens.css',
    'base.css',
    'layout.css',
    'components.css',
    'responsive.css',
];
const OUTPUT = path.join(ROOT, 'styles.css');
const HEADER =
    '/* AUTO-GENERATED — do not edit directly.\n' +
    '   Edit the modules in css/ and run `npm run build:css`.\n' +
    '   Module order (cascade): ' + MODULES.join(' → ') + ' */\n\n';

function build() {
    const parts = MODULES.map(m => fs.readFileSync(path.join(ROOT, 'css', m), 'utf8'));
    return HEADER + parts.join('');
}

const check = process.argv.includes('--check');
const built = build();

if (check) {
    const current = fs.existsSync(OUTPUT) ? fs.readFileSync(OUTPUT, 'utf8') : '';
    if (current !== built) {
        console.error('styles.css is out of sync with css/ modules. Run: npm run build:css');
        process.exit(1);
    }
    console.log('styles.css is in sync with css/ modules.');
} else {
    fs.writeFileSync(OUTPUT, built);
    console.log('Built styles.css from ' + MODULES.length + ' modules.');
}
