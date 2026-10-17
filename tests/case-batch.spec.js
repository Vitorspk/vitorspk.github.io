const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

test.use({ viewport: { width: 1280, height: 800 } });

const PAGES = [
  { path: '/cases/gcp-storage-cost-reduction/', title: /Cutting a GCP storage bill by 95\.9%/i, h1: /storage/i },
  { path: '/cases/cloud-functions-gen1-gen2/', title: /Gen1 to Gen2/i, h1: /Cloud Functions/i },
  { path: '/cases/kubernetes-supply-chain-defense/', title: /supply-chain attacks/i, h1: /Defending Kubernetes/i },
  { path: '/cases/grafana-prometheus-modernization/', title: /Grafana \+ Prometheus/i, h1: /Grafana and Prometheus/i },
  { path: '/cases/gke-dataplane-v2-cilium/', title: /Dataplane V2/i, h1: /Dataplane V2/i },
  { path: '/cases/kubernetes-finops-kubecost/', title: /Kubecost/i, h1: /cost visibility/i },
  { path: '/cases/zero-downtime-cluster-migration/', title: /Zero-downtime migration/i, h1: /Zero-downtime migration/i },
  { path: '/cases/strapi-v4-to-v5-upgrade/', title: /Strapi from v4 to v5/i, h1: /Upgrading Strapi/i },
  { path: '/cases/metabase-production-ops/', title: /Running Metabase/i, h1: /Running Metabase/i },
];

for (const p of PAGES) {
  test.describe(`Case page — ${p.path}`, () => {
    test('loads the standalone page (not the SPA fallback)', async ({ page }) => {
      await page.goto(p.path);
      await expect(page).toHaveTitle(p.title);
    });

    test('has exactly one h1', async ({ page }) => {
      await page.goto(p.path);
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);
      await expect(h1).toHaveText(p.h1);
    });

    test('axe-core: no violations', async ({ page }) => {
      await page.goto(p.path);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(results.violations).toEqual([]);
    });

    test('back link points to the portfolio cases section', async ({ page }) => {
      await page.goto(p.path);
      await expect(page.locator('a.backlink')).toHaveAttribute('href', '/#cases');
    });

    test('stored light theme is applied, and toggle works', async ({ page }) => {
      await page.goto(p.path);
      await page.evaluate(() => localStorage.setItem('theme', 'light'));
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      await page.locator('#themeToggle').click();
      await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'light');
    });
  });
}
