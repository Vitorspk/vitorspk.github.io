# Vitor Schiavo — Portfolio

Static portfolio for Site Reliability and Platform Engineering, hosted at https://vitorspk.github.io/.

## Structure

- `index.html`: five accessible tab panels — Home, Work, Experience, About and Contact.
- `script.js`: dual-tablist navigation, legacy fragment resolution, category filters, case disclosures, theme, email copy and tenure. HTML defines tab order.
- `css/`: source modules, concatenated into the committed `styles.css` by `npm run build:css`. Never edit the generated file directly.
- `cases/<slug>/`: standalone articles with metadata, share images, back-links and theme controls.
- `resume.html` and `resume.js`: readable résumé with browser print/save-as-PDF support.
- `tests/`: Playwright navigation, mobile, accessibility, content-safety and case-page checks.

## Develop and validate

Use the already installed development tooling. `npm run build:css` regenerates CSS; `npm run validate` checks HTML/CSS/JS and generated CSS synchronization. `npm test` runs validation and desktop/mobile E2E. `npx serve . -p 3000` serves directory indexes like GitHub Pages.

Keep zero runtime dependencies and the existing framework-free setup. Preserve the skip link, inert/aria synchronization, roving tab focus and reduced-motion behavior.

## Navigation compatibility

`#skills` opens About. `#technical` opens Work; `#finops`, `#aiml` and `#projects` open their matching Work category. `#achievements` opens Home. Work filters are shareable as `#cases/security`, for example. Browser Back/Forward restores category state.

## Content and sharing

Featured work emphasizes CI signal recovery, preview-environment lifecycle and runtime-aware observability. Quantified results state their actual scope; pilot/POC results are distinct from continuous production adoption. The unreconciled aggregate savings amount is no longer a headline. Public articles generalize company internals.

Generate the home share card with `node scripts/generate-og-image.js`. Pass a case slug to generate its `og.png`; title and description are read from that article's HTML to avoid stale claims. Update `sitemap.xml` for new standalone paths, using identical trailing-slash canonical URLs.

## Delivery

Work on a feature branch, validate, push and open a PR. GitHub Pages publishes merged `master` changes. New employer-related article prose requires owner review; never enable auto-merge for it.

## Design system and accessibility

Author shared surface, typography, color, spacing and radius tokens in `css/tokens.css`. Modules build in order: tokens, base, layout, components, responsive. Use tokens instead of duplicating values; `404.html` imports the generated root stylesheet too. Light-theme semantic colors must retain AA contrast, including expanded technical results. The five evidence-led articles share `cases/evidence-case.css`; other article layouts retain their page-specific CSS.

Both navigation lists follow the WAI-ARIA tab pattern: matching button order, roving tabindex, Arrow/Home/End controls and panels labelled by the currently visible tablist. `syncTablists()` makes the off-screen navigation inert and aria-hidden. Inactive panels are also inert and aria-hidden; collapsed case bodies are hidden and inert, so links retain their natural tab order when opened. Preserve the first-focusable skip link, visible keyboard focus, reduced-motion handling and keyboard access to scrollable figures.

The navigation order comes from the sidebar HTML, and `activeTab` tracks current state. One popstate listener restores browser traversal and direct fragment changes; legacy and invalid category URLs canonicalize with replaceState. All scroll listeners are passive, and the reading-progress update uses requestAnimationFrame. CSS transitions name explicit properties. New article or navigation changes need browser coverage, including mobile WebKit and axe checks; the existing three WebKit keyboard-focus exclusions remain tracked in the test suite.

## Validation and maintenance

`npm run lint:fix` fixes eligible CSS/JS lint issues. The pre-commit hook validates staged HTML/JS and rebuilds generated CSS for module changes. CI repeats validation and browser tests; the separate validation report and automated code review add PR feedback. Keep runtime dependencies at zero and Google Fonts on display=swap. Preserve the Search Console verification file and the Cloudflare beacon/CSP domains when editing pages.

Design rationale and implementation sequencing are retained under `docs/superpowers/`; the delivered behavior, measurements and verification limits live in `docs/ux-redesign-validation.md` and `docs/content-evidence.md`.

## Explanatory case visuals

Every catalog case has a header icon and an introductory diagram; standalone articles repeat the matching diagram before the detailed reading. Edit `content/case-visuals.json`, then run `npm run build:visuals`. This pre-renders HTML and inline SVG into the existing pages, so visitors need no rendering library or extra network requests. `npm run validate` checks that all catalog and article diagrams remain synchronized.

The home explorer connects delivery, reliability and cost decisions to specific case studies. Its three modes describe documented work; it does not display simulated live telemetry. Diagrams simplify the architecture and keep pilot, POC and cost-scope qualifications visible.

## Recruiter reading path and downloadable artifacts

The home recommends AI infrastructure, cloud cost engineering and reliability.
Each standalone case includes a contribution/scope summary and a retrospective
decision review. Proposed next improvements are explicitly distinct from results.
Employment history keeps formal job titles; the headline describes target positioning.
Unconfirmed residence, work authorization and relocation claims are not inferred.

`node scripts/generate-resume-pdf.js` regenerates `Vitor-Schiavo-Resume.pdf` from
`resume.html` and the compiled print CSS, using installed Playwright/Chromium.
No network fonts are needed. Regenerate after editing the résumé HTML, CSS or generator; browser tests check the source/PDF fingerprint pair in `content/resume-artifact.json`, the PDF size and its two-page structure. Inspect both pages and selectable text after edits.

`examples/inference-fallback/` is an independent, AI-assisted educational Python
sample with real local HTTP integration tests and no third-party dependencies.
Run `python3 -m unittest discover -s examples/inference-fallback -p 'test_*.py'`.
`npm test` includes the Python tests and `npm run check:sample`. The archive check compares filenames and uncompressed contents, so it does not depend on zlib versions. `npm run build:sample` creates the downloadable ZIP; `npm run resume:pdf` regenerates the résumé.
The sample is not employer source code or a claim of production/model quality.
