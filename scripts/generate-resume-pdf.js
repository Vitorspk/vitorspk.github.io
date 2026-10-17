// Generate the downloadable résumé from the same HTML and print CSS as the site.
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.join(__dirname, '..');
const resources = new Map([
    ['/resume.html', ['resume.html', 'text/html']],
    ['/styles.css', ['styles.css', 'text/css']],
    ['/resume.js', ['resume.js', 'application/javascript']],
]);
async function main() {
    const server = http.createServer((request, response) => {
        const resource = resources.get(request.url);
        if (!resource) { response.writeHead(404).end(); return; }
        response.writeHead(200, { 'Content-Type': resource[1] });
        response.end(fs.readFileSync(path.join(root, resource[0])));
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    let browser;
    try {
        browser = await chromium.launch();
        const page = await browser.newPage();
        // Use the local system font fallback; generation needs no external assets.
        await page.route('https://**/*', route => route.abort());
        await page.goto('http://127.0.0.1:' + server.address().port + '/resume.html', { waitUntil: 'networkidle' });
        await page.emulateMedia({ media: 'print' });
        await page.pdf({ path: path.join(root, 'Vitor-Schiavo-Resume.pdf'), format: 'A4',
            margin: { top: '12mm', bottom: '12mm', left: '14mm', right: '14mm' },
            printBackground: false, tagged: true });
        // Bind both sources and PDF bytes without exposing provenance in the title.
        // Chromium timestamps vary; a manifest catches stale exports across OSes.
        const inputs = ['resume.html', 'styles.css', 'scripts/generate-resume-pdf.js'];
        const sourceSha256 = crypto.createHash('sha256').update(inputs.map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\0')).digest('hex');
        const pdfSha256 = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'Vitor-Schiavo-Resume.pdf'))).digest('hex');
        fs.writeFileSync(path.join(root, 'content/resume-artifact.json'), JSON.stringify({ sourceSha256, pdfSha256 }, null, 2) + '\n');
        process.stdout.write('Generated Vitor-Schiavo-Resume.pdf from resume.html.\n');
    } finally {
        if (browser) await browser.close();
        await new Promise(resolve => server.close(resolve));
    }
}
main().catch(error => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });
