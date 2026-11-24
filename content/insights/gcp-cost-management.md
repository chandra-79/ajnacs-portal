---
title: "GCP Cost Management: Committed Use Discounts, Recommenders, and What Cloud Billing Doesn't Show You"
description: "Google Cloud's cost optimization tools are extensive but spread across multiple products. Here's how Committed Use Discounts, the Recommender API, and billing export to BigQuery work together for a complete FinOps practice."
date: 2025-11-11
tags: ["FinOps", "Cloud Architecture"]
format: article
---

GCP cost management has a different character than AWS or Azure FinOps. GCP's pricing model (particularly Sustained Use Discounts and Committed Use Discounts) is less visible than AWS Reserved Instances but often results in lower effective compute prices for workloads with consistent usage. The tooling — Recommender API, Active Assist, billing export to BigQuery — is sophisticated once you know where to find it.

## What to measure

**BigQuery bytes and cost per workload.** If a representative query drops from 4 TB to 0.5 TB scanned, the scan reduction is 87.5%. Translate that to billed cost only if the pricing model charges for the billed bytes. Record slot time separately for capacity-based pricing.

*Illustrative measurement. Any numbers in this example are hypothetical.*

## Sustained Use Discounts: the automatic discount nobody talks about

Compute Engine [sustained use discounts](https://docs.cloud.google.com/compute/docs/sustained-use-discounts) are automatic for qualifying usage and eligible billing accounts. The discount applies incrementally beyond the usage threshold and varies by resource. The documented upper bound of 30% for eligible full-month use is a maximum. Values for another machine series or SKU may differ. Compare eligible normalized usage and observed discounts from your bill.

## Committed Use Discounts

Google Cloud offers [resource-based and spend-based commitments](https://docs.cloud.google.com/compute/docs/instances/committed-use-discounts-overview). Resource-based commitments cover eligible resources within an applicable region and configuration. Spend-based commitments cover an eligible hourly spend under specified product rules. Confirm scope, applicable terms, and eligible SKUs rather than modeling all regional VMs as interchangeable.

Usage already covered by a commitment does not also earn a sustained use discount. Assess coverage, utilization, term risk, and the remaining applicable on-demand spend separately. Before purchasing, reconstruct the hourly demand profile from your usage export and test seasonal troughs and architecture changes. A lower current bill can coexist with a longer obligation that becomes a cost under falling demand.

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

Review Recommender output monthly. After each change, compare compute cost per workload at comparable demand and annotate any reliability impact. Savings depend on the waste in the baseline.

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

*Managing GCP costs at scale or building a FinOps practice across GCP projects? [Happy to compare approaches for your specific usage patterns.](/contact/)*

## Build an invoice view and a usage view

First identify which export you have. Google Cloud documents both [standard usage cost data](https://docs.cloud.google.com/billing/docs/how-to/export-data-bigquery-tables/standard-usage) and [detailed usage cost data](https://docs.cloud.google.com/billing/docs/how-to/export-data-bigquery-tables/detailed-usage). Detailed fields can identify individual resources where the product provides them. Missing resource identifiers are a real attribution outcome. Do not turn them into fake resources or allocate them to the current project owner without recording the rule. Check which service and SKU fields are available for the data you actually query.

Build an invoice view grouped by invoice month and currency, including cost types such as taxes and adjustments where they belong in the reconciliation. Build an operational view grouped by usage time with an explicit late-arrival policy. A record used last month can arrive or be invoiced later. Do not explain the difference by telling finance that its invoice period is wrong or telling engineering that the work took place in the month the bill landed. Show the amount in transit and resolve it when the export and invoice cutoff are known.

## Count a repeated credit only once

Billing rows can contain arrays of credits. Unnesting the array and summing the parent cost in the resulting rows can repeat that charge. Sum the credits within each parent row or pre-aggregate them before adding them to the parent cost. Check using the examples in the [standard export schema](https://docs.cloud.google.com/billing/docs/how-to/export-data-bigquery-tables/standard-usage). Keep source cost and credit amount available as distinct columns so the net cost can be explained.

In an illustrative export, a $120 line has credits of −$18 and −$6. Its net is $96. A separate $30 line has no credits and contributes $30. Correct total is $126. An inner unnest would drop the second line and duplicate the $120 parent amount across the first line's two credits. The sum would show $216, despite the individual credit rows being correct. Test for this by creating records with zero, one, and several credits. Reconcile each view before adding labels or organization hierarchy joins.

Treat appended adjustments as amendments rather than duplicates to delete. If a charge of $40 was reversed and replaced with one of $36, the three records together contribute $36. The historical export and revised view both have a place in the audit. Save the cutoff so you can compare a result calculated before the adjustment with one calculated after it.

## Verify discount eligibility by SKU and workload

A recommendation begins a conversation about demand stability and eligibility. It does not establish the rate for a different machine series, region, or product. Use the [Compute Engine commitment documentation](https://docs.cloud.google.com/compute/docs/instances/committed-use-discounts-overview) to confirm resource restrictions and sharing settings. Verify whether a spend-based recommendation refers to a particular eligible service and current pricing model. The [sustained use discount documentation](https://docs.cloud.google.com/compute/docs/sustained-use-discounts) lists eligible usage and describes thresholds and credits. Do not stack a sustained-use benefit on top of a commitment benefit for the same covered compute usage in the forecast.

For a project planning to remove a node pool, simulate both the current eligible floor and the smaller one after retirement. Record utilization under each. The owner of the recommendation should know which capacity is expected to remain, which is bought for resilience, and what would make the new commitment unsafe. Confirm whether the workload has maintenance windows or periodic capacity requirements that were absent from the recommendation's lookback.

## Turn recommendations into verified changes

Record the recommendation ID, project, SKU or workload, cost basis, last observed usage, action owner, and rollback criteria. A resizer should verify limits and performance headroom at representative load before changing production. An existing VM with little CPU activity may still host a scheduled job or retain data that another process needs. Perform discovery and approval across the resource's expected life before assuming idle means redundant.

Backtest one recommendation using an equivalent demand window and a consistent cost basis. For example, suppose a batch job costs $220 over one week and completes 11,000 accepted jobs. Its cost per accepted job is $0.02. After a resize it costs $198 to complete 9,000 accepted jobs, or $0.022 per job. The bill fell $22 but delivery became more expensive by that unit. Check throughput, failed jobs, and deadline misses before taking credit for the cost drop.

Track affected charges through the next invoice close because the first day of apparent savings may not yet include every usage or credit record. Export a short reconciliation sample each week and preserve the grouping and window definitions. When the cloud provider changes its schema, revalidate the field interpretation before trusting the prior query. The [export setup documentation](https://docs.cloud.google.com/billing/docs/how-to/export-data-bigquery) describes adoption and data availability constraints. Give a small group read access to a filtered finance dataset rather than exposing all billing details when teams only need their own scoped totals. Include the project mapping and attribution exceptions in the review artifact.

Give your reconciliation a test covering a project that moves between folders, an export row without a resource name, two currencies, and a delayed negative adjustment. Match each to the reporting policy before increasing the scope. An unresolved line is easier to investigate when its invoice month, usage period, and mapping status survive the aggregation.

## Diagnose missing labels before reallocating costs

Start with one project, service, SKU and usage day. Check whether the detailed export identifies the resource. If the resource has a label now, compare the billing timestamp with when the label was applied. Google Cloud reports label-specific usage from the application date, and services can supply those details at different times. Use Cloud Asset Inventory history or saved snapshots to check past ownership where available. For GKE namespace attribution, confirm that cost allocation was enabled and inspect the documented namespace keys for supported resources. [Detailed export label behavior](https://docs.cloud.google.com/billing/docs/how-to/export-data-bigquery-tables/detailed-usage) · [Cloud Asset Inventory history](https://docs.cloud.google.com/asset-inventory/docs/get-asset-history)

Keep charges grouped by why they remain unattributed, such as missing historical ownership or absent resource metadata. Apply a documented mapping only where the historical match is defensible. Reconcile total cost before and after the mapping.
