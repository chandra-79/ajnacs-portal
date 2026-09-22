---
title: "Testing in Production Is Not Reckless — Not Testing in Production Is"
description: "Staging environments cannot replicate production conditions. Testing strategies that operate only on pre-production data have known blind spots. Here is what production testing looks like done responsibly."
date: 2025-09-15
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
