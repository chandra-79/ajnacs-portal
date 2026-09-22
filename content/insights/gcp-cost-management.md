---
title: "GCP Cost Management: Committed Use Discounts, Recommenders, and What Cloud Billing Doesn't Show You"
description: "Google Cloud's cost optimization tools are extensive but spread across multiple products. Here's how Committed Use Discounts, the Recommender API, and billing export to BigQuery work together for a complete FinOps practice."
date: 2025-06-30
tags: ["FinOps", "Cloud Architecture"]
format: article
---

GCP cost management has a different character than AWS or Azure FinOps. GCP's pricing model (particularly Sustained Use Discounts and Committed Use Discounts) is less visible than AWS Reserved Instances but often results in lower effective compute prices for workloads with consistent usage. The tooling — Recommender API, Active Assist, billing export to BigQuery — is sophisticated once you know where to find it.

## Sustained Use Discounts: the automatic discount nobody talks about

GCP Compute Engine applies Sustained Use Discounts (SUDs) automatically for VMs that run for a significant portion of the month — no commitment required. A VM running for the full month receives a 30% discount on the base price. No RI purchase, no upfront commitment.

This is a meaningful advantage for workloads with variable lifecycles. A VM that runs for 70% of a month gets a partial SUD; a VM that runs 100% gets the full 30%. The discount applies to vCPU and memory costs separately, which means a resized VM still accumulates usage toward the discount threshold.

The implication: GCP on-demand pricing for compute is effectively lower than the list price for any workload running more than ~25% of the month. When comparing GCP to AWS or Azure pricing, use the SUD-adjusted price, not the list price.

## Committed Use Discounts

On top of SUDs, GCP offers Committed Use Discounts (CUDs) for 1 or 3-year commitments:

- **Resource-based CUDs**: commit to a specific amount of vCPU and memory in a region. 37% discount for 1 year, 55% for 3 years. Applied to any VM in the committed region that matches the resource type, regardless of machine type.

- **Spend-based CUDs**: commit to a specific hourly spend on compute. Available for Cloud SQL, Cloud Run, and other services. 17-25% discount depending on service and term.

Resource-based CUDs are more flexible than AWS Reserved Instances — they apply to any VM in the region at or below the committed resource level, across different machine types. A commitment of 100 vCPU applies whether you run 100 n2-standard-1 instances or 10 n2-standard-10 instances.

The analysis before committing: use the Cost Table export in BigQuery to understand your compute usage over the past 3-6 months. Identify the consistent baseline — the vCPU and memory that run every day regardless of demand spikes. Commit to the baseline; let the remainder run on SUD-adjusted on-demand pricing.

## BigQuery billing export

GCP's most powerful cost management tool is often the least used: billing export to BigQuery. Every line item in your GCP bill, with full resource-level detail, lands in a BigQuery table that you can query with standard SQL.

```sql
-- Top 10 most expensive services last 30 days
SELECT
  service.description AS service,
  SUM(cost) AS total_cost,
  SUM(usage.amount) AS usage_amount,
  usage.unit AS unit
FROM `my_project.billing_export.gcp_billing_export_v1_*`
WHERE DATE(_PARTITIONTIME) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY service, unit
ORDER BY total_cost DESC
LIMIT 10;
```

The billing export enables:
- Attribution of costs to specific resources, projects, and labels
- Identification of projects with anomalous cost growth
- Building custom dashboards beyond what the Cloud Console provides
- Alerting on specific cost thresholds per service or project

This is substantially more powerful than the default Cloud Console billing view. Setting it up (a few hours) pays back in the first month of cost analysis.

## The Recommender API

GCP's Recommender API surfaces actionable optimization recommendations across your infrastructure:

- **VM right-sizing recommendations**: VMs where historical CPU and memory usage suggests a smaller machine type would be adequate
- **Idle VM recommendations**: VMs with minimal CPU and network activity that may be unused
- **Committed Use Discount recommendations**: analysis of whether additional CUD commitments are financially justified given current usage
- **Persistent disk snapshot recommendations**: snapshots older than defined thresholds that may be candidates for deletion
- **Unused IP address recommendations**: reserved static IPs that are not attached to any resource

```bash
## List all cost recommendations for a project
gcloud recommender recommendations list \
  --project=my-project \
  --location=us-central1 \
  --recommender=google.compute.instance.MachineTypeRecommender \
  --format="table(name,description,primaryImpact.costProjection.cost)"
```

Reviewing Recommender output monthly and actioning high-confidence recommendations typically produces 10-20% compute cost reduction without architectural changes.

## Labels as FinOps infrastructure

GCP labels (key-value metadata on resources) are how team-level cost attribution works. Without labels, every project's cost is visible at the project level, but not at the team or application level within a project.

Standard label strategy:

```
environment: production | staging | development
team: backend | data | platform | ml
application: order-service | recommendation-engine
cost-centre: engineering | data-science
```

Enforce label policies via Organization Policies: require specific labels on resources, deny creation of resources without required labels. Without enforcement, labels drift over time and attribution becomes incomplete.

GCP billing export + labels = team-level cost showback without requiring separate projects per team.

*Managing GCP costs at scale or building a FinOps practice across GCP projects? [Happy to compare approaches for your specific usage patterns.](/contact)*
