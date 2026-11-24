---
title: "Testing in Production Is Not Reckless — Not Testing in Production Is"
description: "Staging environments cannot replicate production conditions. Testing strategies that operate only on pre-production data have known blind spots. Here is what production testing looks like done responsibly."
date: 2028-04-24
tags: ["DevSecOps", "Cloud Architecture"]
format: article
---

The phrase "testing in production" is used as a pejorative — shorthand for reckless engineering, for shipping without proper QA. The reality is more nuanced: every team with production traffic already tests in production. The question is whether they do it deliberately and safely or accidentally and dangerously.

## Why production testing is necessary

Staging environments cannot replicate the full complexity of production:

- Production data has diversity, volume, and edge cases that staging data cannot fully represent
- Production traffic has patterns, concurrency, and timing characteristics that synthetic load cannot fully replicate
- Production infrastructure has specific configuration, scale, and failure characteristics that staging simplifies
- Third-party integrations behave differently in production than in sandbox environments

A system that has only ever run in staging has only ever been tested on a simplified model of production. The first time it runs at production scale, with production data, under real user patterns — that is a test. The question is whether it is a controlled test or an uncontrolled one.

## What responsible production testing looks like

**Feature flags.** New code is deployed to production but accessible only to a defined subset of users (percentage-based rollout, internal users, specific user segments). Issues affect only the flag-targeted population and can be addressed before wider rollout. This is production testing. It is deliberate, controlled, and standard practice.

**Canary deployments.** New code is deployed to a small percentage of production infrastructure. Traffic is routed to the canary instances at a controlled percentage (5%, 10%). Metrics are compared between canary and baseline. The rollout proceeds only if metrics are within acceptable range. This is production testing that is safer than not doing it.

**Shadow mode testing.** New code runs in parallel with existing code, receives production traffic, but its output is not served to users. The output is compared to the existing system's output in the background. This is how you validate a new model, a new query engine, or a new data processing pipeline before switching users to it.

**Chaos engineering.** Deliberately introducing failures in production to verify that the system's resilience mechanisms work as designed. Netflix famously runs this in production. The rationale: a failure that you introduce intentionally in a controlled manner is better than discovering it during an uncontrolled incident.

The staging environment that passes all tests and says nothing about production behavior is not safety. It is false confidence. Controlled production testing is the alternative.

## Define an experiment that can stop before harm grows

Production validation is a complement to pre-production testing, not permission to bypass it. Some workloads cannot tolerate experimental writes or deliberate disruption, and an organization may prohibit particular production exercises. Choose the smallest authorized observation that resolves the remaining uncertainty. A canary still serves real users, so its blast radius and reversal mechanism must be understood.

Consider a hypothetical rollout with 10,000 eligible requests during a decision window. A 2% canary receives 200 requests; the baseline receives 9,800. If the canary records six failures and the baseline records 49, the observed rates are 3% and 0.5%. The difference is 2.5 percentage points, or sixfold in relative terms. With only 200 canary observations, uncertainty and cohort differences matter; this example is a stop signal for investigation rather than a formal significance test.

Write the decision rule before launch: the eligible population, observation window, minimum sample, user-visible metric, stop threshold and person who can halt the rollout. Include latency and correctness where errors alone miss damage. Compare like-for-like requests because a canary assigned only internal users may not represent customer traffic. Preserve failed and timed-out requests in the denominator.

## Check the side effects of shadow execution

A shadow request must not send a second email, charge a card, publish an event or mutate authoritative data merely because its response is hidden. Use isolated destinations, read-only operations or explicit side-effect suppression, and verify that suppression with test cases. Protect copied production data using the same access and retention rules as the original.

For an exercise, deploy a harmless endpoint that returns a deterministic result. Introduce a controlled error in the canary, confirm that the stop condition fires and verify that routing actually returns to the baseline. Then test an incompatible schema change in a disposable environment to demonstrate why binary rollback may not undo data changes. Record cleanup and residual state.

Chaos experiments need an explicit hypothesis, a known steady state, abort controls and a scope appropriate to the system's criticality. Begin with a simulation or staging drill when the recovery path is unproven. The useful outcome is evidence about a named uncertainty, including what remains untested, rather than a general claim that all production experimentation is safer than avoiding it.

| Observation | Value (percent) |
| --- | ---: |
| Canary failures | 3 |
| Baseline failures | 0.5 |

**Figure method.** Synthetic window: canary 6/200=3%; baseline 49/9,800=0.5%. Difference=2.5 percentage points; ratio=6. Small samples and cohort imbalance limit inference.

## Further reading

- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [Google SRE incident response](https://sre.google/workbook/incident-response/)
