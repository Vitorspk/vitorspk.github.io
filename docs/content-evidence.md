# Public content evidence inventory — 2026-10-17

Sources: pre-redesign index.html, existing standalone case articles and the Jira reconciliation below. Financial examples distinguish recorded reductions, infrastructure estimates and unresolved historical claims.

| Claim | Treatment |
| --- | --- |
| $331K annual cloud savings | Existing total: storage ~$148K + compute ~$183K. Owner confirmed USD and annualized basis; the component totals still need reconciliation. Never sum subprojects again or add historical Intelipost savings to this employer total. |
| Storage 95.9%, ~$148K/year | Preserve as reported result; owner confirmed USD and annualization, but the before/after billing basis remains unlocated. Remove three-year realized-total wording. Deletion is intentional retention, so qualify zero loss as no unintended loss of retained data. |
| Airflow 93%, ~$0/month, ~$18K/year | These are inconsistent with 100→14 pods and a retained node. Publish measured allocation reduction of 86%; remove unsupported cost/percentage figures until billing attribution is reconciled. |
| 99.9% uptime SLO | A target, not measured achieved availability. Remove from hero; label explicitly wherever retained. |
| 568ms / 1.9s / 7.7s inference | Existing reported latency measurements, not SLAs. No supplied percentile/sample/prompt methodology. State scope limitation. |
| +267% productivity; 96% proactive; 100% completion | Remove from public showcase; Jira volume/classification cannot establish outcome or productivity. |
| 13 cases | Remove static counts. Catalog includes existing unpublished-in-navigation articles; count actual filter matches at runtime. |
| 61 databases versus 18 MongoDB + 44 PostgreSQL | Counts differ. Use 60+ consistently; do not infer exact total from differing units (clusters/instances/databases). |
| 13+ years / last 7 years | Prefer IT since 2013 and SRE since 2018, avoiding stale counts and mixing administrative experience with infrastructure. |
| Team leadership | Keep existing mentoring, cross-team rollout and runbook activities. Do not invent team sizes, management reports, promotions, recommendations or business results. |
| Location | Existing site says London, UK / Remote. Preserve; do not infer residence or work authorization. |

## Reconciled against Jira research

- Inventory: a large set of assigned records; metadata scanned, selected descriptions and comments read. Counts are research coverage, never productivity proof.
- CI platform error occurrences 40 to 0; 65-job validation run. Remaining failing suites existed; never claim all QA green.
- preview lifecycle validated on two pilot repositories; 34 automated checks and promotion of the same image digest. Do not imply whole-company adoption.
- 22 alert policies and 2 metrics repaired; positive controls distinguish runtime-specific payloads.
- recorded snapshot; the comment gives the currency. Approx. GBP 26,500/year is annualized, not USD 26,500.
- the removed Prometheus ingestion billing line, not zero total monitoring operating cost. Annualized GBP 13,989.60; do not add to other totals.
- POC completed, six scenarios passed, infrastructure cleaned up pending production decision. No production availability or SLA assertion.
- recorded storage lifecycle 30 days Nearline / 365 days Archive differs from earlier website copy. Do not present the 5-day rule as current policy.
- is backlog, but documents later production Gen2 operation. Retain phased migration description; no blanket incomplete/complete inference.
- attributes the code fix to another engineer. Do not claim Vitor authored it.

Public summaries generalize internal system names and omit Jira URLs, internal domains, project IDs, addresses and private repository links. New employer-related case prose is delivered for owner review in a PR, not merged automatically.


## Expanded FinOps reconciliation — 2026-10-17

Research covered both pages of the assignee/history cost search (218 items), a broader cost/optimization summary search (118 items), all 45 children of the FinOps epic, and targeted descriptions, completion comments and storage configuration attachments. These are overlapping research sets, not counts of independent savings initiatives.

| Evidence | Public treatment |
| --- | --- |
| Legacy service retirement, final May 2026 validation | One legacy retirement, recorded reduction of about 94.6% on the service bill plus an estimated cluster removal: ~USD 30,132/year annualized. Initial estimates and child tasks describe the same initiative, never add them again. |
| Sandbox node reduction | Later sandbox step: USD 12,116.88/year annualized. Separate baseline from the other node-reduction result; keep separate rather than forming a fleet total. |
| Production node reduction | Exact annualized equivalent GBP 26,499.96. |
| Monitoring ingestion line | GBP 13,989.60/year annualized for removed ingestion line only. |
| Small one-off reduction | EUR 25 reduction recorded. Not a headline without a clearer recurring billing period. |
| Record | Pricing models / discount analyses, not independently validated incremental reductions; excluded from added savings. |
| Record | Storage work confirmed; January configuration screenshots show 30-day Nearline and 365-day Archive. Attachments inspected; no before/after invoice for historical USD 148K located. |
| Record | Small resource cleanups, including explicit estimates; not substituted for a large verified overall result. |
| Historic USD 331K headline | Owner confirmed USD and annualized basis, but source reconciliation remains incomplete: original compute breakdown mislabeled a GBP result as USD; Airflow allocation and financial percentages differ. Do not restore or increase a total from mixed bases. |

Home order: AI/LLM first, cost engineering second, observability third. The new umbrella cost case explains the wider program and scoped financial examples. Existing preview environment work remains accessible in the catalog and platform explorer. No raw exports, screenshots, private links or system identifiers are shipped.


## 2026 case expansion from the weekly research

Owner authorized implementation of the nine recommendations on the private research Page. The weekly inventory covered 1,091 resolved records through 17 October 2026; item counts are not productivity metrics and are not published as achievements.

| Public change | Evidence and limits |
| --- | --- |
| Expanded LLM article, same URL | two isolated engines, 164 tests. dependency/traffic/digest repair. later multimodal fallback and four-environment identity validation; 395-request production snapshot. Dedicated workload identity in dev/stg/sdx only; production retained node identity. Application integration code was collaborative; do not claim sole authorship. Earlier remains a distinct router POC. |
| New cluster rebuild case | 49/49 adopted, zero reissued, 35 apps healthy; ~20s is certificate readiness, not rebuild RTO. three rebuilt environments. Its text says 161 certs, table sums 160, so publish neither disputed aggregate. peering checked separately. |
| New DNS performance case | final comment: ~18.7ms p50 to 2.06ms DNS; API P95 ~0.12s over a 20-minute observation. Do not apply the DNS improvement ratio to all API calls. |
| Expanded Metabase case | controlled tab load ~49.7s to ~3.1s; metadata SQL 4,356ms to 8.2ms. Separate Mongo filter bottleneck and unproven original 524 cause remain explicit. Final comments confirm automated backups; no claim that only manual backups remain. |
| New AI fleet observability case | HTTP discovery at 30s, five UP targets in rollout snapshot. No paging rules delivered; metric endpoint exception and manual dashboard import remain explicit. |
| New scheduled-job observability case | 24/26 active cron entries, 16 rules, 12 panels. Wrapper success/failure/SIGTERM/gateway-unreachable checks. Do not equate provider acknowledgement with delivery to the end user. |
| New queue-driven scaling case | final comments supersede original dev/stg-only scope: KEDA active in four envs, parent-side lifecycle fix prevented stuck-child OOMs. Replica maximum is configuration; no sustained throughput claim. Production QA exception and follow-ups remain scoped. |
| Security and secret-governance enrichment | scan ~50 to ~15min for earlier project set; later dashboard covers 14 projects. 80 tests/93.62% and real remaining policy failures. final 5,681 probes, 299 hosts, 19 paths, HTTP responses received, ~0.9min vs ~9min. three-repository ESO pilot; non-destructive update; reversible disabling of 133 versions across 97 secrets. No universal keyless/rotation/compliance claim. |
| Observability follow-ups | newly covered scopes ~128k docs/day is observed volume, not failures. state gauges/resource identity; zero ordering errors in a 3h28m window with positive control. No annual availability inference. |

No raw Jira exports, account identifiers, internal service names, private URLs or customer identifiers are added to public articles. Pending MDI adoption, KPI automation, alert-delivery validation and unfinished credential rotations are not promoted into completed outcomes. Five new article slugs, four expanded articles, 37 catalog drawings and 22 article drawings use the existing generated-visual contract. Home ordering remains AI, costs, observability.

## Title correction — 2026-11-02

| Claim | Treatment |
| --- | --- |
| "Senior Platform & Site Reliability Engineer" (title, `<title>`, meta description, hero, résumé page and PDF — introduced by #87) | Not supported by any held title: the role at Dasa, Intelipost and VerifyMy (2018–present) is Site Reliability Engineer. Owner rejected the qualifier. Public title set, at the owner's request, to "Site Reliability & Platform Engineering Specialist" (PT "Especialista em Site Reliability e Platform Engineering", ES "Especialista en Site Reliability y Platform Engineering") — an expertise framing backed by the 2018–present SRE roles, not a level. The held title stays in the JSON-LD `jobTitle`, the sidebar role line and the footer. Never add Senior / Staff / Lead to the title. |
| "Open to Senior and Staff …" (sidebar status, hero availability, contact subtitle and role list, résumé blurb) | Removed at the owner's request the same day: the availability lines now name only the field ("Open to SRE & Platform roles", "Open to opportunities in Platform Engineering and SRE"). No level word appears anywhere on the site; the regression test scans these lines too. |
| `<title>` / `twitter:title` say "SRE & Platform Engineering Specialist" while the hero spells out "Site Reliability …" | Deliberate: the spelled-out PT/ES title is 72 characters, over html-validate's 70-character `long-title` limit, and search results truncate around 60. Hero and meta description stay spelled out. The level-word regression test in `tests/recruiter-readiness.spec.js` covers the title layer (hero role, title, meta/OG/Twitter tags, JSON-LD) and the availability lines on all six locale pages plus the OG inputs of the 66 case pages. |
| Two layers on purpose: hero, `<title>`, meta description, OG images and résumé header say "… Specialist" (positioning), while the JSON-LD `jobTitle`, the sidebar role line and the footer say "Site Reliability Engineer" / "Site Reliability & Platform Engineer" (held title) | Intentional, not drift. The positioning layer is the owner's chosen framing; the held-title layer is what employers can verify. Keep both; do not "align" one to the other. The 23 OG images (root + 22 cases) were regenerated on 2026-11-02 at the owner's request so the role line under the name reads "Site Reliability & Platform Engineering Specialist"; until then they had carried the held title since 2026-10-17 (#86) and never said "Senior". |
| "specializing in cloud platforms, AI inference infrastructure, …" (meta description) | Rephrased as "Selected work in …" — describes the published cases; the only specialization asserted is Site Reliability & Platform Engineering itself. |
