---
title: "Platform Onboarding: Measure the Path to a First Deployment"
description: "Pilot a self-service path, measure time to a first qualifying deployment, and track completion, controls, and support effort."
date: 2026-11-20
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

## Define what the pilot considers complete

Write one completion rule the teams can apply without interpretation. For an illustrative staging pilot, the declared team owns the repository, a pinned build artifact has passed the mandatory checks, a runtime revision serves an expected health response, and the service record has an owner and working runbook link. Capture the start and completion timestamps from the systems that accepted the request and deployed the artifact. Validate clock and time zone handling before comparing durations. Keep unsuccessful requests in the cohort, including cases where instrumentation recorded a submission but the application failed to deploy.

| Journey stage | Evidence to collect |
| --- | --- |
| Request accepted | Eligible request and start time |
| Artifact built | Immutable artifact identifier and pipeline result |
| Policy evaluated | Required checks and recorded decisions |
| Deployment verified | Target, deployed revision and synthetic response |
| Service handed off | Owner, support contact and recovery instructions |

## Read the timing and completion results together

In a fictional follow-up, six of eight ticket requests complete within the window, with a median of 18 hours among completions. Five of eight self-service requests complete, with a median of 10 hours among completions. Completion falls from 75% to 62.5% despite the faster completed path. If two incomplete self-service requests waited on unresolved permissions and one never provided an owning team, prioritize testing an early permission check and an actionable request-validation message. Keep the same required controls. Review the next cohort on the same follow-up interval and publish explicit counts alongside median durations.

Log platform effort in minutes per eligible request. If the ticket path consumed 240 support minutes and the pilot 160, the observed averages were 30 and 20 minutes per request. Report this comparison alongside the completed and incomplete counts. Record maintenance time separately so an initially manual pilot can distinguish support from investments in the next version. [CNCF Platforms White Paper](https://tag-app-delivery.cncf.io/whitepapers/platforms/)

## Exercise failure before opening the path to more teams

In a safe environment, test a missing declaration, a permission rejection, an unavailable dependency and a retry after the runner stops. This exposes whether developers receive next steps and whether the platform repeats work it already completed. Record events under a stable request ID so that retry attempts do not inflate adoption. Verify which stage an observer can reach from the ID, how application owners can see and report a failure, and who restores the path when the platform is the failing dependency.

Close the pilot by deciding which workloads are eligible for the next version. Product teams at a different readiness level may need separate coverage. Compare delivery performance at service level once teams have a production deployment history. Keep these measures separate from initial time to a qualifying deployment so repeat delivery and learning the initial workflow are both visible. [DORA delivery performance measures](https://dora.dev/guides/dora-metrics/)

## References

- [CNCF · Platforms White Paper](https://tag-app-delivery.cncf.io/whitepapers/platforms/)
- [DORA · Software delivery performance metrics](https://dora.dev/guides/dora-metrics/)
