# Portfolio — Improvements Roadmap

This document tracks the improvement plan derived from the full-codebase audit done on **2026-06-10**.

Each phase is delivered as one or more PRs. Items are completed sequentially within a phase; phases are independent and can be reordered.

**Legend:** ⏳ pending · 🚧 in progress · ✅ done

---

## Phase 1 — Quick Wins (visible impact, low risk)

### 1.1 ✅ Remove inline styles → utility classes
- **Why:** 161 `no-inline-style` warnings from html-validate. ~60 inline `style=""` attributes in `index.html` (skills cards, hero stats, footer copy block, etc.).
- **Where:** [index.html](index.html), [styles.css](styles.css)
- **How:** Create utility classes for the repeated patterns:
  - `.skill-row` — replaces the `style="justify-content:space-between;padding:var(--space-md) 0;border-bottom:1px solid var(--border);"` block (~30 occurrences)
  - `.flex-between-center` — generic justify-between + align-center
  - `.text-strong-primary` — large bold text color
  - `.legend-row` — proficiency legend rows
- **Risk:** Low — purely a refactor; visual output should be identical.
- **Acceptance:** `npm run validate` shows 0 warnings.
- **Result:** 161 warnings → 3 warnings (the remaining 3 are unrelated `heading-level` issues, pre-existing). Bar-fill widths migrated from inline `style="width:96%"` to `data-width="96%"` (JS already reads `dataset.width`).

### 1.2 ✅ Add og:image and Twitter card image
- **Why:** Link sharing on LinkedIn, Slack, WhatsApp shows no preview today.
- **Where:** [index.html](index.html) `<head>`, new asset file (PNG/JPG 1200x630).
- **How:**
  - Create `og-image.png` (1200x630) with hero excerpt: name, role, key metric ($331K savings).
  - Add `<meta property="og:image" content="https://vitorspk.github.io/og-image.png">`.
  - Add `<meta name="twitter:image" content="...">`.
- **Risk:** Low — additive.
- **Acceptance:** [opengraph.xyz/url/...](https://www.opengraph.xyz/) shows preview correctly.
- **Result:** PNG 1200x630 (329 KB) at repo root, generated via `npm run og:generate` (Playwright-rendered HTML → screenshot). Meta tags added for `og:image`, `og:image:width/height/alt`, `twitter:image`, `twitter:image:alt`.

### 1.3 ✅ Sitemap.xml in portfolio repo
- **Why:** Google may treat `/portfolio/` as a separate URL from the root.
- **Status:** Already merged via PR #42 — `sitemap.xml` + `robots.txt` live at the root.
- **Follow-up:** Submit sitemap in Google Search Console → Sitemaps.

### 1.4 ✅ Accessibility labels for proficiency dots
- **Why:** `●●●●●` is purely visual. Screen readers announce "black circle, black circle, black circle, black circle, black circle" — useless.
- **Where:** [index.html](index.html) — all `<span style="color:var(--success)...">●●●●●</span>` patterns in the Skills tab.
- **How:** Wrap each dot sequence with `aria-label` describing the level:
  - `aria-label="Expert: 5 of 5"`
  - `aria-label="Advanced: 4 of 5"`
  - `aria-label="Proficient: 3 of 5"`
  - Optionally hide the visual dots from AT with `aria-hidden="true"` on the span and add a visually-hidden text fallback.
- **Risk:** Low.
- **Acceptance:** axe-core scan still passes; manual screen reader test announces level correctly.
- **Result:** Skill row dots use `<span role="img" aria-label="Expert: 5 of 5">` (and equivalents for Advanced/Proficient) — screen readers announce the level instead of "black circle, black circle...". Legend dots use `aria-hidden="true"` since the adjacent `legend-label` already describes the level.

---

## Phase 2 — SEO & Content Maintainability

### 2.1 ✅ Remove obsolete `meta keywords`
- **Why:** Google has ignored `<meta name="keywords">` since 2009. It's noise.
- **Where:** [index.html:10](index.html#L10)
- **Risk:** Zero.

### 2.2 ✅ Stabilize volatile numbers
- **Why:** Hero shows `207 AI/ML workloads`, `863 infra assets`, `1,241 tasks`. These will drift and look stale.
- **Where:** [index.html:228-253](index.html#L228) (hero stats), [index.html:381-396](index.html#L381) (task table)
- **How:** Three options to consider:
  1. Remove the most volatile numbers from the hero (keep $331K, 13+, 99.9%).
  2. Add a footnote: "as of Q1 2026".
  3. Round to ranges: "200+ workloads", "850+ infra assets".
- **Risk:** Low — content decision.
- **Result:** Applied Option 3: hero `207 AI/ML workloads` → `200+`, `863 infra assets` → `850+`. Overview highlight card updated for consistency. Task Distribution Analysis got a snapshot description: "Snapshot of Jira activity across 2021–2025". Historical references in case studies/achievements (e.g., "863 assets for ISO 27001 audit") retained as accurate point-in-time facts.

### 2.3 ✅ Add CSP via meta tag
- **Why:** No CSP today. GitHub Pages doesn't allow custom headers, but a `<meta http-equiv="Content-Security-Policy">` works.
- **Where:** [index.html](index.html) `<head>`
- **How:**
  ```html
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'self'; style-src 'self' fonts.googleapis.com 'unsafe-inline'; font-src fonts.gstatic.com; script-src 'self' 'unsafe-inline'; img-src 'self' data:;">
  ```
- **Risk:** Medium — needs careful testing. The blocking theme script in `<head>` needs `'unsafe-inline'`; inline `style="..."` attributes also need it until Phase 1.1 lands. Order matters: do Phase 1.1 first to tighten this later.
- **Acceptance:** All tabs/case studies/diagrams still render; no CSP violations in browser console.
- **Result:** Applied to both `index.html` and `404.html`. Policy:
  - `default-src 'self'`
  - `script-src 'self' 'unsafe-inline'` (theme blocking script + ld+json)
  - `style-src 'self' https://fonts.googleapis.com` on index.html (no inline styles after Phase 1.1); `'unsafe-inline'` retained on 404.html which has an inline `<style>` block
  - `object-src 'none'` (no plugins). `upgrade-insecure-requests` was considered but omitted: WebKit (mobile Safari) upgrades the test server URL `http://localhost:3000` to HTTPS and the page fails to load, breaking the Playwright test suite. Security gain is marginal since GitHub Pages serves HTTPS and there are no HTTP subresources to upgrade.
  - `font-src 'self' https://fonts.gstatic.com`
  - `img-src 'self' data:` (data URI favicon)
  - `connect-src 'self'`, `base-uri 'self'`, `form-action 'self'` (note: `frame-ancestors` is ignored when set via `<meta>` — only works as HTTP header, which GitHub Pages doesn't allow)

---

## Phase 3 — Tooling & Developer Experience

### 3.1 ✅ Pre-commit hook (husky + lint-staged)
- **Why:** `npm run validate` can be forgotten. CI catches issues but PR cycle is slower than local feedback.
- **Where:** `package.json` (devDependencies + scripts), new `.husky/pre-commit`
- **How:**
  - `npm i -D husky lint-staged`
  - `npx husky init`
  - `lint-staged` config: run `stylelint --fix` on `*.css`, `eslint --fix` on `*.js`, `html-validate` on `*.html`.
- **Risk:** Low.
- **Acceptance:** `git commit` with a lint error blocks the commit until fixed.
- **Result:** Installed `husky@9` + `lint-staged@17`. `prepare` script auto-installs the hook on `npm install`. `.husky/pre-commit` runs `npx lint-staged` which, per the config in `package.json`, runs `html-validate` on staged `.html`, `stylelint --fix` on staged `.css`, and `eslint --fix` on staged `.js`. Auto-fixed files are re-staged automatically.

### 3.2 ✅ `.editorconfig`
- **Why:** Indentation drifts between editors (4-space CSS/JS vs 2-space test files).
- **Where:** new `.editorconfig` at repo root.
- **How:** Standard config matching existing rules:
  ```
  root = true
  [*]
  indent_style = space
  end_of_line = lf
  charset = utf-8
  trim_trailing_whitespace = true
  insert_final_newline = true
  [*.{html,css,js}]
  indent_size = 4
  [tests/**/*.js]
  indent_size = 2
  [*.{yml,yaml,json}]
  indent_size = 2
  ```
- **Risk:** Zero.
- **Result:** Added at repo root. 4-space for site source (`*.html/css/js`), 2-space for tests/Playwright config and YAML/JSON. Markdown keeps trailing whitespace (meaningful line breaks).

### 3.3 ✅ Dependabot config
- **Why:** Currently no automated dep updates. `@playwright/test`, `axe-core`, ESLint, etc. drift behind security patches.
- **Where:** new `.github/dependabot.yml`
- **How:**
  ```yaml
  version: 2
  updates:
    - package-ecosystem: "npm"
      directory: "/"
      schedule: { interval: "weekly" }
      open-pull-requests-limit: 3
    - package-ecosystem: "github-actions"
      directory: "/"
      schedule: { interval: "weekly" }
  ```
- **Risk:** Low — only opens PRs, doesn't auto-merge.
- **Result:** `.github/dependabot.yml` added. npm dev-dependency minor/patch updates are grouped into a single weekly PR to reduce noise; GitHub Actions updates checked weekly with a limit of 2 open PRs.

---

## Phase 4 — Polish (long-term, optional)

### 4.1 ⏳ Split `styles.css` into modules
- **Why:** 2241 lines in one file is hard to navigate. Sections logically split by `/* === HEADER === */` comments but it's still one buffer.
- **Where:** [styles.css](styles.css)
- **How:** Split into `tokens.css`, `base.css`, `layout.css`, `components.css`, `responsive.css`. Concatenate in CI via `cat *.css > styles.css` build step. Keeps zero-runtime-deps + zero-bundler intent.
- **Risk:** Medium — touches the entire stylesheet; needs careful diff review.
- **Trade-off:** Adds a CI build step (concat). May not be worth it.

### 4.2 ✅ Expand test coverage
- **Why:** 81 tests today, but several JS behaviors are untested:
  - Scroll-to-top button visibility (`window.scrollY > 300`)
  - Reading progress bar updates on scroll
  - IntersectionObserver bar animations
  - Keyboard arrow navigation (ArrowLeft/Right/Up/Down/Home/End)
  - `prefers-reduced-motion` reduces animations
  - Case study chevron rotation on expand
- **Where:** `tests/` — new specs or additions to existing.
- **Risk:** Low.
- **Result:** New `tests/interactions.spec.js` with 13 tests (×2 projects = 26 runs) covering all six behaviors. Suite grew 81 → 107 passing. Reduced-motion tests use `page.emulateMedia({ reducedMotion: 'reduce' })` before load because `test.use({ reducedMotion })` did not propagate to `matchMedia` reliably.
- **Bonus bugfix (found by review):** keyboard Arrow/Home/End navigation followed panel DOM order (Overview → Cases → …) instead of the visual sidebar order (Overview → Experience → Skills → …), violating WCAG 2.4.3 Focus Order — a leftover from the tab reorder (PR #14), which moved buttons but not panels. `script.js` now derives `tabNames` from the sidebar tablist buttons, so keyboard order always matches what users see. CLAUDE.md/README updated to document the new contract (both tablists must share the same order).

### 4.3 ⏳ Audit & refresh content
- **Why:** Several dates and metrics will age:
  - Case study dates ("March 2026", "January 2025") — fine as historical reference, no action needed.
  - Hero "AI/ML workloads: 207" — see 2.2.
  - Career trajectory year ranges — keep current.
- **Where:** [index.html](index.html)
- **Risk:** Low.

---

## How to work this doc

1. Pick the next ⏳ item in the lowest-numbered phase.
2. Open a branch: `git checkout -b <type>/<item-slug>` (e.g. `chore/inline-styles-cleanup`).
3. Implement.
4. Update this doc: change ⏳ to 🚧, then to ✅ after merge.
5. Open PR, wait for Claude Code Review, merge.

**Order matters in some cases**:
- Phase 1.1 should precede Phase 2.3 (CSP requires `'unsafe-inline'` for `style=""` attributes that 1.1 removes).
- Phase 3.1 should precede Phase 4.x to lock quality gates first.

---

_Last updated: 2026-06-10_
