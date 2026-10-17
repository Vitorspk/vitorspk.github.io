/* eslint-env node */
/* eslint-disable no-undef */
/* Generates the page-specific Open Graph image for the GKE/Terraform case study.
   Mirrors scripts/generate-og-image.js (the site-wide card) so the two match.
   Run: npm run og:generate:case-gke  → cases/gke-terraform-shared-vpc/og.png */
const { chromium } = require('@playwright/test');
const path = require('path');

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 1200px;
    height: 630px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    overflow: hidden;
  }
  body {
    background: #0a0f1e;
    color: #f1f5f9;
    padding: 72px 90px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
  }
  body::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  body::after {
    content: '';
    position: absolute;
    top: -20%;
    right: -10%;
    width: 70%;
    height: 100%;
    background:
      radial-gradient(ellipse at 30% 50%, rgba(59,130,246,0.18) 0%, transparent 60%),
      radial-gradient(ellipse at 70% 50%, rgba(139,92,246,0.22) 0%, transparent 60%);
  }
  .top, .middle, .bottom { position: relative; z-index: 1; }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 8px 18px;
    background: rgba(59,130,246,0.15);
    border: 1px solid rgba(59,130,246,0.3);
    border-radius: 999px;
    font-size: 17px;
    font-weight: 700;
    color: #60a5fa;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .badge::before {
    content: '';
    width: 10px;
    height: 10px;
    background: #10b981;
    border-radius: 50%;
  }
  h1 {
    font-size: 64px;
    font-weight: 900;
    line-height: 1.08;
    letter-spacing: -0.03em;
    color: #f1f5f9;
    margin-top: 26px;
  }
  h1 .gradient {
    background: linear-gradient(135deg, #60a5fa 0%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .subtitle {
    font-size: 26px;
    color: #94a3b8;
    margin-top: 22px;
    line-height: 1.4;
    max-width: 980px;
  }
  .stats {
    display: flex;
    gap: 56px;
    margin-top: 12px;
  }
  .stat-value {
    font-size: 44px;
    font-weight: 900;
    letter-spacing: -0.02em;
    line-height: 1;
  }
  .stat-value.green { color: #10b981; }
  .stat-value.blue { color: #60a5fa; }
  .stat-value.purple { color: #a78bfa; }
  .stat-label {
    font-size: 17px;
    color: #94a3b8;
    margin-top: 8px;
    font-weight: 500;
  }
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 22px;
    color: #94a3b8;
  }
  .avatar {
    width: 60px;
    height: 60px;
    border-radius: 16px;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 800;
    font-size: 24px;
    box-shadow: 0 0 24px rgba(59,130,246,0.4);
  }
  .author { display: flex; align-items: center; gap: 18px; }
  .author-name { font-size: 24px; font-weight: 700; color: #f1f5f9; }
  .author-handle { font-size: 17px; color: #94a3b8; }
</style>
</head>
<body>
  <div class="top">
    <span class="badge">Case study · Infrastructure as code</span>
    <h1>Production-grade GKE<br><span class="gradient">with Terraform &amp; a Shared VPC</span></h1>
    <p class="subtitle">100% infrastructure as code, private clusters, prevent_destroy guardrails. Open-source landing zones for GCP, AWS &amp; Azure.</p>
  </div>

  <div class="middle">
    <div class="stats">
      <div>
        <div class="stat-value green">100%</div>
        <div class="stat-label">Infrastructure as code</div>
      </div>
      <div>
        <div class="stat-value blue">4</div>
        <div class="stat-label">GKE clusters, one pipeline</div>
      </div>
      <div>
        <div class="stat-value purple">3</div>
        <div class="stat-label">Open-source landing zones</div>
      </div>
    </div>
  </div>

  <div class="bottom footer">
    <div class="author">
      <div class="avatar">VS</div>
      <div>
        <div class="author-name">Vitor Schiavo</div>
        <div class="author-handle">Site Reliability Engineer</div>
      </div>
    </div>
    <div>vitorspk.github.io</div>
  </div>
</body>
</html>`;

(async () => {
    let browser;
    try {
        browser = await chromium.launch();
        const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
        await page.setContent(html);
        await page.waitForLoadState('networkidle');
        const outputPath = path.join(__dirname, '..', 'cases', 'gke-terraform-shared-vpc', 'og.png');
        await page.screenshot({ path: outputPath, type: 'png' });
        console.log('Generated:', outputPath);
    } catch (error) {
        console.error('Error generating OG image:', error);
        process.exit(1);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
})();
