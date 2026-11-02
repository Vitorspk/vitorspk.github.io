const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const AxeBuilder = require('@axe-core/playwright').default;

test('recruiter can identify positioning, follow the reading route and download a PDF', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('.hero-role').first()).toHaveText('Site Reliability & Platform Engineering Specialist');
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

// Guard for the CLAUDE.md "Content accuracy" rule: the positioning copy of every
// locale page (title, human-readable description/OG/Twitter tags, JSON-LD, hero,
// availability lines, résumé intro) must not carry a seniority level in any
// language. "SRE" in <title> is a deliberate abbreviation, not drift.
//
// Case-sensitive on purpose: "lead", "staff" and "líder" are ordinary words in
// prose, while Senior/Sênior is a level claim in any case. Leadership nouns
// ("leadership", "liderança") and past held titles ("Junior IT Support Analyst")
// are legitimate content and stay out of the list.
const LEVEL_WORDS = /\b[Ss][êe]nior\b|\bStaff\b|\bLead\b|\bL[íi]der\b|\bSr\b\.?/;
const LOCALE_PAGES = ['/', '/pt/', '/es/', '/resume.html', '/pt/resume.html', '/es/resume.html'];
const POSITIONING = ['.hero-role', '.sidebar-status', '.hero-availability', '.international-fit dd', '#contact .section-subtitle', '.resume-page > p'];
// Human-readable head copy only; URLs, locale codes and image dimensions are skipped.
const HEAD_COPY = ['description', 'twitter:title', 'twitter:description', 'twitter:image:alt'].map(name => `meta[name="${name}"]`)
  .concat(['og:title', 'og:description', 'og:image:alt'].map(property => `meta[property="${property}"]`)).join(', ');
const JSON_LD = 'script[type="application/ld+json"]';
const SHARING_META = /<meta (?:name|property)="(?:description|og:title|og:description|og:image:alt|twitter:title|twitter:description|twitter:image:alt)" content="([^"]*)"/g;

test('level-word guard matches the forbidden forms and not ordinary prose', () => {
  for (const forbidden of ['Senior Platform & Site Reliability Engineer', 'Open to Senior & Staff roles', 'Platform e Site Reliability Engineer Sênior', 'Engineer sênior especializado', 'Abierto a roles Senior y Staff', 'Lead Platform Engineer', 'Líder de SRE', 'Engenheiro Sr.']) {
    expect(forbidden).toMatch(LEVEL_WORDS);
  }
  for (const allowed of ['Site Reliability & Platform Engineering Specialist', 'Especialista em SRE e Platform Engineering', 'Open to SRE & Platform roles', 'the gap between seniors and juniors', 'changes that lead to fewer incidents', 'a small staff of engineers', 'Technical leadership in practice', 'Junior IT Support Analyst']) {
    expect(allowed).not.toMatch(LEVEL_WORDS);
  }
});

test('no seniority level word in the positioning copy of any locale page', async ({ page }) => {
  test.setTimeout(60000);
  for (const route of LOCALE_PAGES) {
    await page.goto(route);
    const heroRole = page.locator('.hero-role').first();
    await expect(heroRole, `${route}: hero role present`).toHaveText(/\S/);
    // Non-vacuity: every scanned group must be present, so a markup rename fails loudly.
    expect(await page.locator(HEAD_COPY).count(), `${route}: head copy tags present`).toBeGreaterThanOrEqual(3);
    expect(await page.locator(JSON_LD).count(), `${route}: JSON-LD present`).toBeGreaterThanOrEqual(1);
    if (route.endsWith('.html')) {
      expect(await page.locator('.resume-page > p').count(), `${route}: résumé intro present`).toBeGreaterThanOrEqual(2);
    } else {
      for (const selector of ['.sidebar-status', '.hero-availability', '#contact .section-subtitle']) {
        await expect(page.locator(selector), `${route}: ${selector} present`).toHaveCount(1);
      }
      expect(await page.locator('.international-fit dd').count(), `${route}: role list present`).toBeGreaterThanOrEqual(1);
      // <title> and twitter:title are the hero role with "Site Reliability" abbreviated to
      // "SRE" (html-validate long-title limit); this keeps the two in step.
      const expectedTitle = 'Vitor Schiavo — ' + (await heroRole.textContent()).trim().replace('Site Reliability', 'SRE');
      expect(await page.title(), `${route}: <title> follows the hero role`).toBe(expectedTitle);
      expect(await page.locator('meta[name="twitter:title"]').getAttribute('content'), `${route}: twitter:title follows <title>`).toBe(expectedTitle);
    }
    const texts = [
      await page.title(),
      ...(await page.locator(HEAD_COPY).evaluateAll(nodes => nodes.map(node => node.getAttribute('content')))),
      ...(await page.locator(JSON_LD).allTextContents()),
      ...(await page.locator(POSITIONING.join(', ')).allTextContents())
    ];
    for (const text of texts) expect(text, `${route}: "${text}"`).not.toMatch(LEVEL_WORDS);
  }
});

// The OG images are rendered by scripts/generate-og-image.js: the root og-image.png
// from strings hardcoded in that template, each cases/<slug>/og.png from the case
// page's <h1> and meta description. Checking the template plus every case page's
// sharing copy covers the wording of all generated images without decoding PNGs.
test('OG image template and case page sharing copy carry no seniority level word', () => {
  const root = path.join(__dirname, '..');
  expect(fs.readFileSync(path.join(root, 'scripts/generate-og-image.js'), 'utf8'), 'OG image template').not.toMatch(LEVEL_WORDS);
  const casePages = ['cases', 'pt/cases', 'es/cases'].map(dir => path.join(root, dir)).filter(dir => fs.existsSync(dir))
    .flatMap(dir => fs.readdirSync(dir, { withFileTypes: true }).filter(entry => entry.isDirectory())
      .map(entry => path.join(dir, entry.name, 'index.html')).filter(file => fs.existsSync(file)));
  expect(casePages.length, 'case pages found').toBeGreaterThan(0);
  const strip = value => value.replace(/<[^>]+>/g, '');
  for (const file of casePages) {
    const html = fs.readFileSync(file, 'utf8');
    const label = path.relative(root, file);
    const copy = [
      ...[...html.matchAll(/<title>([\s\S]*?)<\/title>/g)].map(match => strip(match[1])),
      ...[...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map(match => strip(match[1])),
      ...[...html.matchAll(SHARING_META)].map(match => match[1])
    ];
    expect(copy.length, `${label}: sharing copy found`).toBeGreaterThanOrEqual(3);
    for (const text of copy) expect(text, `${label}: "${text}"`).not.toMatch(LEVEL_WORDS);
  }
});
