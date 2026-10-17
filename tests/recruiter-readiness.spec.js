const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const AxeBuilder = require('@axe-core/playwright').default;

test('recruiter can identify positioning, follow the reading route and download a PDF', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('.hero-role').first()).toHaveText('Senior Platform & Site Reliability Engineer');
  const route = page.getByRole('navigation', { name: 'Recommended case studies' });
  const links = route.getByRole('link');
  await expect(links).toHaveCount(3);
  expect(await links.evaluateAll(nodes => nodes.map(node => node.getAttribute('href')))).toEqual([
    '/cases/self-hosting-gemma-3-vllm/', '/cases/cloud-cost-engineering/', '/cases/gen2-observability-repair/'
  ]);
  const download = page.locator('.hero-cta a[download]');
  await expect(download).toHaveAttribute('href', '/Vitor-Schiavo-Resume.pdf');
  const pdf = await request.get('/Vitor-Schiavo-Resume.pdf');
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()['content-type']).toContain('application/pdf');
  const pdfBytes = await pdf.body();
  expect(pdfBytes.subarray(0, 5).toString()).toBe('%PDF-');
  expect(pdfBytes.length).toBeGreaterThan(25000);
  const pdfSource = pdfBytes.toString('latin1');
  expect((pdfSource.match(/\/Type\s*\/Page\b/g) || []).length).toBe(2);
  const inputs = ['resume.html', 'styles.css', 'scripts/generate-resume-pdf.js'];
  const fingerprint = crypto.createHash('sha256').update(inputs.map(file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8')).join('\0')).digest('hex');
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/resume-artifact.json'), 'utf8'));
  expect(manifest.sourceSha256, 'regenerate the PDF after changing its HTML, CSS or generator').toBe(fingerprint);
  // Compare the committed download to its manifest; CI never regenerates the PDF.
  // A browser upgrade cannot alter either committed artifact during this check.
  expect(crypto.createHash('sha256').update(pdfBytes).digest('hex')).toBe(manifest.pdfSha256);
  await page.goto('/#contact');
  await expect(page.getByRole('heading', { name: 'Working together internationally' })).toBeVisible();
  await expect(page.locator('#contact')).toContainText('English — professional working proficiency');
});

test('case studies expose ownership and decisions without hiding the diagrams', async ({ page }) => {
  test.setTimeout(90000);
  const cases = fs.readdirSync(path.join(__dirname, '../cases'), { withFileTypes: true }).filter(entry => entry.isDirectory());
  for (const entry of cases) {
    await page.goto(`/cases/${entry.name}/`);
    const summary = page.locator('.case-brief');
    await expect(summary, entry.name).toBeVisible();
    await expect(summary.locator('dt')).toHaveText(['My responsibility', 'Scope', 'Collaboration & boundaries', 'Outcome']);
    await expect(page.locator('.case-map')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Decisions and next steps', exact: true })).toBeVisible();
  }
});

test('technical demonstration has real source, clear scope and an accessible entry point', async ({ page, request }) => {
  await page.goto('/#about');
  await expect(page.getByRole('heading', { name: 'Technical leadership in practice' })).toBeVisible();
  const source = page.getByRole('link', { name: 'Read the Python implementation' });
  await expect(source).toHaveAttribute('href', /github.com\/Vitorspk\/vitorspk.github.io\/tree\/master\/examples\/inference-fallback/);
  const zip = await request.get('/examples/inference-fallback.zip');
  expect(zip.status()).toBe(200);
  expect((await zip.body()).subarray(0, 2).toString()).toBe('PK');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
});
