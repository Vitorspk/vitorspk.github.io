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

- Inventory: 2,819 currently assigned items and 67 formerly assigned items; metadata scanned, 25 issue descriptions and selected comments read. Counts are research coverage, never productivity proof.
- NCLS-5043: CI platform error occurrences 40 to 0; 65-job validation run. Remaining failing suites existed; never claim all QA green.
- NCLS-4307: preview lifecycle validated on two pilot repositories; 34 automated checks and promotion of the same image digest. Do not imply whole-company adoption.
- NCLS-4791: 22 alert policies and 2 metrics repaired; positive controls distinguish runtime-specific payloads.
- NCLS-3001: 69 to 55 nodes in its recorded snapshot; comment explicitly says GBP 2,208.33/month. Approx. GBP 26,500/year is annualized, not USD 26,500.
- NCLS-3729: GBP 1,165.80/month for the Prometheus ingestion billing line removed, not zero total monitoring operating cost. Annualized GBP 13,989.60; do not add to other totals.
- NCLS-4237: POC completed, six scenarios passed, infrastructure cleaned up pending production decision. No production availability or SLA assertion.
- NCLS-3106: recorded storage lifecycle 30 days Nearline / 365 days Archive differs from earlier website copy. Do not present the 5-day rule as current policy.
- NCLS-4005 is backlog, but NCLS-4703 documents later production Gen2 operation. Retain phased migration description; no blanket incomplete/complete inference.
- NCLS-5011 attributes the code fix to another engineer. Do not claim Vitor authored it.

Public summaries generalize internal system names and omit Jira URLs, internal domains, project IDs, addresses and private repository links. New employer-related case prose is delivered for owner review in a PR, not merged automatically.


## Expanded FinOps reconciliation — 2026-10-17

Research covered both pages of the assignee/history cost search (218 items), a broader cost/optimization summary search (118 items), all 45 children of the FinOps epic, and targeted descriptions, completion comments and storage configuration attachments. These are overlapping research sets, not counts of independent savings initiatives.

| Evidence | Public treatment |
| --- | --- |
| NCLS-4290 / NCLS-4294, final May 2026 validation | One legacy retirement: Atlas USD 2,424.31 to 131.30 in March/April billing, USD 2,293.01/month reduction (94.6%). Closeout adds ~USD 218/month estimated GKE removal: ~USD 2,511/month, ~USD 30,132/year annualized. Initial estimates and child tasks describe the same initiative, never add them again. |
| NCLS-3158 completion | Later sandbox step: 12 to 8 nodes; USD 1,009.74/month recorded, USD 12,116.88/year annualized. Separate baseline from NCLS-3001; keep separate rather than forming a fleet total. |
| NCLS-3001 completion | GBP 2,208.33/month; exact annualized equivalent GBP 26,499.96. |
| NCLS-3729 | GBP 1,165.80/month; GBP 13,989.60/year annualized for removed ingestion line only. |
| NCLS-3159 | EUR 25 reduction recorded. Not a headline without a clearer recurring billing period. |
| NCLS-3829 / NCLS-3820 | Pricing models / discount analyses, not independently validated incremental reductions; excluded from added savings. |
| NCLS-1887 / 1998 / 2001 / 3033 / 3098 / 3106 | Storage work confirmed; January configuration screenshots show 30-day Nearline and 365-day Archive. Attachments inspected; no before/after invoice for historical USD 148K located. |
| NCLS-4502 / 3957 / 3958 | Small resource cleanups, including explicit estimates; not substituted for a large verified overall result. |
| Historic USD 331K headline | Owner confirmed USD and annualized basis, but source reconciliation remains incomplete: original compute breakdown mislabeled a GBP result as USD; Airflow allocation and financial percentages differ. Do not restore or increase a total from mixed bases. |

Home order: AI/LLM first, cost engineering second, observability third. The new umbrella cost case explains the wider program and scoped financial examples. Existing preview environment work remains accessible in the catalog and platform explorer. No raw exports, screenshots, private links or system identifiers are shipped.


## 2026 case expansion from the weekly research

Owner authorized implementation of the nine recommendations on the private research Page. The weekly inventory covered 1,091 resolved records through 17 October 2026; item counts are not productivity metrics and are not published as achievements.

| Public change | Evidence and limits |
| --- | --- |
| Expanded LLM article, same URL | NCLS-4865: two isolated engines, 164 tests. NCLS-4882: dependency/traffic/digest repair. NCLS-5105/5145/5151: later multimodal fallback and four-environment identity validation; 395-request production snapshot. Dedicated workload identity in dev/stg/sdx only; production retained node identity. Application integration code was collaborative; do not claim sole authorship. Earlier NCLS-4237 remains a distinct router POC. |
| New cluster rebuild case | NCLS-4968: 49/49 adopted, zero reissued, 35 apps healthy; ~20s is certificate readiness, not rebuild RTO. NCLS-4972: three rebuilt environments. Its text says 161 certs, table sums 160, so publish neither disputed aggregate. NCLS-4976: peering checked separately. |
| New DNS performance case | NCLS-4778 final comment: ~18.7ms p50 to 2.06ms DNS; API P95 ~0.12s over a 20-minute observation. Do not apply the DNS improvement ratio to all API calls. |
| Expanded Metabase case | NCLS-5193: controlled tab load ~49.7s to ~3.1s; metadata SQL 4,356ms to 8.2ms. Separate Mongo filter bottleneck and unproven original 524 cause remain explicit. Final comments confirm automated backups; no claim that only manual backups remain. |
| New AI fleet observability case | NCLS-4346: HTTP discovery at 30s, five UP targets in rollout snapshot. No paging rules delivered; metric endpoint exception and manual dashboard import remain explicit. |
| New scheduled-job observability case | NCLS-4834: 24/26 active cron entries, 16 rules, 12 panels. Wrapper success/failure/SIGTERM/gateway-unreachable checks. Do not equate provider acknowledgement with delivery to the end user. |
| New queue-driven scaling case | NCLS-5070 final comments supersede original dev/stg-only scope: KEDA active in four envs, parent-side lifecycle fix prevented stuck-child OOMs. Replica maximum is configuration; no sustained throughput claim. Production QA exception and follow-ups remain scoped. |
| Security and secret-governance enrichment | NCLS-4344 scan ~50 to ~15min for earlier project set; later dashboard covers 14 projects. NCLS-4416 80 tests/93.62% and real remaining policy failures. NCLS-5175 final 5,681 probes, 299 hosts, 19 paths, HTTP responses received, ~0.9min vs ~9min. NCLS-4320 three-repository ESO pilot; NCLS-4711 non-destructive update; NCLS-5032 reversible disabling of 133 versions across 97 secrets. No universal keyless/rotation/compliance claim. |
| Observability follow-ups | NCLS-4797 newly covered scopes ~128k docs/day is observed volume, not failures. NCLS-4979 state gauges/resource identity; zero ordering errors in a 3h28m window with positive control. No annual availability inference. |

No raw Jira exports, account identifiers, internal service names, private URLs or customer identifiers are added to public articles. Pending MDI adoption, KPI automation, alert-delivery validation and unfinished credential rotations are not promoted into completed outcomes. Five new article slugs, four expanded articles, 37 catalog drawings and 22 article drawings use the existing generated-visual contract. Home ordering remains AI, costs, observability.
