/* eslint-env node */
/* eslint-disable no-undef */
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
    padding: 80px 96px;
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
    font-size: 18px;
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
    font-size: 80px;
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: -0.03em;
    color: #f1f5f9;
    margin-top: 30px;
  }
  h1 .gradient {
    background: linear-gradient(135deg, #60a5fa 0%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .subtitle {
    font-size: 30px;
    color: #94a3b8;
    margin-top: 24px;
    line-height: 1.4;
    max-width: 900px;
  }
  .stats {
    display: flex;
    gap: 48px;
    margin-top: 12px;
  }
  .stat-value {
    font-size: 48px;
    font-weight: 900;
    letter-spacing: -0.02em;
    line-height: 1;
  }
  .stat-value.green { color: #10b981; }
  .stat-value.blue { color: #60a5fa; }
  .stat-value.purple { color: #a78bfa; }
  .stat-label {
    font-size: 18px;
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
    width: 64px;
    height: 64px;
    border-radius: 16px;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 800;
    font-size: 26px;
    box-shadow: 0 0 24px rgba(59,130,246,0.4);
  }
  .author {
    display: flex;
    align-items: center;
    gap: 18px;
  }
  .author-name {
    font-size: 26px;
    font-weight: 700;
    color: #f1f5f9;
  }
  .author-handle {
    font-size: 18px;
    color: #94a3b8;
  }
</style>
</head>
<body>
  <div class="top">
    <span class="badge">London, UK · Remote</span>
    <h1>Platform &amp; Reliability<br><span class="gradient">Engineering Expert</span></h1>
    <p class="subtitle">13+ years across GCP, AWS, Azure · $331K annual cloud savings · 160+ apps managed</p>
  </div>

  <div class="middle">
    <div class="stats">
      <div>
        <div class="stat-value green">$331K</div>
        <div class="stat-label">Annual cloud savings</div>
      </div>
      <div>
        <div class="stat-value blue">13+</div>
        <div class="stat-label">Years experience</div>
      </div>
      <div>
        <div class="stat-value purple">99.9%</div>
        <div class="stat-label">Uptime SLO</div>
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
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    await page.setContent(html);
    await page.waitForLoadState('networkidle');
    const outputPath = path.join(__dirname, '..', 'og-image.png');
    await page.screenshot({ path: outputPath, type: 'png' });
    await browser.close();
    console.log('Generated:', outputPath);
})();
