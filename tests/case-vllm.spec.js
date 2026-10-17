const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const PAGE = '/cases/self-hosting-gemma-3-vllm/';

test.use({ viewport: { width: 1280, height: 800 } });

test.describe('Case page — self-hosting Gemma 3 vLLM', () => {
  test('loads the standalone page (not the SPA fallback)', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page).toHaveTitle(/Operating multimodal LLMs/);
  });

  test('has exactly one h1 with the article title', async ({ page }) => {
    await page.goto(PAGE);
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText('Operating multimodal LLMs');
  });

  test('axe-core: no violations', async ({ page }) => {
    await page.goto(PAGE);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('skip link is the first focusable element', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit mobile does not support Tab key focus navigation');
    await page.goto(PAGE);
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement.className);
    expect(focused).toContain('skip-link');
  });

  test('back link points to the portfolio cases section', async ({ page }) => {
    await page.goto(PAGE);
    const back = page.locator('a.backlink');
    await expect(back).toHaveAttribute('href', '/#cases');
    await back.click();
    await expect(page).toHaveURL(/\/#cases$/);
    await expect(page.locator('#cases')).toBeAttached();
  });

  test('stored light theme is applied on load', async ({ page }) => {
    await page.goto(PAGE);
    await page.evaluate(() => localStorage.setItem('theme', 'light'));
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('theme toggle switches theme', async ({ page }) => {
    await page.goto(PAGE);
    await page.evaluate(() => localStorage.removeItem('theme'));
    await page.reload();
    const html = page.locator('html');
    await expect(html).not.toHaveAttribute('data-theme', 'light');
    await page.locator('#themeToggle').click();
    await expect(html).toHaveAttribute('data-theme', 'light');
  });
});
