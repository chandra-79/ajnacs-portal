---
title: "Testing in production is not reckless. Not testing in production is."
description: "Every deployment is a production test."
date: 2029-01-31
tags: ["DevSecOps", "Cloud Architecture"]
format: note
derived: true
---

Every deployment is a production test. The question is whether it is a structured test with defined success criteria and rollback triggers, or an unstructured release where the first indicator of a problem is a spike in the error rate.

Staging environments are useful for catching obvious regressions — missing environment variables, broken deployments, failing health checks. They are not useful for validating the production experience, because the production experience depends on production traffic patterns, production data distributions, production dependency response times, and production user behaviour that no staging environment reliably replicates.

The engineering discipline of deliberate production testing closes this gap. Feature flags allow incremental exposure: route 1% of traffic to the new code path, validate the metrics, expand to 10%, validate, expand to 100% or roll back. Canary deployments run new and old versions in parallel, comparing error rates, latency, and business metrics before full rollout. Synthetic monitoring continuously validates that critical user paths are functioning, not just that the health check endpoint returns 200. Chaos engineering deliberately introduces failure conditions to validate that the system behaves as designed under conditions that will eventually occur in production.

The fear of production testing is the fear of known risk. The teams that avoid it face unknown risk instead — the deployment that looked fine in staging and failed at scale because of a data access pattern nobody anticipated. Known risk, structured and bounded, is a better operational posture than unknown risk discovered by users.
