---
title: "Cloud Migration Is Not Modernisation: The Difference Matters"
description: "Moving an application to the cloud preserves its problems in a more expensive environment. Modernisation requires addressing those problems. Conflating the two leads to disappointment."
date: 2028-06-07
tags: ["Cloud Architecture", "Infrastructure"]
format: article
---

The pitch for cloud migration often includes words like transformation, modernisation, and agility. These words are doing a lot of work.

Moving a 2008-era monolithic application from a data center to EC2 instances is not modernisation. It is relocation. The application has the same architecture, the same codebase, the same data model, and the same operational characteristics — plus the overhead of learning to operate in the cloud, plus a monthly bill that may be higher than the data center cost it replaced.

This is not a failure. Relocation is a legitimate first step. The mistake is calling it modernisation and measuring success against modernisation outcomes.

## What lift and shift actually buys you

Lift and shift buys you:

- **Elasticity in principle**, though most migrated workloads do not actually autoscale without additional work
- **Managed infrastructure** — no more physical server procurement or data center maintenance
- **Geographic flexibility** — easier to add regions if the architecture supports it
- **A starting point** for the actual modernisation work

What it does not buy you:

- **Performance improvement** unless the old environment was constrained
- **Cost reduction** in the first year (usually cost parity or increase before optimization)
- **Developer velocity** from cloud-native services, which require rearchitecting to use
- **Resilience** from managed services that you are not using

## Where expectations go wrong

Organisations that migrate expecting modernisation outcomes from a lift-and-shift motion get disappointed. The cloud bill is higher than expected. The application is not faster. Deployments are not more frequent. The architecture is the same, just hosted differently.

The resulting narrative — "cloud doesn't deliver value for us" — is a misattribution. The cloud delivered exactly what a lift-and-shift provides. The organisation expected what a rearchitecture provides.

## The honest conversation before migration

Before migrating, decide: what are we actually doing?

If the answer is "we want to get out of the data center and defer modernisation" — that is a valid choice. Measure it on data center exit and operational cost.

If the answer is "we want cloud-native architecture, managed services, and elastic scale" — that is a rearchitecture program. It takes longer, costs more upfront, and produces different outcomes. Plan accordingly.

Both are legitimate. They are different programs with different timelines and different investment profiles. Call each one what it is.

## Put separate acceptance tests on relocation and redesign

A migration can deliver a valuable deadline even when its first release preserves the application architecture. An expiring data-centre contract, an unsupported operating system or a disaster-recovery gap can justify moving first. Avoid promising automatic savings or assuming costs must rise: compare complete costs for the actual workload, licensing, support, migration overlap and staff responsibilities.

Consider an illustrative monthly operating baseline of 30,000 currency units. The relocated application costs 34,000 during its initial steady period. Later changes reduce unused capacity by 5,000 and replace a scheduled polling task with a design that costs 2,000 less. The resulting total is 27,000. Relocation initially increases the model by 13.3%; the subsequent design reaches 10% below the original baseline. These are scenario inputs, not market prices or an Ajna customer result. They exclude the one-time cost of both projects, which must remain visible in the investment case.

A useful worksheet has two acceptance columns. Relocation requires verified data integrity, supported access paths, restore evidence and an exercised cutover. Modernisation requires the specific capability purchased: independent releases, a shorter deployment path, a lower cost per completed unit or recovery within the chosen objective. Neither column should borrow evidence from the other.

## Test a thin slice before changing every dependency

Choose one background workflow with a measurable completion event. Capture its arrival pattern, failure behavior, dependencies and unit cost before moving it. Replay a non-sensitive workload against the target with a fixed input volume, then compare success rate and end-to-end completion time. Preserve a mapping from original job identifiers to target identifiers so missing work can be reconciled.

Next introduce a duplicate event and a delayed retry. If the new managed queue changes delivery semantics, verify that the consumer remains idempotent and that failed jobs have a recovery path. A superficially successful migration can conceal changed ordering or acknowledgment behavior. Keep the original route available until the agreed reconciliation boundary, and name the conditions under which rollback is no longer safe. This turns a broad transformation claim into several observable engineering decisions.

| Observation | Value (currency units/month) |
| --- | ---: |
| Original baseline | 30000 |
| Relocated service | 34000 |
| After redesign | 27000 |

**Figure method.** Synthetic monthly model: 34,000−5,000−2,000=27,000; relocation change 4,000/30,000=13.3%; final change −3,000/30,000=−10%. One-time project costs excluded.

## Further reading

- [Azure landing-zone architecture](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/)
- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
