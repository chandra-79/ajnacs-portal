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

## Turn familiarity into an operating portfolio

A tutorial usually begins with functioning credentials, healthy dependencies and permission to create resources. Production work includes the reverse conditions. Build evidence around a small service that you can explain from request entry to durable storage, including the controls that prevent accidental deletion or unauthorized access. Documentation and a reproducible lab can demonstrate useful judgment even when no public customer reference exists.

Use a hypothetical readiness rubric with five tasks: deploy, observe, recover, secure and control cost. Score each from zero to two: zero means untested; one means completed with step-by-step help; two means independently repeated with retained evidence. An initial score of 2, 1, 0, 1, 0 totals 4/10. After targeted practice, scores of 2, 2, 2, 1, 1 total 8/10. This is a learning aid, not a certification, hiring benchmark or statistical estimate of engineering competence. Keep the individual dimensions visible because the same total can hide an untested recovery path.

For the exercise, deploy an inexpensive disposable service with a hard spending limit and a deletion checklist. Record the identity used for deployment separately from the application's runtime identity. Create a backup, remove the test dataset and restore it into a new destination. Validate content with a checksum or count that detects omissions rather than merely confirming that the database starts.

## Make the debrief assess decisions

Inject one failure that the tutorial did not cover: deny a storage permission, exhaust a deliberately small connection pool or rotate a credential. Write down the first signal, the competing hypotheses, the evidence that ruled each out and the final correction. Do not claim an incident-recovery duration unless you recorded the start and stop definitions.

Ask a peer to reproduce the recovery from the notes without coaching. If they need undocumented context, improve the instructions and repeat that step. Research should combine official limits and operating documentation with relevant practitioner reports; absence of a public case study alone does not establish that a technology is unsuitable. The resulting portfolio should show boundaries, tradeoffs and cleanup, not just screenshots of a successful deployment. Revisit one decision after a month so remembering why it was made becomes part of the practice.

| Observation | Value (rubric points) |
| --- | ---: |
| Initial evidence | 4 |
| After practice | 8 |
| Possible total | 10 |

**Figure method.** Synthetic five-dimension rubric, each 0–2: initial 2+1+0+1+0=4; later 2+2+2+1+1=8. Ordinal learning aid only; not a validated competence scale.

## Further reading

- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [Google SRE incident response](https://sre.google/workbook/incident-response/)
