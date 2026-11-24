---
title: "Platform Onboarding: Measure the Path to a First Deployment"
description: "Pilot a self-service path, measure time to a first qualifying deployment, and track completion, controls, and support effort."
date: 2027-08-16
tags: ["DevSecOps", "Cloud Architecture", "Engineering Leadership"]
format: article
---

Start with one group of developers creating one kind of service. Ask them to get from an accepted onboarding request to a healthy deployment in an approved environment. Watch where they wait, what they repeat, and who has to intervene. That sequence gives a platform team something it can improve and measure.

## What to measure

Choose a start event such as acceptance of an eligible request, and a stop event such as the first healthy deployment with mandatory policy checks passed. Record elapsed hours, including approval queues and time waiting for dependencies. Decide in advance whether the target environment is staging or production and hold it fixed across cohorts. This measure covers the whole onboarding path. DORA’s change lead time begins at code commit and ends at production deployment.

Report completion within a fixed observation window and median elapsed time among attempts that completed in that window. Retain blocked and incomplete attempts in the denominator. Record known blockers, support effort, and opt-outs. Distinguish service onboarding from adding a contributor to an existing service, since those take different paths.

## Build and pilot a supported path

1. Pick a team and workload with a repeatable deployment shape. Include teammates new to the tooling. Write the expected prerequisites, access rules, and ownership handoffs before the pilot.
2. Provide a versioned template with repository ownership, CI, runtime configuration, secrets references, and an observable health check. Give the starter a deploy action with actionable errors and a documented recovery path.
3. Use the same approved environment and mandatory controls for the ticket and self-service cohorts. Record queue time, delivery time, policy failures and help requests. Log platform support effort even when the service owner does the deployment.
4. Review completion and support effort together. A faster successful path can mask more abandoned or blocked attempts. Inspect the failures, fix the common blockers, and document cases that need an exception path before broadening the rollout.

## Use the worksheet to compare two cohorts

Enter one item per eligible service. Use elapsed hours for completions and `open` for attempts without a qualifying deployment by the cutoff. Wait until every attempt in the cohort has reached the cutoff or completed before estimating the rate. Review the count and median together. With enough observations add a tail measure and report the sample size. Compare like workloads or report the cohorts separately.

**Illustrative measurement.** The worked data below is synthetic. It deliberately shows faster successful deployments alongside fewer completions. Track follow-on delivery performance separately with measures such as DORA’s change fail rate and failed deployment recovery time. Use the [toil guide](/insights/sre-toil-reduction/) to account for recurring support work that moves between teams.

## References

- [CNCF · Platforms White Paper](https://tag-app-delivery.cncf.io/whitepapers/platforms/)
- [DORA · Software delivery performance metrics](https://dora.dev/guides/dora-metrics/)
