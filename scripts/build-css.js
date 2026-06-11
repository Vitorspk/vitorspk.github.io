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
    const parts = MODULES.map(m => {
        const content = fs.readFileSync(path.join(ROOT, 'css', m), 'utf8');
        // Guarantee a separating newline so a module without a trailing
        // newline can't merge its last line into the next module's first.
        return content.endsWith('\n') ? content : content + '\n';
    });
    return HEADER + parts.join('');
}

// Normalize CRLF→LF so the sync check doesn't fail on machines where git's
// core.autocrlf rewrote line endings on checkout.
const normalize = str => str.replace(/\r\n/g, '\n');

const check = process.argv.includes('--check');
const built = build();

if (check) {
    const current = fs.existsSync(OUTPUT) ? fs.readFileSync(OUTPUT, 'utf8') : '';
    if (normalize(current) !== normalize(built)) {
        console.error('styles.css is out of sync with css/ modules. Run: npm run build:css');
        process.exit(1);
    }
    console.log('styles.css is in sync with css/ modules.');
} else {
    fs.writeFileSync(OUTPUT, built);
    console.log('Built styles.css from ' + MODULES.length + ' modules.');
}
