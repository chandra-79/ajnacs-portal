---
title: "Testing in production is not reckless. Not testing in production is."
description: "Every deployment is a production test."
date: 2029-01-31
tags: ["DevSecOps", "Cloud Architecture"]
format: note
derived: true
---

Every deployment is a production test. The question is whether it is a structured test with defined success criteria and rollback triggers, or an unstructured release where the first indicator of a problem is a spike in the error rate.

Staging can validate functional, integration and selected performance behavior under its modeled conditions. It cannot reproduce every production interaction, so document which traffic, data and dependency assumptions limit its evidence and use appropriately controlled additional validation.

The engineering discipline of deliberate production testing closes this gap. Feature flags allow incremental exposure: route 1% of traffic to the new code path, validate the metrics, expand to 10%, validate, expand to 100% or roll back. Canary deployments run new and old versions in parallel, comparing error rates, latency, and business metrics before full rollout. Synthetic monitoring continuously validates that critical user paths are functioning, not just that the health check endpoint returns 200. Chaos engineering deliberately introduces failure conditions to validate that the system behaves as designed under conditions that will eventually occur in production.

The fear of production testing is the fear of known risk. The teams that avoid it face unknown risk instead — the deployment that looked fine in staging and failed at scale because of a data access pattern nobody anticipated. Known risk, structured and bounded, is a better operational posture than unknown risk discovered by users.

## Keep synthetic checks from becoming real business activity

A synthetic purchase should not charge a real card, consume inventory or send customer notifications. Use a designated tenant and explicit side-effect controls, then verify those controls. A shadow request can also produce effects if its write destinations are not isolated; hiding the response alone is insufficient.

In a hypothetical hour, a synthetic checkout runs every five minutes, producing twelve expected attempts. Eleven complete and one times out. The observed success fraction is 11/12 = 91.7%, but the tiny probe sample is not an estimate of the entire customer population's availability. It establishes that one specific path failed at one observation time.

The exercise worksheet records the probe identity, inputs, expected output, excluded side effects, timeout, cleanup and alert destination. Deliberately break a harmless dependency in a test environment and confirm that the probe detects the customer-visible failure rather than only checking process health. Keep staging tests for functional and integration behavior; they can provide substantial evidence even when they cannot reproduce every production interaction. Production checks address the remaining uncertainty with bounded risk and authorization, not a blanket assumption that experimentation is always safer.

Record cleanup evidence.

| Observation | Value (attempts) |
| --- | ---: |
| Expected attempts | 12 |
| Completed | 11 |
| Timed out | 1 |

**Figure method.** Synthetic hourly schedule: 60/5=12 probes; 11/12=91.7% observed success. Sparse probes do not estimate all-user availability without an appropriate sampling model.

## Further reading

- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [Google SRE incident response](https://sre.google/workbook/incident-response/)
