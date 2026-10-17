# Portfolio UX redesign

User approved applying the audit in full, in priority order, and confirmed Staff / Platform Engineer as the primary audience. Implement directly in this branch; no extra design approval loop.

## Intent
Show Vitor's engineering judgment through selected work, evidence and readable case studies. English public copy; Portuguese collaboration. Do not invent results, testimonials, ownership or a Staff job title. Keep the factual SRE employment titles.

## Constraints
Static HTML/CSS/JS; zero additional dependencies. Five primary tabs: overview (Home), cases (Work), experience, about, contact. Preserve full accessible dual-tablist behavior and existing case-page URLs. Map retired fragments to the appropriate destination. Preserve skip link, theme, reduced motion, privacy analytics and CSP. Edit CSS modules and regenerate styles.css. Existing untracked AGENTS.md belongs to the user; do not stage it. Publish via a PR, no automatic merge.

## Direction
Keep Inter and the existing blue brand tokens. Dark navy and cool light surfaces, strong readable type, quiet borders and less rounded chrome. One visual signature: legible infrastructure flow diagrams with branching paths. No decorative gradient headlines, emoji navigation, autonomous card reveals or skill ratings. Name is part of the hero. Primary CTA explores selected work; secondary contact. Three featured cases, revised after Jira research: Jenkins QA signal recovery, ephemeral preview environments, and Gen2 observability repair. Preserve storage, Terraform and inference as supporting work. First case must begin within a 390x844 mobile viewport. Five mobile tabs fit at 320px. Theme control moves into sidebar/topbar instead of covering reading content.

## Content
P0: remove Jira productivity claims from showcase, stale counts, unexplained uptime achievements, unsupported cumulative projections and inconsistent Airflow cost claims. Owner initially described USD annualized savings, but Jira records GBP for matching line items. Remove the unreconciled $331K aggregate and speculative savings from the showcase. Publish GBP figures only for the exact evidenced line item, annualized explicitly; do not sum potentially overlapping initiatives. The inference fallback router is a completed POC with six tested scenarios, not continuous production adoption. Legacy Gen2 backlog does not negate later production evidence; describe phased delivery. Do not infer exclusive authorship from assignee. Distinguish target SLO and measured latency from an SLA.
P1: home with three proof points, three selected cases, recent experience, working principles and contact; filterable complete case catalog including previously orphaned standalone articles and personal projects. Keep original technical detail behind disclosures, with contribution and decision summaries for featured cases. Three recent roles as concise bullets, older roles progressively disclosed.
P2: about with evidence-linked capability table, education/languages and leadership; contact with email copy feedback plus mailto/LinkedIn/GitHub. HTML résumé with print stylesheet from existing career facts. Add explicit context/decision/contribution/results/limitations to featured articles using only existing evidence. Refresh social sharing artwork and metadata. No stock images or fabricated photograph.

## Acceptance
Five consistent nav destinations; all legacy fragments resolve, including browser history/hash changes. Filters reset or preserve predictably and hidden cases cannot be focused. All current content destinations accessible through catalog. No root/mobile-nav overflow at 320/390/768/1280. Focus, keyboard, reduced motion and dark/light axe checks pass. Shared article styles remain compatible. Résumé readable on mobile and printable. Full npm test passes. PR and local screenshots provided.

## Visual revision following owner feedback

The owner found the first local result too plain relative to the published site and requested a combination of the published visual richness and the revised evidence. The owner then specified icons, explanatory drawings in every case, and a quick, simple visual model.

The revision retains the blue/violet/cyan identity, adds outlined icons, restores scoped highlights, and uses a two-column home with an interactive architecture explorer. Delivery, reliability and cost views link to the actual case and expose no simulated live state. Evidence-led case panels, six specialty links and experience panels provide depth without restoring overlapping top-level tabs or self-rated skill bars. On mobile the explorer is compact, with the first case still beginning in the initial 390×844 viewport.

All 31 catalog cases and 16 standalone articles receive a content-specific three-part explanatory drawing. Their titles, components and scope notes are defined in content/case-visuals.json and pre-rendered as HTML/SVG. Catalog diagrams follow disclosure visibility; article diagrams precede the detailed narrative. Narrow screens stack the stages vertically. Shared CSS and a build-sync validation keep the visual model consistent. No runtime dependency, hosting change or production publication is introduced.
