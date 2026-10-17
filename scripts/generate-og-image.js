/* eslint-disable no-undef */
// Source sharing copy from the shipped HTML so social previews cannot drift.
// Usage: node scripts/generate-og-image.js [case-slug]
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const slug = process.argv[2];
const root = path.join(__dirname, '..');
const input = path.join(root, slug ? 'cases/' + slug + '/index.html' : 'index.html');
const output = path.join(root, slug ? 'cases/' + slug + '/og.png' : 'og-image.png');
const source = fs.readFileSync(input, 'utf8');
const rawTitle = slug ? source.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1] : 'Platforms teams can trust.';
const title = rawTitle.replace(/<[^>]+>/g, '');
const subtitle = slug ? source.match(/<meta name="description" content="([^"]*)"/)[1] : 'Reliable delivery. Useful observability. Engineering decisions backed by real work.';
const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><style>
* { box-sizing: border-box; margin: 0; } body { width: 1200px; height: 630px; background: #0a0f1e; color: #f1f5f9; padding: 64px 76px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; flex-direction: column; justify-content: space-between; }
.name { font-size: 28px; font-weight: 600; } .role { color: #94a3b8; font-size: 20px; margin-top: 8px; } h1 { font-size: 60px; line-height: 1.1; letter-spacing: -2px; font-weight: 700; max-width: 1050px; } .subtitle { font-size: 23px; line-height: 1.4; color: #94a3b8; margin-top: 22px; max-width: 960px; } footer { border-top: 1px solid #334155; padding-top: 20px; color: #60a5fa; display: flex; justify-content: space-between; font-size: 20px; }
</style></head><body><header><p class="name">Vitor Schiavo</p><p class="role">Site Reliability &amp; Platform Engineer</p></header><main><h1>${title}</h1><p class="subtitle">${subtitle}</p></main><footer><span>${slug ? 'Engineering case study' : 'Selected engineering work'}</span><span>vitorspk.github.io</span></footer></body></html>`;
(async () => {
    const browser = await chromium.launch();
    try {
        const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
        await page.setContent(html);
        await page.screenshot({ path: output, type: 'png' });
        console.log('Generated ' + output);
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
