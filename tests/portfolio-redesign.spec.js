const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const TABS = ['overview', 'cases', 'experience', 'about', 'contact'];

const nav = (page, id) => page.locator(`#${id}`).getAttribute('aria-labelledby').then(label => page.locator(`#${label}`).click());

test('five clear destinations and work-first home', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.sidebar-nav [role="tab"]')).toHaveCount(5);
  await expect(page.locator('#overview h1')).toContainText('Vitor Schiavo');
  await expect(page.locator('#overview .featured-case')).toHaveCount(3);
  await page.getByRole('button', { name: 'Explore selected work' }).click();
  await expect(page.locator('#selected-work')).toBeInViewport();
});

test('legacy hashes, direct hash changes and history reach useful content', async ({ page }) => {
  for (const [hash, target] of [['skills', 'about'], ['finops', 'cases'], ['aiml', 'cases'], ['technical', 'cases'], ['achievements', 'overview'], ['projects', 'cases']]) {
    await page.goto(`/#${hash}`);
    await expect(page.locator(`#${target}`)).toHaveAttribute('aria-hidden', 'false');
  }
  await page.evaluate(() => { location.hash = 'about'; });
  await expect(page.locator('#about')).toHaveAttribute('aria-hidden', 'false');
  await nav(page, 'contact');
  await page.goBack();
  await expect(page.locator('#about')).toHaveAttribute('aria-hidden', 'false');
});

test('category filtering exposes matching work, counts and focusable links only', async ({ page }) => {
  await page.goto('/#cases');
  const all = await page.locator('#cases .case-study').count();
  expect(all).toBeGreaterThan(19);
  await page.getByRole('button', { name: 'Security', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Security', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const shown = page.locator('#cases .case-study:visible');
  expect(await shown.count()).toBeLessThan(all);
  for (const item of await shown.all()) await expect(item).toHaveAttribute('data-category', /security/);
  const hiddenFocus = await page.locator('#cases .case-study[hidden]').evaluateAll(items => items.some(el => el.getClientRects().length));
  expect(hiddenFocus).toBe(false);
  await page.getByRole('button', { name: 'All work', exact: true }).click();
  await expect(shown).toHaveCount(all);
});

test('case results explain contribution and evidence without cumulative projections', async ({ page }) => {
  await page.goto('/cases/gcp-storage-cost-reduction/');
  await expect(page.getByRole('heading', { name: 'My contribution' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Results and measurement' })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('well over a third of a million across three years');
  await page.goto('/cases/self-hosting-gemma-3-vllm/');
  await expect(page.locator('body')).not.toContainText('measured SLAs');
  await expect(page.getByRole('heading', { name: 'Results and measurement' })).toBeVisible();
});

test('contact supports a real email fallback and a printable résumé', async ({ page }) => {
  await page.goto('/#contact');
  await expect(page.getByRole('link', { name: 'Email Vitor', exact: true })).toHaveAttribute('href', 'mailto:vitorspk@gmail.com');
  await expect(page.getByRole('button', { name: 'Copy email address' })).toBeVisible();
  await page.getByRole('link', { name: 'View printable résumé', exact: true }).click();
  await expect(page.locator('h1')).toHaveText('Vitor Schiavo');
  await expect(page.getByRole('button', { name: 'Print or save as PDF' })).toBeVisible();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.resume-actions')).not.toBeVisible();
  await expect(page.locator('.resume-role').first()).toBeVisible();
});

test('clipboard failure leaves the email usable and announces an alternative', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('Denied')) } }));
  await page.goto('/#contact');
  await page.getByRole('button', { name: 'Copy email address' }).click();
  await expect(page.locator('#copy-status')).toContainText('select');
  await expect(page.getByRole('link', { name: 'Email Vitor', exact: true })).toBeVisible();
});

test('mobile shows real work early and all navigation destinations fit', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const firstCase = await page.locator('.featured-case').first().boundingBox();
  expect(firstCase.y).toBeLessThan(800);
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.locator('.mobile-tabs').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    for (const tab of TABS) await expect(page.locator(`#mobile-tab-${tab}`)).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('every destination is accessible in both themes', async ({ page }) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const theme of ['dark', 'light']) {
    await page.evaluate(value => document.documentElement.setAttribute('data-theme', value), theme);
    for (const tab of TABS) {
      await nav(page, tab);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(results.violations, `${theme}/${tab}`).toEqual([]);
    }
  }
});

test('skip link keeps the active destination instead of returning home', async ({ page }) => {
  await page.goto('/#about');
  await page.locator('.skip-link').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#about')).toHaveAttribute('aria-hidden', 'false');
});

test('returning to filtered work preserves its shareable URL and reload state', async ({ page }) => {
  await page.goto('/#cases');
  await page.getByRole('button', { name: 'Security', exact: true }).click();
  await nav(page, 'about');
  await nav(page, 'cases');
  await expect(page).toHaveURL(/#cases\/security$/);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Security', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('expanded technical evidence remains readable in the light theme', async ({ page }) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#cases');
  await page.locator('#themeToggle').click();
  for (const header of await page.locator('#cases .case-header').all()) await header.click();
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(result.violations).toEqual([]);
});

test('theme control stays in the navigation chrome while reading', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 768 });
  await page.goto('/');
  await page.evaluate(() => scrollTo(0, 2010));
  await expect(page.locator('.sidebar #themeToggle')).toBeVisible();
  const control = await page.locator('#themeToggle').boundingBox();
  const sidebar = await page.locator('.sidebar').boundingBox();
  expect(control.x + control.width).toBeLessThanOrEqual(sidebar.x + sidebar.width);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.topbar #themeToggle')).toBeVisible();
});


test('history restores category once and invalid categories canonicalize without extra entries', async ({ page }) => {
  await page.goto('/#cases/security');
  await nav(page, 'about');
  await page.evaluate(() => {
    window.tabRestoreScrolls = 0;
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (...args) {
      if (this.id === 'mobile-tab-cases') window.tabRestoreScrolls++;
      return original.apply(this, args);
    };
  });
  await page.goBack();
  await expect(page.getByRole('button', { name: 'Security', exact: true })).toHaveAttribute('aria-pressed', 'true');
  // Let both browser traversal events settle before counting restorations.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(await page.evaluate(() => window.tabRestoreScrolls)).toBe(1);
  await page.goForward();
  await expect(page.locator('#about')).toHaveAttribute('aria-hidden', 'false');
  await page.evaluate(() => { location.hash = 'cases/bogus'; });
  await expect(page).toHaveURL(/#cases$/);
  await expect(page.getByRole('button', { name: 'All work', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.goBack();
  await expect(page.locator('#about')).toHaveAttribute('aria-hidden', 'false');
});
