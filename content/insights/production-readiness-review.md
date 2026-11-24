---
title: "Production Readiness Reviews: The Checklist That Launches Services Instead of Blocking Them"
description: "The PRR is where an organization's operational standards become enforceable — or become theater. The readiness dimensions that predict incidents, checklist design that scales past the founding SREs, scorecards for the existing fleet, and keeping the gate from becoming the bottleneck."
date: 2028-08-23
tags: ["Reliability", "Platform Engineering", "Engineering Leadership", "Engineering Practice"]
format: article
---

Every operational discipline in this series eventually needs an enforcement moment — the point where "services should have runbooks, SLOs, and graceful shutdown" stops being a wiki aspiration and starts being a condition of carrying production traffic. That moment is the **production readiness review**: the structured assessment a service passes before launch (and periodically after), and it's an instrument with two well-documented failure modes — the *rubber stamp* (a checklist filled in by the team being checked, reviewed by nobody, catching nothing) and the *tollbooth* (a heavyweight committee gate that adds weeks of latency, teaches teams to launch quietly, and reproduces the architecture-review-board pathology in operational costume). The working version threads between them, and its design is mostly borrowed from disciplines this series has already built.

## What the review actually checks: the dimensions that predict incidents

The content converges across mature organizations because incident data converges. The load-bearing dimensions: **observability** (the golden signals instrumented, dashboards existing *before* launch, alerts wired to the SLO burn-rate machinery rather than raw thresholds — and the correlation-ID plumbing that makes the service investigable), **SLOs and capacity** (targets declared with the error-budget policy signed, load tested against realistic traffic per the workload-modeling rules, headroom and scaling behavior verified — including the autoscaling-and-limits configuration that decides whether the launch-day spike is absorbed or amplified), **failure design** (timeouts and retries on every dependency per the resilience contracts, the degradation ladder written, graceful shutdown actually tested — the drain-on-SIGTERM check that costs five minutes and prevents the deploy-time error blips that erode alert trust), **operability** (runbooks attached to every alert per runbook practice, on-call ownership assigned *and staffed* per the rotation math, deploy and rollback rehearsed — the "can you roll back in under ten minutes, and when did you last prove it?" question), **security and data posture** (the least-privilege identity review, secrets in managers not configs, data classified with retention declared per privacy engineering, the authz model named), and **dependency honesty** (every downstream mapped with its criticality tier, quota/limit headroom confirmed with the platforms it consumes — the "we launched and immediately rate-limited ourselves against our own internal API" incident is a PRR-preventable classic).

The design principle across all of it: the review checks for *artifacts and evidence*, not assertions — a dashboard URL, a load-test report, a rollback timestamp, a runbook link — because "yes we have that" and "here it is" differ by exactly the gap incidents live in.

## Making it scale: from founding-SRE ritual to platform property

The PRR's scaling problem is the same as every governance discipline: the founding version (senior SREs reviewing each launch deeply) is high-quality and rate-limited by senior attention; the org grows and the choice arrives — dilute, bottleneck, or *productize*. The productized version: **most of the checklist becomes machinery** (the paved road pre-passes the review — services built from the golden-path template arrive with observability, health checks, secure defaults, and deployment automation already conformant, per the platform-engineering economics; the scorecard tooling from service-catalog practice evaluates the checkable items continuously — has SLOs defined, alerts wired, runbook links live, on-call assigned — turning "readiness" from an event into a *standing, queryable property*), **human review concentrates where judgment lives** (the failure-design conversation, the capacity model's assumptions, the degradation ladder's product trade-offs — a one-hour session with an experienced operator reviewing the *thinking*, not auditing checkboxes), and **tiering matches rigor to blast radius** (the internal tool gets the automated scorecard; the payment-path service gets the full human review plus a game-day — the criticality-inventory logic, as everywhere). The latency discipline keeps it honest: the review's SLA is published, the checklist is available from day zero (a readiness review that surprises teams at launch was a specification withheld — the requirements should shape the build, which is the review's actual value), and the *advisory-first posture* from governance practice applies: teams that engage early get consultation; the gate exists for the reluctant tail.

**And the fleet already in production gets the same treatment**: the periodic re-review (annually, or triggered by incident patterns, ownership changes, or criticality drift — the service that quietly became tier-one per the shadow-criticality problem) against the current bar, with scorecard results public per team. Publication does most of the enforcement work — the red-scorecard service on a shared dashboard gets fixed by pride and peer pressure faster than by mandate — and the aggregate view is leadership's honest map of operational debt, prioritized by tier.

The closing calibration: a production readiness review is an organization writing down what it has learned from its own incidents and refusing to relearn it per service. Kept lightweight where machines can check, human where judgment matters, tiered by stakes, and continuous rather than ceremonial, it becomes the connective tissue between every discipline this series describes and the fleet that's supposed to embody them — the difference between an engineering culture that *has* standards and one that can show you, per service, with links, that it meets them.

## Make the operating contract explicit

A production-readiness review should be a rehearsal of responsibility. Ask the team to show how it identifies impact, limits a bad deployment, restores data and hands over ownership. A link to a runbook is useful only if someone can follow it with the available permissions. A checked backup box is useful only if recovery has been demonstrated for the relevant data and service dependencies.

Separate launch blockers from improvements. A missing recovery route for a critical dataset may block launch; an inefficient dashboard may be scheduled afterward. The decision depends on the workload's risk and commitments, not on a universal count of unchecked boxes. Record exceptions with an owner, expiry and compensating measure. An exception without a review date can silently become the permanent architecture.

Keep evidence small enough to maintain. A service owner, dependency map, service objectives, deployment and rollback record, recovery rehearsal and support route often provide a better starting point than a questionnaire with hundreds of unaudited answers. Reopen the review when material assumptions change: a new data classification, a new region, an order-of-magnitude demand increase or a change in ownership. A one-time launch review does not validate an evolving service indefinitely.

## Convert a checklist answer into a demonstration

Take one claim such as rollback is supported and ask for the last exercised path. Identify the artifact being restored, the data compatibility assumptions and the permissions required. If the previous application version cannot read the current schema, a deployment rollback may not restore the service. The review should reveal that constraint before a launch decision relies on it. The same reasoning applies to backup, alerting and emergency access.

Use a risk-based sampling approach when the estate is large. Review shared platform controls once at the platform boundary, then verify that the workload actually uses them. Review workload-specific behavior where it differs. Copying the same evidence link into every service record is insufficient if some services bypass the control. Record the inheritance relationship and the test that demonstrates the connection.

Make acceptance criteria observable and local to the service. A statement such as improve observability is difficult to close. A criterion such as identify the failed dependency in the bounded rehearsal using the documented telemetry is testable. A statement such as make recovery faster can become a measured recovery target with declared start and end events. These criteria help the team choose work that changes behavior instead of producing more documentation.

The review should leave a short operating contract: the supported service, the responsible team, the promises being made, the exceptions still accepted and the evidence that would reopen the decision. Keep it near the deployment and ownership records so it can evolve with the workload.

Check the contact and access path during the support period the service promises. A named owner who cannot reach the necessary systems outside office hours is not equivalent to an exercised support capability. Resolve that mismatch before accepting the operating commitment.

## Work through an illustrative scenario

A fictional launch review selects twelve mandatory acceptance cases across deployment, observability, recovery and access. Nine pass, two fail and one is blocked because a recovery key is unavailable. Reporting nine out of eleven executed tests would hide the blocked dependency. The launch decision uses the complete twelve-case denominator and treats the missing key as unresolved. The chart shows the work state; it is not a universal readiness score.

| Observation | Value (test cases) |
| --- | ---: |
| Passed | 9 |
| Failed | 2 |
| Blocked | 1 |

**Calculation and limits.** Synthetic set of twelve predeclared acceptance cases. Blocked cases remain in the denominator. Counts summarize review progress; launch permission depends on the severity and consequences of each unresolved case.

## Build the evidence worksheet

**Service commitment.** Name the customer operation and the availability, latency and recovery obligations that the review evaluates.

**Accountable owner.** Confirm who receives incidents and maintains the service after the project team moves on.

**Demonstrated control.** Attach the observation or rehearsal result that proves the control operates in the selected scope.

**Unresolved risk.** Describe the failure and affected outcome rather than reducing it to an unchecked box.

**Exception expiry.** Record a responsible approver, compensating measure and date when the exception must be revisited.

**Reassessment trigger.** Identify architectural or organizational changes that require another readiness review.

## Rehearse the failure boundary

1. **Roll back a bad release.** Verify application and data compatibility with the actual previous version.

2. **Lose a required credential.** Exercise the documented recovery path rather than relying on one engineer’s laptop.

3. **Page the named owner.** Check routing and access during the intended support hours.

4. **Change a dependency contract.** Repeat the affected acceptance cases and update the evidence rather than retaining the old pass result.

## Sources for the mechanisms

- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [Google SRE incident response](https://sre.google/workbook/incident-response/)
