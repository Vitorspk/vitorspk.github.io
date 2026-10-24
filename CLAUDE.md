# CLAUDE.md — Portfolio

Instructions for AI assistants (Claude Code, @claude in PRs, etc.) working on this repository.

---

## Project overview

Static personal portfolio for **Vitor Schiavo** (SRE / Platform Engineer).
Deployed on **GitHub Pages** at `https://vitorschiavo.dev/` (this repo is the `vitorspk.github.io` user site, served at the domain root).

- No framework, no bundler — `index.html` and `script.js` ship as-is
- CSS is authored as modules in `css/` and concatenated into `styles.css` (committed, served directly by GitHub Pages) via `npm run build:css` — **edit the modules, never `styles.css` directly**
- `404.html` is the custom error page served automatically by GitHub Pages
- `package.json` holds dev tooling only (ESLint, Stylelint, html-validate, Playwright, the CSS build script)

---

## Rules

### Git workflow (mandatory)

- **Never commit directly to `master`**
- Always branch: `git checkout -b <type>/<description>` from `master`
- Types: `feat/`, `fix/`, `chore/`, `docs/`
- Push branch, open PR with `gh pr create`
- PRs run automated linting + Claude Code Review — watch for and fix all feedback before merging

### No breaking changes without a plan

Before any change that affects layout, navigation, or accessibility behaviour, describe the approach and trade-offs first.

### Design system tokens

All colour, spacing, and radius values live in `:root` in `css/tokens.css` (compiled into `styles.css`).
- **Do not hardcode** hex values or pixel values that have a corresponding CSS variable
- `404.html` imports `styles.css` to share these tokens — keep the import, do not inline them
- `--primary` = `#3b82f6`, `--secondary` = `#8b5cf6` — use the variables, not the literals
- CSS modules live in `css/`: `tokens.css` → `base.css` → `layout.css` → `components.css` → `responsive.css` (this is the cascade order). Run `npm run build:css` after editing; `npm run validate` fails if `styles.css` is out of sync.

### Accessibility (non-negotiable)

- Full WAI-ARIA tab pattern must be maintained at all times
- `inert` + `aria-hidden` toggling in `syncTablists()` keeps the dual tablist AT-safe — do not remove
- Skip link must remain the first focusable element in `<body>`
- All decorative elements must have `aria-hidden="true"`
- `prefers-reduced-motion` must be respected in both CSS and JS
- `tabindex="-1"` on panels enables programmatic focus — do not remove
- All new interactive elements need `:focus-visible` styles

### JavaScript patterns

- `tabNames` is derived from the sidebar tablist buttons (`.sidebar-nav [role="tab"]` → `data-tab`) — **HTML is the single source of truth**. Never hardcode tab names in JS. Button order defines keyboard Arrow/Home/End navigation order, so it must match the visual order (WCAG 2.4.3); keep the sidebar and mobile tablists in the same order.
- `activeTab` module-level variable tracks current tab — use it, not `location.hash` (hash is stale on initial load)
- New click handlers must use `data-tab` delegation, not `onclick` attributes
- All scroll listeners must use `{ passive: true }`
- New animations should check `prefersReducedMotion` before running
- Do not introduce `console.log` — ESLint will fail the lint check

### CSS patterns

- Use explicit `transition` property lists (`transition: color, background-color, ...`), never `transition: all`
- Vendor prefixes: add `-webkit-` alongside standard (`-webkit-mask-image`, `-webkit-background-clip`, etc.)
- New sections follow the `.tab-content` + `[role="tabpanel"]` structure
- Mobile breakpoint is `768px`

### Performance

- No external JS dependencies — keep the bundle zero. The **one** allowed exception is the Cloudflare Web Analytics beacon (privacy-first, cookieless); do not add any other third-party script. See § Analytics & SEO.
- No Google Fonts changes without checking render impact (`display=swap` is required)
- Images: use `loading="lazy"` and always include `width`/`height` attributes
- Do not add `transition: all` — it causes the browser to evaluate every animatable property on each frame

### Security

- No `innerHTML` assignments — use `textContent` or DOM methods
- All external links must have `rel="noopener noreferrer"`
- No inline `onclick` handlers — use `addEventListener` or `data-tab` delegation
- No hardcoded secrets or tokens

---

## Analytics & SEO

- **Visitor analytics:** Cloudflare Web Analytics, loaded via the beacon `<script>` before `</body>` in `index.html`. It is privacy-first and cookieless, so no consent banner is required. The site token is set in the `data-cf-beacon` attribute; it is public by design (it ships in client JS), so it is fine to commit. To rotate it or point at a different site, copy the token from Cloudflare dashboard → Web Analytics → (site) → *Manage site*.
- **No Subresource Integrity on the beacon:** `beacon.min.js` is a rolling, auto-updated asset — a pinned `integrity` hash would break on every Cloudflare update. The CSP `script-src https://static.cloudflareinsights.com` is the mitigation. Do not add `integrity` to it.
- **CSP:** the beacon requires `script-src https://static.cloudflareinsights.com` and `connect-src https://cloudflareinsights.com`. Keep both when editing the CSP. The beacon is on `index.html` and each standalone case page (see § Standalone case pages), not `404.html`.
- **Search Console:** verified via the `googlef65df98b38f7f095.html` file at the repo root — do not delete it. After a sitemap change, resubmit `sitemap.xml` in Search Console → Sitemaps.
- **Sitemap:** `#fragment` URLs are ignored by Google for indexing (they all resolve to `/`). Real SEO gains need standalone pages with their own paths, not more fragment entries.

---

## Standalone case pages

Long-form case studies live as their own indexable pages under `cases/<slug>/index.html`, served by GitHub Pages at `https://vitorschiavo.dev/cases/<slug>/` (directory index, trailing slash). They are the SEO and cross-post surface; the SPA cards stay as the short version and link to them with a `.case-readmore` anchor (normal link tab order; hidden/inert panels and disclosure bodies manage focus access).

Recipe for a new one (first page: `cases/self-hosting-gemma-3-vllm/`):
1. **Files:** `cases/<slug>/index.html`. Link `/styles.css` first (tokens, theme, fonts, components), then reuse `/cases/evidence-case.css` for the shared article layout. Use a small `cases/<slug>/page.css` only when the article needs a distinct layout. Reference root assets with absolute paths (`/styles.css`, `/og-image.png`).
2. **No `script.js`.** It is built for the dual tablist and will no-op or throw here. Copy only the blocking theme-init into `<head>`, plus a tiny inline theme-toggle handler before `</body>`.
3. **Beacon:** add the Cloudflare Web Analytics `<script>` and the two CF domains to the page's own CSP (`script-src`/`connect-src`).
4. **SEO:** unique `<title>`, meta description, `<link rel="canonical">`, Open Graph + Twitter, and JSON-LD `TechArticle`. Canonical, `og:url`, the sitemap `<loc>` and the JSON-LD `url` must be the identical trailing-slash URL. Generate a page-specific OG image with `node scripts/generate-og-case.js <slug>` (the shared generator reads the shipped title/description, 1200x630; existing case wrappers remain supported) and point `og:image`, `twitter:image` and the JSON-LD `image` at `cases/<slug>/og.png`.
5. **Sitemap:** add the page URL to `sitemap.xml` (a real path, unlike the ignored `#fragment` entries).
6. **Lint/CI must see it:** `lint:html` globs `cases/**/*.html` and `lint:css` globs `cases/**/*.css` (already set). Add a Playwright spec (loads, single `<h1>`, axe clean, back-link, stored theme). The E2E server runs `serve .` without `-s` so directory indexes resolve like GitHub Pages.
7. **a11y:** skip link first, `:focus-visible`, decorative elements `aria-hidden`, `prefers-reduced-motion` honored. White text needs `--primary-dark` (not `--primary`) behind it to clear WCAG AA contrast.
8. **Confidentiality:** publish the technique, not the employer's internals. No project/registry IDs, repo names, volume IDs or internal service names; generalize fleet/DC specifics; frame the product as regulated online safety.
9. **Publishing is the gated step.** New long-form public writing about the current employer is the irreversible/legal carve-out: open the PR, do **not** enable auto-merge, and let the owner review and merge.

---

## Adding a new tab/section

1. Add a `<section role="tabpanel" id="<name>" ...>` block to `index.html`
2. Add a sidebar nav button: `<button role="tab" id="tab-<name>" data-tab="<name>" ...>`
3. Add a mobile tab button: `<button role="tab" id="mobile-tab-<name>" data-tab="<name>" ...>` — **at the same position as the sidebar button** (both tablists must share the same order)
4. JS picks up the new tab automatically via `document.querySelectorAll('.sidebar-nav [role="tab"]')`
5. No changes to `script.js` are needed

---

## Recommended models (Claude Code)

Model selection is **manual** — pick it when launching (`claude --model <alias>`) or switch mid-session with `/model <alias>`. Claude Code does not auto-switch per task; this table is the project convention:

| Task | Model | Command |
|------|-------|---------|
| Day-to-day coding / refactoring | Sonnet | `claude --model sonnet` — **project default** |
| Local iteration / fast feedback while coding | Haiku | `claude --model haiku` |
| PR review, complex debugging | Opus | `claude --model opus` |
| Architecture design (plan + execute) | opusplan | `claude --model opusplan` — Opus in plan mode, Sonnet on execution |

Three tiers: **local iteration (Haiku)** → **day-to-day (Sonnet)** → **critical decisions (Opus)**.

The day-to-day default (Sonnet) is pinned in `.claude/settings.json` (`"model": "sonnet"`), so it applies automatically when opening Claude Code in this repo — the flags above are only needed to step outside the default. Note: `.claude/` is git-ignored, so this default is local to each contributor's machine.

---

## Local validation

```bash
npm install          # also installs the husky pre-commit hook
npm run build:css    # regenerate styles.css from css/ modules
npm run validate     # CSS build-sync check + lint HTML/CSS/JS
npm run lint:fix     # auto-fix CSS and JS
npm run test:e2e     # Playwright E2E (desktop + mobile)
npm test             # validate + E2E (matches the CI gate)
```

A pre-commit hook (husky + lint-staged) lints staged files and rebuilds `styles.css` when a `css/` module changes. Fix all errors before pushing — the `ci.yml` gate (validate + E2E) blocks the PR if anything fails.

---

## CI workflows

| File | Trigger | Purpose |
|------|---------|---------|
| `ci.yml` | PR (all) | Hard gate: `npm run validate` (CSS sync + lint) + full Playwright E2E. Also auto-approves & squash-merges Dependabot patch/minor PRs once the test job passes (majors left for manual review). |
| `validate-pr.yml` | PR (html/css/js) | Informational: lint, file sizes, security checks, posts a PR comment |
| `claude-code-review.yml` | PR | AI code review, posts feedback as PR comment |
| `claude.yml` | `@claude` mention | On-demand Claude Code in issues/PRs |

When working on a PR:
1. Wait for `claude-code-review` to complete
2. Fix every **bug** and **blocking issue** identified
3. Fix **minor** issues where the fix is clear and low-risk
4. Push fixes and repeat until the review says "ready to merge" or "no issues"

---

## Rollback strategy

GitHub Pages serves from `master`. To roll back:

```bash
git revert HEAD        # creates a revert commit — keeps history clean
git push origin master
```

Or via GitHub UI: revert the merge commit on the master branch.

---

## What to avoid

- Do not add npm runtime dependencies — this project has zero production dependencies by design
- Do not introduce a bundler — the only "build" is `scripts/build-css.js`, a dependency-free concat of the `css/` modules into `styles.css`. Keep it that way; no webpack/vite/postcss pipelines.
- Do not edit `styles.css` by hand — it is generated. Edit the `css/` modules and run `npm run build:css`.
- Do not add `!important` to CSS — stylelint will flag it
- Do not use `var()` for one-off values — define a token if a value is reused 3+ times
- Do not change the `inert`/`aria-hidden` dual-tablist logic without fully understanding `syncTablists()`
- Do not remove the `data:,` favicon from `404.html` — it suppresses a spurious 404 request for favicon.ico
