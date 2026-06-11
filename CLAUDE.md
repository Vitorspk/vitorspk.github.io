# CLAUDE.md — Portfolio

Instructions for AI assistants (Claude Code, @claude in PRs, etc.) working on this repository.

---

## Project overview

Static personal portfolio for **Vitor Schiavo** (SRE / Platform Engineer).
Deployed on **GitHub Pages** at `https://vitorspk.github.io/portfolio/`.

- No framework, no bundler, no build step
- Three files do all the work: `index.html`, `styles.css`, `script.js`
- `404.html` is the custom error page served automatically by GitHub Pages
- `package.json` exists only to hold dev linting tools (ESLint, Stylelint, html-validate)

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

All colour, spacing, and radius values live in `:root` in `styles.css`.
- **Do not hardcode** hex values or pixel values that have a corresponding CSS variable
- `404.html` imports `styles.css` to share these tokens — keep the import, do not inline them
- `--primary` = `#3b82f6`, `--secondary` = `#8b5cf6` — use the variables, not the literals

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

- No external JS dependencies — keep the bundle zero
- No Google Fonts changes without checking render impact (`display=swap` is required)
- Images: use `loading="lazy"` and always include `width`/`height` attributes
- Do not add `transition: all` — it causes the browser to evaluate every animatable property on each frame

### Security

- No `innerHTML` assignments — use `textContent` or DOM methods
- All external links must have `rel="noopener noreferrer"`
- No inline `onclick` handlers — use `addEventListener` or `data-tab` delegation
- No hardcoded secrets or tokens

---

## Adding a new tab/section

1. Add a `<section role="tabpanel" id="<name>" ...>` block to `index.html`
2. Add a sidebar nav button: `<button role="tab" id="tab-<name>" data-tab="<name>" ...>`
3. Add a mobile tab button: `<button role="tab" id="mobile-tab-<name>" data-tab="<name>" ...>` — **at the same position as the sidebar button** (both tablists must share the same order)
4. JS picks up the new tab automatically via `document.querySelectorAll('.sidebar-nav [role="tab"]')`
5. No changes to `script.js` are needed

---

## Local validation

```bash
npm install
npm run validate     # lint HTML + CSS + JS
npm run lint:fix     # auto-fix CSS and JS
```

Fix all linting errors before pushing. The CI workflow will block the PR check if linting fails.

---

## CI workflows

| File | Trigger | Purpose |
|------|---------|---------|
| `validate-pr.yml` | PR | HTML/CSS/JS lint, file sizes, security checks |
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
- Do not introduce a bundler or build step — the static file model is intentional
- Do not add `!important` to CSS — stylelint will flag it
- Do not use `var()` for one-off values — define a token if a value is reused 3+ times
- Do not change the `inert`/`aria-hidden` dual-tablist logic without fully understanding `syncTablists()`
- Do not remove the `data:,` favicon from `404.html` — it suppresses a spurious 404 request for favicon.ico
