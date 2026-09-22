---
title: "Vendor Lock-in Is Not Always a Mistake — Sometimes It Is the Correct Trade"
description: "Deliberate, acknowledged lock-in in exchange for significant capability advantage is a legitimate architectural decision. The mistake is not choosing lock-in — it is choosing it without recognizing it."
date: 2028-08-07
tags: ["Cloud Architecture", "Architecture", "Engineering Leadership"]
format: article
---

The blanket principle "avoid vendor lock-in" is applied without nuance in many engineering conversations. The result is teams that avoid useful managed services, build abstraction layers that reduce capability access, and spend engineering time on portability they will never use.

The principle is sound as a concern. Applied without analysis, it produces bad decisions in the other direction.

## When lock-in is the correct trade

**When the capability advantage is large and the switching cost is manageable.** Aurora PostgreSQL-compatible has performance characteristics that require significant engineering effort to replicate with self-managed PostgreSQL. If the team is building a data-intensive application, the capability advantage is real. If switching to RDS or self-managed PostgreSQL is something that could be done in weeks rather than months, the lock-in risk is contained.

**When the switching trigger probability is low.** A regulated financial services firm that has built on AWS for a decade is unlikely to switch cloud providers. The lock-in exists. It is acknowledged. The switching cost is not zero, but the probability of paying it is also not zero — it is very low. The appropriate response is to document the lock-in, understand the switching cost, and continue using the capabilities that make the system work.

**When the alternative is complexity that costs more than the lock-in.** A multi-cloud deployment that requires maintaining operational expertise across two providers, maintaining custom tooling for cross-cloud portability, and forgoing cloud-native features costs more, in continuous operational overhead, than the theoretical switching cost of being on one provider. The lock-in is cheaper than the alternative.

## What "deliberate lock-in" requires

A deliberate lock-in decision has three components:

1. **Acknowledgement.** The team knows this is a lock-in. It is written down. Future engineers joining the team understand the dependency.

2. **Cost estimation.** Someone has estimated what migration would cost. Not in detail, but in order of magnitude. Weeks? Months? Years? This informs the risk.

3. **Periodic review.** The lock-in decision should be revisited annually. Circumstances change. If the vendor's pricing changes, or the vendor's stability changes, the trade-off changes.

The mistake is not choosing lock-in. The mistake is choosing it without recognizing it as a choice.
