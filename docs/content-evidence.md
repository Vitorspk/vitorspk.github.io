# Public content evidence inventory — 2026-10-17

Source: pre-redesign index.html and existing standalone case articles. This is a consistency audit, not independent verification of employer records.

| Claim | Treatment |
| --- | --- |
| $331K annual cloud savings | Existing total: storage ~$148K + compute ~$183K. Currency/realization basis requested from owner. Never sum subprojects again or add historical Intelipost savings to this employer total. |
| Storage 95.9%, ~$148K/year | Preserve as reported result; annualization and currency need confirmation. Remove three-year realized-total wording. Deletion is intentional retention, so qualify zero loss as no unintended loss of retained data. |
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
