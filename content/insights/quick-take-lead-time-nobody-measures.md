---
title: "From deployment to outcome evidence: name every clock"
description: "Track acceptance, rollout, exposure and evaluation separately to find where useful learning or delivery actually waits."
date: 2028-06-28
tags: ["Engineering Leadership", "Architecture"]
format: article
---

DORA metrics are useful. DORA delivery measures describe change throughput and instability using explicitly defined clocks and denominators. If your lead time is 30 minutes from commit to production, that is a fast pipeline.

But if the commit takes six weeks to reach the point of being written — because feature discovery, design, stakeholder alignment, and prioritization took six weeks — then the 30-minute pipeline is delivering value with a six-week lag.

Lead time for changes measures the pipeline from code to production. Time to value measures the pipeline from idea to user impact. The latter describes a broader process and needs a locally defined outcome.

## What time to value measures

Time to value is the elapsed time from the moment a user need is identified to the moment that need is addressed in production.

It includes:
- Discovery: recognizing the user need
- Prioritization: deciding to work on it
- Design: determining what to build
- Development: writing the code
- Review and testing: validation
- Deployment: getting to production
- Rollout: the need being met at scale

Most teams have good visibility into the last three steps. The dominant interval depends on the product and should be established from its timeline.

## Why teams do not measure it

**The beginning of the pipeline is ambiguous.** When does the clock start? When a user reports a problem? When a ticket is created? When it enters the sprint? These definition questions are real but solvable — the answer is to pick a definition and apply it consistently.

**It requires cross-functional visibility.** Deployment metrics live in the engineering toolchain. Time to value requires tracking items from their origin (product, customer success, user research) through engineering to production. This cuts across team boundaries and systems that do not typically integrate.

**It reveals uncomfortable truths.** A hypothetical team deploying ten times daily but taking eight weeks from idea to production should inspect the earlier stages and their purpose. Discovery and required review may be valuable; deployment frequency alone does not identify the dominant avoidable delay. That is a difficult finding for a team proud of its deployment frequency.

## The insight it provides

A high deployment frequency with long time to value suggests: the pipeline from code to production is healthy, but the pipeline from problem identification to development start is the bottleneck. The fix is in discovery, prioritization, or design processes — not in the CI/CD pipeline.

A short time to value requires being good at the whole pipeline, not just the part that engineering controls. That is a different organizational conversation than most DORA metric discussions produce.

## Avoid using one clock for several different outcomes

A feature can be deployed, exposed to users, used successfully and shown to improve an outcome at different times. Record those events separately. “Time to value” needs an explicit end condition; otherwise teams can make it shorter by moving the finish line from verified benefit to mere availability. The definition should match the decision the measure is intended to support.

The beginning also needs a stable rule. An accepted customer problem is more reproducible than the first time somebody thought of an idea, but it excludes earlier discovery. Explain that exclusion. If a problem is abandoned because evidence shows it is not worth solving, record that decision instead of leaving it indefinitely open in a delivery-time calculation.

## A fictional release-to-evidence example

A small change takes two days from accepted requirement to deployment. It then waits six days before exposure to an eligible cohort and another seven days before the team has enough observations to evaluate the intended outcome. Total accepted-to-evidence time is 15 days. The chart compares the two-day delivery interval with the 13 days after deployment. This does not mean the observation period should simply be removed; some outcomes need time to become interpretable.

The six-day exposure wait may be avoidable if cohort selection, support preparation or feature-flag ownership was left until after the release. The seven-day evaluation window may be necessary to include a full operating cycle. Classify the intervals before choosing an intervention. Shortening a clock by collecting less trustworthy evidence is not a useful improvement.

## Build an outcome timeline for one capability

Choose a capability with a clear intended user behavior. Record acceptance, development start, deployment, first eligible exposure and the planned evaluation date. Link the implementation work to the outcome record even if several tickets or services are involved. Keep incomplete and cancelled outcomes visible, since reporting only completed successes biases the picture.

At each transition, record the reason for waiting and the decision owner. Use existing timestamps where they reflect the real event, but do not assume a ticket's administrative closure equals user exposure. Ask the people responsible for rollout and support to verify the interpretation. This often reveals a handoff that engineering's deployment dashboard cannot see.

## Interpret delivery metrics in their own scope

DORA's current definitions describe software delivery performance, including throughput and instability. They are not a complete measure of product value, and they should not be treated as a claim that discovery or customer learning is unimportant. Use the measures for the part of the system they describe and supplement them with the outcome timeline.

A long overall interval can have several causes, not only a pre-development bottleneck. Work may wait after deployment, a business process may need migration, or the outcome may be difficult to observe. The timeline makes those possibilities visible. Select the next improvement from the observed path rather than assuming that either the engineering pipeline or product discovery must be the problem in every case.

## Sources and further reading

- [DORA · Software delivery performance metrics](https://dora.dev/guides/dora-metrics/)
- [Schwaber and Sutherland · Scrum Guide](https://scrumguides.org/scrum-guide.html)
