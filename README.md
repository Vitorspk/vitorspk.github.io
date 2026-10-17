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
