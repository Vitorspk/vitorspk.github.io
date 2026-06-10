# Portfolio — Improvements Roadmap

This document tracks the improvement plan derived from the full-codebase audit done on **2026-06-10**.

Each phase is delivered as one or more PRs. Items are completed sequentially within a phase; phases are independent and can be reordered.

**Legend:** ⏳ pending · 🚧 in progress · ✅ done

---

## Phase 1 — Quick Wins (visible impact, low risk)

### 1.1 ⏳ Remove inline styles → utility classes
- **Why:** 161 `no-inline-style` warnings from html-validate. ~60 inline `style=""` attributes in `index.html` (skills cards, hero stats, footer copy block, etc.).
- **Where:** [index.html](index.html), [styles.css](styles.css)
- **How:** Create utility classes for the repeated patterns:
  - `.skill-row` — replaces the `style="justify-content:space-between;padding:var(--space-md) 0;border-bottom:1px solid var(--border);"` block (~30 occurrences)
  - `.flex-between-center` — generic justify-between + align-center
  - `.text-strong-primary` — large bold text color
  - `.legend-row` — proficiency legend rows
- **Risk:** Low — purely a refactor; visual output should be identical.
- **Acceptance:** `npm run validate` shows 0 warnings.

### 1.2 ⏳ Add og:image and Twitter card image
- **Why:** Link sharing on LinkedIn, Slack, WhatsApp shows no preview today.
- **Where:** [index.html](index.html) `<head>`, new asset file (PNG/JPG 1200x630).
- **How:**
  - Create `og-image.png` (1200x630) with hero excerpt: name, role, key metric ($331K savings).
  - Add `<meta property="og:image" content="https://vitorspk.github.io/og-image.png">`.
  - Add `<meta name="twitter:image" content="...">`.
- **Risk:** Low — additive.
- **Acceptance:** [opengraph.xyz/url/...](https://www.opengraph.xyz/) shows preview correctly.

### 1.3 ✅ Sitemap.xml in portfolio repo
- **Why:** Google may treat `/portfolio/` as a separate URL from the root.
- **Status:** Already merged via PR #42 — `sitemap.xml` + `robots.txt` live at the root.
- **Follow-up:** Submit sitemap in Google Search Console → Sitemaps.

### 1.4 ⏳ Accessibility labels for proficiency dots
- **Why:** `●●●●●` is purely visual. Screen readers announce "black circle, black circle, black circle, black circle, black circle" — useless.
- **Where:** [index.html](index.html) — all `<span style="color:var(--success)...">●●●●●</span>` patterns in the Skills tab.
- **How:** Wrap each dot sequence with `aria-label` describing the level:
  - `aria-label="Expert: 5 of 5"`
  - `aria-label="Advanced: 4 of 5"`
  - `aria-label="Proficient: 3 of 5"`
  - Optionally hide the visual dots from AT with `aria-hidden="true"` on the span and add a visually-hidden text fallback.
- **Risk:** Low.
- **Acceptance:** axe-core scan still passes; manual screen reader test announces level correctly.

---

## Phase 2 — SEO & Content Maintainability

### 2.1 ⏳ Remove obsolete `meta keywords`
- **Why:** Google has ignored `<meta name="keywords">` since 2009. It's noise.
- **Where:** [index.html:10](index.html#L10)
- **Risk:** Zero.

### 2.2 ⏳ Stabilize volatile numbers
- **Why:** Hero shows `207 AI/ML workloads`, `863 infra assets`, `1,241 tasks`. These will drift and look stale.
- **Where:** [index.html:228-253](index.html#L228) (hero stats), [index.html:381-396](index.html#L381) (task table)
- **How:** Three options to consider:
  1. Remove the most volatile numbers from the hero (keep $331K, 13+, 99.9%).
  2. Add a footnote: "as of Q1 2026".
  3. Round to ranges: "200+ workloads", "850+ infra assets".
- **Risk:** Low — content decision.

### 2.3 ⏳ Add CSP via meta tag
- **Why:** No CSP today. GitHub Pages doesn't allow custom headers, but a `<meta http-equiv="Content-Security-Policy">` works.
- **Where:** [index.html](index.html) `<head>`
- **How:**
  ```html
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'self'; style-src 'self' fonts.googleapis.com 'unsafe-inline'; font-src fonts.gstatic.com; script-src 'self' 'unsafe-inline'; img-src 'self' data:;">
  ```
- **Risk:** Medium — needs careful testing. The blocking theme script in `<head>` needs `'unsafe-inline'`; inline `style="..."` attributes also need it until Phase 1.1 lands. Order matters: do Phase 1.1 first to tighten this later.
- **Acceptance:** All tabs/case studies/diagrams still render; no CSP violations in browser console.

---

## Phase 3 — Tooling & Developer Experience

### 3.1 ⏳ Pre-commit hook (husky + lint-staged)
- **Why:** `npm run validate` can be forgotten. CI catches issues but PR cycle is slower than local feedback.
- **Where:** `package.json` (devDependencies + scripts), new `.husky/pre-commit`
- **How:**
  - `npm i -D husky lint-staged`
  - `npx husky init`
  - `lint-staged` config: run `stylelint --fix` on `*.css`, `eslint --fix` on `*.js`, `html-validate` on `*.html`.
- **Risk:** Low.
- **Acceptance:** `git commit` with a lint error blocks the commit until fixed.

### 3.2 ⏳ `.editorconfig`
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

### 3.3 ⏳ Dependabot config
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

---

## Phase 4 — Polish (long-term, optional)

### 4.1 ⏳ Split `styles.css` into modules
- **Why:** 2241 lines in one file is hard to navigate. Sections logically split by `/* === HEADER === */` comments but it's still one buffer.
- **Where:** [styles.css](styles.css)
- **How:** Split into `tokens.css`, `base.css`, `layout.css`, `components.css`, `responsive.css`. Concatenate in CI via `cat *.css > styles.css` build step. Keeps zero-runtime-deps + zero-bundler intent.
- **Risk:** Medium — touches the entire stylesheet; needs careful diff review.
- **Trade-off:** Adds a CI build step (concat). May not be worth it.

### 4.2 ⏳ Expand test coverage
- **Why:** 81 tests today, but several JS behaviors are untested:
  - Scroll-to-top button visibility (`window.scrollY > 300`)
  - Reading progress bar updates on scroll
  - IntersectionObserver bar animations
  - Keyboard arrow navigation (ArrowLeft/Right/Up/Down/Home/End)
  - `prefers-reduced-motion` reduces animations
  - Case study chevron rotation on expand
- **Where:** `tests/` — new specs or additions to existing.
- **Risk:** Low.

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
