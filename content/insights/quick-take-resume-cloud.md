---
title: "Resume Cloud vs. Production Cloud: The Gap That Catches People"
description: "The cloud technologies you have heard of and can talk about in interviews are not always the ones you should run in production. Here is how to develop the judgment to know the difference."
date: 2028-03-27
tags: ["Cloud Architecture", "Engineering Leadership"]
format: article
---

There are two kinds of cloud knowledge that engineers accumulate.

The first kind: familiarity with services that have good marketing, appear in certification syllabi, get mentioned in conference talks, and make excellent resume line items. You know what they are, you have done the tutorials, you can describe them in an interview.

The second kind: operational knowledge of services at production scale — knowing how they fail, what their limits are, which configuration decisions matter, what the support experience is like when something goes wrong.

These two categories overlap, but they are not the same.

## Why the gap exists

Cloud providers have hundreds of services. Most engineers encounter them through documentation, certification prep, and conference content — which disproportionately covers the services that are new, interesting, and heavily promoted. The services that are boring, stable, and genuinely excellent — SQS, CloudWatch Logs, RDS, S3 — get less coverage because they do not generate blog posts.

The services that generate blog posts and conference talks are the ones with interesting architectures, impressive benchmarks, and novel capabilities. Some of them also have significant operational rough edges that you discover after you have committed to them in production.

## Developing production judgment

The indicators that a technology is production-ready for your use case:

**Reference production deployments.** Not vendor case studies — engineering blog posts from companies of comparable scale describing what they specifically did and what they discovered in the process. If you cannot find these, the technology is either too new or too niche to have established operational patterns.

**Supportability at your scale.** For a team of 10, the technology needs to be diagnosable without deep expertise. If understanding why it is behaving unexpectedly requires reading the internals or reading mailing list discussions from 2019, factor that into the evaluation.

**Failure mode documentation.** Does the documentation clearly describe what happens when things go wrong? What the limits are? What the common operational mistakes are? Technologies with good failure documentation have been operated at scale by enough people that the edge cases are understood.

The technology choice that looks impressive in an interview is not always the choice that ages well in production. The job is to ship reliable systems, not to optimize the resume.
