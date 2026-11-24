---
title: "Cloud Cost Optimisation Is Not a Project — It's an Engineering Practice"
description: "Treat cost control as a recurring engineering practice, measure normalized outcomes, and verify that savings preserve service requirements."
date: 2028-07-28
tags: ["FinOps", "Engineering Leadership"]
format: article
---

Consider a hypothetical cost-reduction project with deliberately invented spend changes. The cloud bill has grown. Leadership notices. A project is initiated: a team of engineers and a FinOps specialist spend three months identifying waste, right-sizing instances, purchasing reserved capacity, and eliminating unused resources. Cloud spend drops 35%.

Six months later, cloud spend has returned to 95% of the pre-initiative level.

This is not a failure of execution. It is a predictable outcome of treating cost optimization as a project rather than a practice.

## Why projects do not hold the gains

Cloud cost optimization produces savings by finding and eliminating inefficiency. Projects find the inefficiency that exists at the time they run. They do not prevent new inefficiency from accumulating after they complete.

New services are provisioned with default (oversized) configurations. Development environments are left running over weekends. Services that were launched experimentally remain running after the experiment ends. Cache layers are sized based on estimates that were never revised after deployment. None of this is malicious — it is the natural behavior of a team building quickly without cost feedback.

A project that runs every 12 months catches this accumulation once a year. A practice embeds the feedback earlier.

## What the practice looks like

**Cost visibility in the build process.** Engineers who can see the projected monthly cost of a Terraform change before applying it make different decisions than engineers who find out three months later. Tools like Infracost integrate cost estimation into CI pipelines.

**Tagged resources with team ownership.** If every resource has a team tag, the monthly cost report can be broken down by team. This creates accountability without requiring a central FinOps team to chase individual engineers.

**Weekly cost review as a standing agenda item.** Not a separate meeting — 10 minutes in an existing sync. Teams that review their cloud costs weekly build intuition for what normal looks like and notice anomalies faster.

**Reserved capacity as a planning activity.** Reserved instances and savings plans should be reviewed when roadmaps are reviewed, not once a year in a separate process. Capacity commitments and product commitments should be aligned.

**Decommissioning as part of completion.** A feature flag retired without the underlying infrastructure being removed is a cost leak. The definition of done for any feature should include infrastructure cleanup.

The organizations that compound cost savings year over year are not running better optimization projects. They are building teams where cost awareness is a normal part of engineering judgment.

## Follow the saving into the next workload cycle

A cleanup project can deliver a useful result, but it should leave a mechanism for detecting recurrence. Record why the resource existed, why it became unnecessary and which event should retire similar resources next time. A one-time deletion count is a poor proxy for maintained efficiency.

Consider a synthetic service whose monthly allocated spend falls from $12,000 to $10,000 after rightsizing. Completed jobs also fall from 600,000 to 400,000. Cost per completed job rises from $0.02 to $0.025, or 25%. The lower bill is real in this example, but it does not establish better unit economics. Conversely, a rising bill can accompany an improving unit cost when demand grows. Report both views with the same boundaries.

## Make retirement part of the feature lifecycle

For a new environment, define its owner, expected lifetime, cleanup condition and dependencies. For a feature removal, inspect background jobs, data retention, queues and infrastructure that may outlive the application route. Keep retained resources when they serve an explicit recovery, audit or business purpose; classify them rather than assuming that low recent activity proves waste.

Use controlled changes to defaults where repeated waste shares a cause. A smaller default instance may help some services and harm others. Offer an exception process based on measured demand and service objectives. Evaluate the policy with a representative workload mix so a change does not merely shift troubleshooting effort to application teams.

## Verify benefits without double counting

Maintain an opportunity record with the baseline, intervention, time window, gross cost change and relevant demand. If a commitment discount and a rightsizing action both affect the same line, reconcile their combined effect rather than claiming each against the full original spend. Distinguish avoided future cost from a reduction in an observed bill.

Include implementation effort and ongoing work in the decision when they are material. A small monthly saving that requires repeated manual intervention may be a poor use of engineering time. A change with little immediate saving can still be justified when it simplifies the estate or removes a large future obligation; state that rationale explicitly.

A practical monthly review follows a few completed actions through a full workload cycle and asks whether their explanation still holds. Seasonal demand, product migrations and new service objectives can invalidate old assumptions. Revisit the decision when those assumptions change instead of treating the original spreadsheet as permanent proof. The practice is a sequence of measured choices, not a requirement to cut the bill every month.

### Figure methodology

Synthetic monthly windows: $12,000/600,000 completed jobs=$0.02; $10,000/400,000=$0.025. Unit cost rises 25% although spend falls. Same allocation basis and currency; workload complexity is assumed comparable and must be checked in real data.

| Worked observation | USD/job |
| --- | ---: |
| Baseline | 0.02 |
| Follow-up | 0.025 |

## Primary references and further study

- [FinOps unit economics](https://www.finops.org/framework/capabilities/unit-economics/)
- [FinOps usage optimization](https://www.finops.org/framework/capabilities/usage-optimization/)
