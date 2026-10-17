const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

test('platform explorer connects a technical decision to a real case', async ({ page }) => {
  await page.goto('/');
  const explorer = page.getByRole('group', { name: 'Explore platform engineering' });
  await expect(explorer).toBeVisible();
  await explorer.getByRole('button', { name: 'Reliability', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#platform-story-title')).toHaveText('Make the signal trustworthy.');
  await expect(page.locator('#platform-story-link')).toHaveAttribute('href', '/cases/gen2-observability-repair/');
  await expect(explorer.getByRole('button', { name: 'Reliability', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await explorer.getByRole('button', { name: 'Cost efficiency', exact: true }).click();
  await expect(page.locator('#platform-story-link')).toHaveAttribute('href', '/cases/monitoring-ingestion-cost/');
  await expect(page.locator('#platform-story-result')).toContainText('£1,165.80');
  await explorer.getByRole('button', { name: 'Delivery', exact: true }).click();
  await expect(page.locator('#platform-story-result')).toContainText('Two-repository pilot');
});

test('specialties lead to the matching work without losing navigation history', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'AI infrastructure: explore work' }).click();
  await expect(page).toHaveURL(/#cases\/ai$/);
  await expect(page.locator('#cases')).toHaveAttribute('aria-hidden', 'false');
  await expect(page.locator('[data-filter="ai"]')).toHaveAttribute('aria-pressed', 'true');
  await page.goBack();
  await expect(page.locator('#overview')).toHaveAttribute('aria-hidden', 'false');
});

test('explorer remains usable and accessible in both themes and at narrow widths', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const theme of ['light', 'dark']) {
    await page.evaluate(value => document.documentElement.setAttribute('data-theme', value), theme);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    for (const name of ['Delivery', 'Reliability', 'Cost efficiency']) {
      await page.getByRole('group', { name: 'Explore platform engineering' }).getByRole('button', { name, exact: true }).click();
      const result = await new AxeBuilder({ page }).include('.platform-explorer').withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(result.violations).toEqual([]);
    }
  }
  for (const width of [320, 390, 768, 820, 1024, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole('group', { name: 'Explore platform engineering' })).toBeVisible();
  }
});

test('every catalog item has a concise explanatory drawing and articles show it before the detail', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('/#cases');
  const cases = page.locator('#cases .case-study');
  await expect(page.locator('#cases .case-map')).toHaveCount(await cases.count());
  const articlePaths = await cases.locator('a[href^="/cases/"]').evaluateAll(links => [...new Set(links.map(link => link.getAttribute('href')))]);
  await page.setViewportSize({ width: 320, height: 844 });
  for (const path of articlePaths) {
    await page.goto(path);
    const drawing = page.locator('.case-map');
    await expect(drawing).toHaveCount(1);
    await expect(drawing).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path).toBe(true);
    const visualBox = await drawing.boundingBox();
    const firstHeading = await page.locator('.doc-body h2').first().boundingBox();
    expect(visualBox.y, path).toBeLessThan(firstHeading.y);
  }
});

test('diagram legends remain clear of the architecture nodes at every breakpoint', async ({ page }) => {
  await page.goto('/');
  for (const width of [320, 390, 820, 900, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const name of ['Delivery', 'Reliability', 'Cost efficiency']) {
      await page.getByRole('group', { name: 'Explore platform engineering' }).getByRole('button', { name, exact: true }).click();
      const gap = await page.locator('.platform-diagram').evaluate(diagram => {
        const nodesEnd = Math.max(...Array.from(diagram.querySelectorAll('.platform-node'), node => node.getBoundingClientRect().bottom));
        return diagram.querySelector('.platform-foundation').getBoundingClientRect().top - nodesEnd;
      });
      expect(gap, `${width}px/${name}`).toBeGreaterThanOrEqual(3);
    }
  }
});
