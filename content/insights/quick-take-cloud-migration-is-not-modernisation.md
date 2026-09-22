---
title: "Cloud Migration Is Not Modernisation: The Difference Matters"
description: "Moving an application to the cloud preserves its problems in a more expensive environment. Modernisation requires addressing those problems. Conflating the two leads to disappointment."
date: 2025-07-21
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
