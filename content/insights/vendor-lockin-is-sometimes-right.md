---
title: "Vendor lock-in is not always a mistake. Sometimes it's the correct trade."
description: "The anti-lock-in argument is intuitively appealing and frequently overstated."
date: 2029-03-21
tags: ["Cloud Architecture", "Architecture", "Engineering Leadership"]
format: note
derived: true
---

The anti-lock-in argument is intuitively appealing and frequently overstated.

Vendor dependence includes migration effort, bargaining constraints and exposure to changes in pricing or service terms. Some of those costs arise without a migration. Portability mechanisms also carry an ongoing cost, so compare concrete obligations and plausible exit scenarios rather than assuming either path is free.

The services that are most likely to bind you to a vendor are also often the services most worth using: managed databases, serverless compute, fully managed data pipelines. They reduce operational overhead, often significantly. The equivalent self-managed setup requires people, expertise, and time that could go elsewhere.

The right question is not "does this create lock-in?" but "what would migration actually cost, and what is the realistic probability we'd need to migrate?" For a particular workload, compare the managed-service benefit with explicit exit scenarios, obligations and operating costs; the outcome is not universal.

Make the trade consciously — understanding what you are giving up and why — rather than avoiding lock-in reflexively and paying for portability you will likely never use.

## Price the exit option explicitly

An exit cost is contingent, not imaginary: it can affect negotiating power, regulatory obligations and a supplier's ability to change terms before migration happens. A sensible worksheet separates recurring service cost, integration work and the one-time exit exercise. It also records which capabilities are difficult to replace: query semantics, identity integration, workflow history or operational knowledge.

Consider a hypothetical three-year decision. A managed platform saves 80 engineer-days annually compared with the proposed self-managed alternative. Its adoption needs 30 days, while a later exit is estimated at 150 days. Ignoring discounting, salary differences and capacity constraints, the operating saving is 240 days. After adoption it is 210 days; after one exit it is still 60 days. This is a sensitivity calculation, not a prediction that an exit will happen or a valuation of supplier risk.

For the exercise, export a representative dataset, restore it into an independent target and rerun five important queries. Record incompatible types, lost metadata, elapsed time and access restrictions. The export only proves data movement; it does not prove replacement of applications or operating procedures. If a legal exit deadline is shorter than the tested migration duration, the decision changes even when expected financial value is attractive.

| Observation | Value (engineer-days) |
| --- | ---: |
| Three-year saving | 240 |
| After adoption | 210 |
| After one exit | 60 |

**Figure method.** Synthetic inputs: 80 days/year × 3 = 240; subtract 30 adoption days, then 150 exit days. No discounting or probability weighting; not a customer result.

## Further reading

- [NIST cloud definition](https://www.nist.gov/publications/nist-definition-cloud-computing)
- [AWS architectural trade-offs](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
