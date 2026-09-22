---
title: "Every Team Measures Time to Deploy. Almost None Measure Time to Value."
description: "Deployment frequency and lead time for changes measure how fast code moves through the pipeline. They do not measure how long it takes for that code to produce value for the user. The gap between them is where strategy fails."
date: 2028-06-28
tags: ["Engineering Leadership", "Architecture"]
format: article
---

DORA metrics are useful. Lead time for changes, deployment frequency, change failure rate, MTTR — these measure the delivery pipeline health. If your lead time is 30 minutes from commit to production, that is a fast pipeline.

But if the commit takes six weeks to reach the point of being written — because feature discovery, design, stakeholder alignment, and prioritization took six weeks — then the 30-minute pipeline is delivering value with a six-week lag.

Lead time for changes measures the pipeline from code to production. Time to value measures the pipeline from idea to user impact. The latter is longer, harder to measure, and more important.

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

Most teams have good visibility into the last three steps. The first three are where the time actually accumulates.

## Why teams do not measure it

**The beginning of the pipeline is ambiguous.** When does the clock start? When a user reports a problem? When a ticket is created? When it enters the sprint? These definition questions are real but solvable — the answer is to pick a definition and apply it consistently.

**It requires cross-functional visibility.** Deployment metrics live in the engineering toolchain. Time to value requires tracking items from their origin (product, customer success, user research) through engineering to production. This cuts across team boundaries and systems that do not typically integrate.

**It reveals uncomfortable truths.** A team that deploys 10 times a day but takes 8 weeks from idea to production is optimizing the wrong half of the problem. That is a difficult finding for a team proud of its deployment frequency.

## The insight it provides

A high deployment frequency with long time to value suggests: the pipeline from code to production is healthy, but the pipeline from problem identification to development start is the bottleneck. The fix is in discovery, prioritization, or design processes — not in the CI/CD pipeline.

A short time to value requires being good at the whole pipeline, not just the part that engineering controls. That is a different organizational conversation than most DORA metric discussions produce.
