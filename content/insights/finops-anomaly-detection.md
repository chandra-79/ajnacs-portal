---
title: "Cloud Cost Anomaly Detection: Catching Runaway Spend Before It Becomes a Bill"
description: "Cloud cost overruns that show up in the monthly invoice are already weeks old. Here's how to set up anomaly detection that catches cost spikes in hours, with enough context to diagnose the cause quickly."
date: 2026-07-06
tags: ["FinOps", "Cost Optimisation", "Cloud Architecture"]
series: "FinOps from Zero to Production"
seriesOrder: 4
format: article
---

One of the most common FinOps conversations goes: "Our cloud bill came in and it's 40% higher than last month. What happened?" By the time the monthly invoice arrives, the overspend is weeks old, the cause may have already been fixed (or may have been running unnoticed for the entire period), and the cost is already incurred.

The alternative is catching anomalies when they happen — not when the invoice arrives.

## The detection gap: why monthly bills aren't enough

Cloud providers publish cost data with a lag. AWS Cost Explorer typically has 8-24 hours of lag on usage data. Azure Cost Management updates every 8 hours. GCP billing data has similar latency. Monthly invoice delivery is weeks after most of the spend occurred.

For an anomaly that emerges from a misconfigured auto-scaling group or an accidentally-left-running development environment, a month-end discovery means a full month of overspend. A same-day or next-day detection caps the impact to days.

The detection strategy: set up cost monitoring that alerts when daily spend deviates significantly from expected patterns, broken down by service and account/subscription, with enough granularity to diagnose the cause.

## Native cloud anomaly detection

**AWS Cost Anomaly Detection**: a managed service that uses ML to establish a spending baseline per service, linked account, cost category, or cost allocation tag, and alerts when actual spend deviates. You define monitors (what to watch) and subscriptions (where to send alerts).

Setup:
1. Create a monitor (by linked account, by service, by tag like `Team: data-platform`)
2. Create an alert subscription on the monitor (email, SNS, or Slack via SNS)
3. Set a threshold: alert when anomalous spend exceeds $X absolute or Y% above expected

AWS's anomaly detection is free to use, and it works reasonably well for catching unusual patterns. The limitation: it works on granularity down to the service level, but not on individual resource level. "EC2 spend is 30% over baseline in us-east-1" is the alert; finding which specific instances drove it requires drilling into Cost Explorer.

**Azure Cost Management alerts**: two types — budget alerts (you're approaching or have exceeded a budget) and anomaly alerts (intelligent spend monitoring). Configure per subscription, resource group, or department. Azure also provides advisor recommendations for cost optimization that trigger based on usage patterns.

**GCP Cost Anomaly Detection**: available in Billing reports. Configure budget alerts with actual cost anomaly notifications alongside standard budget threshold alerts. GCP's BigQuery export of billing data enables custom anomaly detection with more granularity than the console provides.

## Building more granular alerting

For organizations that need faster and more specific detection than cloud-native tools provide, a custom pipeline is worth building.

The components:
1. **Export billing data to a queryable store**: AWS Cost and Usage Report to S3 + Athena or Redshift; Azure billing to storage + Synapse; GCP billing to BigQuery.
2. **Daily scheduled query**: a job (Lambda, Cloud Function, or scheduled query) that runs daily and computes:
   - Total spend vs 7-day moving average, by service and tag
   - Spend per resource type vs prior week baseline
   - New resources not present in yesterday's inventory (new EC2 instances, new RDS clusters)
3. **Threshold-based alerting**: alert to Slack or PagerDuty when any dimension exceeds a threshold (e.g., any service's daily spend more than 2 standard deviations above the 30-day rolling average)

GCP's billing data in BigQuery is particularly good for this — the schema is well-documented and the data is queryable with standard SQL.

```sql
-- GCP BigQuery: daily spend variance by service
SELECT
  service.description AS service,
  DATE(usage_start_time) AS date,
  SUM(cost) AS daily_cost,
  AVG(SUM(cost)) OVER (
    PARTITION BY service.description
    ORDER BY DATE(usage_start_time)
    ROWS BETWEEN 29 PRECEDING AND 1 PRECEDING
  ) AS rolling_30d_avg,
  SUM(cost) - AVG(SUM(cost)) OVER (
    PARTITION BY service.description
    ORDER BY DATE(usage_start_time)
    ROWS BETWEEN 29 PRECEDING AND 1 PRECEDING
  ) AS variance
FROM `project.billing_dataset.gcp_billing_export`
WHERE DATE(usage_start_time) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY service, date
HAVING variance > 500  -- flag when daily spend is $500+ above 30-day average
ORDER BY variance DESC;
```

## The alert that's actually useful vs the one that creates noise

The failure mode of cost alerting: too many alerts, too many false positives, engineers stop looking at them.

Alert design principles:
- **Alert on deviation, not absolute spend**: "EC2 spend is 40% above baseline" is more actionable than "EC2 spend exceeded $5,000"
- **Include the context in the alert**: which account, which service, which region, which tag. The engineer receiving the alert should be able to open Cost Explorer in one click and see the drill-down
- **Minimum threshold**: below a certain absolute dollar amount, anomalies aren't worth acting on. $50 above baseline is noise; $5,000 is not
- **Assign ownership**: the alert routes to the team that owns the tagged resources. "Your team's spend in Account X anomalous: $3,200 above 7-day average" is more actionable than a catch-all finance alert

## The three anomaly causes to design around

From experience, the most common causes of significant cost anomalies in the order they should be checked:

1. **Auto-scaling misconfiguration**: max instance count was set to an unreasonably high value, a load spike triggered it, instances were created but a bug in scale-down logic prevented termination. Check EC2/instance count vs prior week.

2. **Data transfer/egress charges**: an application change that increased data leaving the cloud (a new feature that returns large payloads, a misconfigured log exporter that sends data to the wrong region). Data transfer costs appear under "Data Transfer" service and can spike dramatically.

3. **Forgotten development resources**: a proof-of-concept cluster, a large development database, or a GPU instance that was started and not terminated. Check for resources without the `Environment: production` tag that have been running longer than expected.

*Setting up cost anomaly detection or responding to an unexpected bill? [Happy to compare approaches.](/contact)*
