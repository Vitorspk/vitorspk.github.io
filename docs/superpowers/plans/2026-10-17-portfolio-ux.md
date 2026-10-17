# Portfolio UX Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan inline, task by task.

**Goal:** Apply the approved UX audit in priority order to a reviewable portfolio redesign.
**Architecture:** Preserve static pages and the accessible tab system, reduce primary navigation to five destinations, and connect detailed proof through existing standalone cases. Keep CSS source modules and build process.
**Tech Stack:** HTML, CSS, vanilla JS; existing Playwright and axe tooling.
**Spec:** docs/superpowers/specs/2026-10-17-portfolio-ux-design.md

## Global Constraints
- Zero additional dependencies; no framework or bundler.
- Five tabs: overview, cases, experience, about, contact.
- Preserve dual tablists, skip link, theme and reduced motion.
- Do not stage untracked AGENTS.md; do not merge or publish.

## Review Focus
- Legacy hashes and Back/Forward must resolve without blank panels.
- Filtering must not expose focusable hidden links.
- Shared CSS must preserve standalone article accessibility in both themes.
- Header controls must not overlap mobile navigation or content.
- Financial projections must never appear as realized savings.

### Task 1: Evidence and positioning (P0)
**Files:** index.html, cases/gcp-storage-cost-reduction/index.html, cases/self-hosting-gemma-3-vllm/index.html, docs/content-evidence.md, tests/portfolio-redesign.spec.js
**Interfaces:** produces conservative public wording and evidence inventory consumed by the new home and résumé.
- [x] Add regression assertions for removed unsupported projections, explicit contribution and evidence notes.
- [x] Run targeted tests; expected FAIL on missing evidence context.
- [x] Audit claims, add evidence inventory, reconcile GBP line items, remove unreconciled aggregate, qualify annualized amounts and measured latencies, clarify storage deletion/no-unintended-loss distinction.
- [x] Run targeted tests; expected PASS on evidence assertions.

### Task 2: Home, navigation and mobile (P1)
**Files:** index.html, script.js, css/*.css, styles.css, tests/tab-navigation.spec.js, tests/accessibility.spec.js, tests/interactions.spec.js, tests/responsive.spec.js, tests/portfolio-redesign.spec.js
**Interfaces:** consumes Task 1 wording; produces five panels, featured-work anchor, legacy-hash aliases and case filters.
- [x] Add behavioral tests for five destinations, legacy history, category filters and mobile content visibility. Run before code; expected FAIL.
- [x] Implement home, filtered catalog and concise experience; preserve accessible tabs and existing article URLs.
- [x] Adjust old tests to intentional new navigation contract and replace removed animation tests with useful navigation/filter behavior checks.
- [x] Run validation and affected E2E tests; expected PASS.

### Task 3: Identity, proof and contact (P2)
**Files:** index.html, css/*.css, resume.html, resume.js, scripts/generate-og-image.js, og-image.png, featured cases, README.md, tests/portfolio-redesign.spec.js
**Interfaces:** consumes Task 2 structure; produces evidence-linked about, email copy feedback, printable résumé and consistent sharing assets.
- [x] Add contact/résumé and article-context tests; run before implementation; expected FAIL.
- [x] Implement contact and résumé, create three evidence-backed featured articles (Jenkins, preview environments, observability), refine supporting case context, update social metadata and remove decorative emoji/icon inconsistency.
- [x] Generate sharing image, build CSS, lint all changed HTML including résumé; expected PASS.
- [x] Check screenshots at 320/390/768/1280, dark/light, and print. Run npm test; expected PASS.

### Task 4: Review and deliver
**Files:** docs/ux-redesign-validation.md, PR description.
**Interfaces:** consumes all completed changes; produces validated branch and PR.
- [x] Review requirements and full diff, repair material findings, verify links and compare changed content to source.
- [x] Commit only task files, push feature branch, open PR and attach it to chat.
- [x] Inspect CI and automated review, resolve actionable feedback and record any external limitation.
