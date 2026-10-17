# UX redesign validation — 2026-10-17

## Scope delivered

- Staff / Platform Engineer positioning, without changing factual employment titles.
- Five accessible destinations: Home, Work, Experience, About, Contact.
- Featured work: QA pipeline signal recovery, preview-environment lifecycle, Gen2 alert repair.
- Five new standalone cases; existing case URLs retained and previously disconnected articles included in the catalog.
- Category filtering and shareable filter URLs; old fragment aliases preserved.
- Evidence-linked capabilities instead of self-rated skill scores; recent experience shortened and older roles disclosed progressively.
- Contact actions with clipboard feedback/fallback, printable résumé and consistent sharing artwork.
- Reconciled descriptions distinguish pilots/POCs from production and targets from measured results. No unreconciled aggregate savings headline or cumulative projection. A GBP billing-line example states annualization and scope.
- No runtime dependencies added. CSS modules remain the source of truth.

## Automated evidence

Baseline: `npm test` — 227 passed, 3 skipped.
Redesign regression tests were run against the original site and failed on missing navigation/filter/contact/evidence behavior.
Affected suite after implementation: 101 passed, 1 skipped.
Full suite after independent review: 299 passed, 3 skipped; HTML/CSS/JS validation and CSS synchronization passed.
The three skips are the existing WebKit keyboard-focus exclusions.
`git diff --check` passed.

## Visual and interaction checks

- Desktop 1440×1000; mobile 390×844, narrow mobile 320×740; tablet 768×1024.
- Light/dark states, contact, catalog and article layout inspected.
- No root horizontal overflow at the inspected sizes. All five mobile navigation choices fit at 320/390/768.
- First case begins around 673px on 390×844 mobile, visible in the initial viewport.
- Eighteen unique local page destinations from the index returned HTTP 200.
- Print output inspected; résumé occupies two A4 pages.
- Keyboard arrows/Home/End, skip link, browser history, direct hash changes, reduced motion, and clipboard failure covered by regression tests.
- Automated axe checks cover all five destinations in both themes and every standalone case in the standard suite. These checks do not constitute a complete assistive-technology audit or real-user performance measurement.

## Delivery limits

No merge, no auto-merge, no production publication. New employer-related prose is generalized and awaits owner review in the PR. Raw Jira exports, attachments, internal URLs and private code were not added to the repository. The pre-existing untracked AGENTS.md was left untouched and unstaged.

## Independent review and fixes

A read-only reviewer checked the implementation against the approved design and evidence inventory. Two findings were addressed: the desktop theme control now lives inside the sidebar (and moves to the mobile topbar), and a retained unmeasured availability achievement was replaced by the documented redundancy capability. Regression coverage reproduced and verified theme-control placement.

An expanded-catalog axe check additionally exposed light-theme contrast and Safari keyboard-scroll access in retained SVG figures. Semantic colors were corrected and scrollable figures made keyboard-focusable. The regression passed on desktop and WebKit mobile. Supplemental settled-state light-theme axe checks passed for the fully expanded catalog, all five new articles, the revised storage and inference articles, and the résumé.

## PR review follow-up

The automated PR review found no blocking issues. Its navigation findings were reproduced: traversing history restored the same route twice because both popstate and hashchange were handled. Navigation now uses popstate alone, with regression coverage for a single restoration, forward navigation, category state and invalid-category canonicalization without extra Back steps. The new test failed with two restorations before the fix and passed afterward in Chromium and mobile WebKit.

Case links now keep natural tab order in source HTML, with hidden/inert containers controlling accessibility; the obsolete per-toggle tabindex mutation and CLAUDE.md guidance were updated. Filter state is declared before navigation. The five identical article stylesheets were consolidated into cases/evidence-case.css. Share-image wrappers already call the single shared generator. The README again documents design tokens, accessibility and maintenance; design/plan documents are retained as the decision record.

Final validation after PR review fixes: `npm run validate` passed and the complete Playwright suite finished with 301 passed, 3 existing skips (59.8 seconds). The previous head also passed GitHub CI and automated review.

The final local browser run uses the same Playwright projects against port 4173 through a temporary configuration override, because port 3000 is occupied by another workspace project. Repository CI continues to use its isolated default server.

A second automated review confirmed the history fix. Two additional low-risk findings were reproduced and fixed: native keyboard activation of nested case-header links, and blocked localStorage during initial theme loading on the five new articles. Both regression paths failed before the changes and passed in desktop Chromium and mobile WebKit afterward. Third-party analytics is stubbed in the storage regression to isolate the site's behavior from network/CORS failures. Case prose and résumé block markup are now split across readable lines; these pages are hand-authored HTML rather than generated output. The résumé is intentionally indexable and now has a sitemap entry. Existing inline-script CSP policy is retained; a site-wide CSP migration is outside this redesign.

Final verification after the second review: HTML/CSS/JS validation and CSS sync passed; full browser suite: 305 passed, 3 existing skips (1.3 minutes).
