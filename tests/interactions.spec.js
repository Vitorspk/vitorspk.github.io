const { test, expect } = require('@playwright/test');

// Visual order of the sidebar tablist buttons — keyboard navigation follows
// this order (tabNames in script.js is derived from the tablist buttons so
// Arrow/Home/End matches what users see — WCAG 2.4.3 Focus Order).
const TAB_NAMES = ['overview', 'experience', 'skills', 'cases', 'aiml', 'finops', 'technical', 'achievements', 'projects'];

test.use({ viewport: { width: 1280, height: 800 } });

test.describe('Scroll-to-top button', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('hidden at top of page', async ({ page }) => {
    const btn = page.locator('#scrollToTop');
    await expect(btn).not.toHaveClass(/visible/);
  });

  test('appears after scrolling past 300px', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 800));
    // onScroll is debounced 80ms — auto-retrying assertion covers it
    await expect(page.locator('#scrollToTop')).toHaveClass(/visible/);
  });

  test('clicking scrolls back to top and hides again', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 800));
    const btn = page.locator('#scrollToTop');
    await expect(btn).toHaveClass(/visible/);
    await btn.click();
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 }).toBeLessThan(50);
    await expect(btn).not.toHaveClass(/visible/);
  });
});

test.describe('Reading progress bar', () => {
  test('starts at 0 and grows on scroll', async ({ page }) => {
    await page.goto('/');
    const width = () => page.evaluate(() => parseFloat(document.getElementById('progressBar').style.width) || 0);
    expect(await width()).toBe(0);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(width, { timeout: 5000 }).toBeGreaterThan(50);
  });
});

test.describe('Metric bar animations', () => {
  test('bar-fill animates to its data-width when scrolled into view', async ({ page }) => {
    await page.goto('/');
    const bar = page.locator('#overview .bar-fill').first();
    const target = await bar.getAttribute('data-width');
    expect(target).toBeTruthy();
    await bar.scrollIntoViewIfNeeded();
    // IntersectionObserver fires, then double-rAF, then 1.5s CSS transition
    await expect.poll(
      () => bar.evaluate(el => el.style.width),
      { timeout: 10000 }
    ).toBe(target);
  });
});

test.describe('Keyboard navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('ArrowDown moves to next tab in panel DOM order', async ({ page }) => {
    await page.locator('#tab-overview').focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator(`#${TAB_NAMES[1]}`)).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator(`#tab-${TAB_NAMES[1]}`)).toBeFocused();
  });

  test('ArrowUp from first tab wraps to last', async ({ page }) => {
    await page.locator('#tab-overview').focus();
    await page.keyboard.press('ArrowUp');
    const last = TAB_NAMES[TAB_NAMES.length - 1];
    await expect(page.locator(`#${last}`)).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator(`#tab-${last}`)).toBeFocused();
  });

  test('ArrowDown from last tab wraps to first', async ({ page }) => {
    const last = TAB_NAMES[TAB_NAMES.length - 1];
    await page.locator(`#tab-${last}`).click();
    await page.locator(`#tab-${last}`).focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#overview')).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('#tab-overview')).toBeFocused();
  });

  test('Home and End jump to first and last tabs', async ({ page }) => {
    await page.locator('#tab-overview').focus();
    await page.keyboard.press('End');
    const last = TAB_NAMES[TAB_NAMES.length - 1];
    await expect(page.locator(`#${last}`)).toHaveAttribute('aria-hidden', 'false');
    await page.keyboard.press('Home');
    await expect(page.locator('#overview')).toHaveAttribute('aria-hidden', 'false');
  });

  test('ArrowRight behaves like ArrowDown', async ({ page }) => {
    await page.locator('#tab-overview').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator(`#${TAB_NAMES[1]}`)).toHaveAttribute('aria-hidden', 'false');
  });
});

test.describe('Dynamic tenure', () => {
  test('current-role tenure is computed from data-tenure-since', async ({ page }) => {
    await page.goto('/');
    await page.locator('#tab-experience').click();
    const el = page.locator('[data-tenure-since]');
    const since = await el.getAttribute('data-tenure-since');
    const [sy, sm] = since.split('-').map(Number);
    const now = new Date();
    const months = (now.getFullYear() - sy) * 12 + (now.getMonth() + 1 - sm);
    const years = Math.floor(months / 12);
    const rem = months % 12;
    const expected = [
      years > 0 ? `${years} ${years === 1 ? 'year' : 'years'}` : null,
      rem > 0 ? `${rem} ${rem === 1 ? 'month' : 'months'}` : null,
    ].filter(Boolean).join(' ') || 'less than a month';
    await expect(el).toHaveText(expected);
  });
});

test.describe('Case study chevron', () => {
  test('chevron rotates 180deg when expanded', async ({ page }) => {
    await page.goto('/');
    await page.locator('#tab-cases').click();
    const study = page.locator('#cases .case-study').first();
    const toggle = study.locator('.case-toggle');
    await expect(toggle).toHaveCSS('transform', 'none');
    await study.locator('.case-header').click();
    // rotate(180deg) computes to matrix(-1, 0, 0, -1, 0, 0)
    await expect(toggle).toHaveCSS('transform', 'matrix(-1, 0, 0, -1, 0, 0)');
  });
});

test.describe('Reduced motion', () => {
  // test.use({ reducedMotion }) is unreliable here (matchMedia still reports
  // no-preference); emulateMedia BEFORE page load guarantees script.js reads
  // the right value on DOMContentLoaded.
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('no reveal animation classes are added', async ({ page }) => {
    await page.goto('/');
    const revealCount = await page.locator('.reveal').count();
    expect(revealCount).toBe(0);
  });

  test('metric bars get final width without animation', async ({ page }) => {
    await page.goto('/');
    const bar = page.locator('#overview .bar-fill').first();
    const target = await bar.getAttribute('data-width');
    await bar.scrollIntoViewIfNeeded();
    // With reduced motion, JS sets the final width immediately (no transition)
    await expect.poll(
      () => bar.evaluate(el => el.style.width),
      { timeout: 3000 }
    ).toBe(target);
  });
});
