---
title: "Platform Engineering Only Works If It's Easier Than the Alternative"
description: "A platform that requires more effort to use than the DIY approach will not be adopted voluntarily. Developer experience is not a nice-to-have in platform engineering — it is the success metric."
date: 2028-09-27
tags: ["Platform Engineering", "Engineering Leadership"]
format: article
---

The platform team spent six months building a deployment platform. It is secure, compliant, observable, and built on best practices. The first application team to try it spends three days configuring it and gives up. They deploy on their own.

The platform failed. Not because it was technically wrong, but because adoption requires that the platform be easier than the alternative.

## Why voluntary adoption is the right test

Enterprise platform teams often have the ability to mandate platform adoption — via policy, via compliance requirements, via organizational pressure. This produces adoption numbers that look good and platform quality that stagnates.

Mandated platforms do not receive honest feedback because teams have no choice. Problems are worked around rather than escalated. The platform team measures adoption and declares success while the application teams are quietly maintaining complex workarounds for the platform's limitations.

Voluntary adoption produces honest feedback: either teams adopt the platform because it genuinely helps them, or they do not and the gap is visible. The feedback loop is direct.

## What "easier than the alternative" requires

**Fast time to first deployment.** An application team evaluating the platform should be able to get their first workload deployed in under an hour. If initial onboarding requires days of configuration, documentation study, and back-and-forth with the platform team, the platform has failed the first impression test.

**Golden paths that are genuinely simple.** The "happy path" for common use cases (deploy a web service, connect to a database, set up alerting) should be achievable without reading extensive documentation. If the common case requires understanding unusual abstractions or uncommon tools, the golden path is not golden.

**Responsive support.** Application teams hitting platform issues need a response, not a ticket queue. The platform team that takes a week to respond to an integration question will find that the application team solved the problem a different way before the response arrived.

**Visible progress over time.** Teams need to see the platform improving. A platform that has the same rough edges six months after an issue was reported feels like a bet on the wrong tool.

## The metric that matters

The platform's success is measured by: what percentage of application teams voluntarily use it for new projects, and what percentage actively choose it over the alternative when they have a choice?

If those numbers are not growing, the platform is not winning on developer experience. Everything else — architecture quality, security posture, observability — depends on the platform being used.

## Measure onboarding as a funnel with a qualifying finish

A first deployment is useful only if it meets the intended operating standard. Define a qualifying deployment: the application is reachable, authenticated where required, observable, owned and recoverable through the supported path. A hello-world container that bypasses those requirements can make onboarding look fast while postponing the real work.

In a hypothetical pilot, 30 developers start the path, 24 reach a build, 18 deploy a service and 15 complete the qualifying checks. The end-to-end completion rate is 15/30 = 50%, while deployment alone would report 60%. The chart uses one cohort and nested stages; adding stage counts would double-count participants. Record abandonment and blocked attempts rather than timing only successful users.

For the worksheet, capture start condition, required prior access, completion event, elapsed time, hands-on time and support interactions. Separate waiting for an account from editing configuration because they require different improvements. Segment by workload type and prior experience where the sample permits, but avoid presenting tiny subgroups as robust statistics.

## Observe a new user without coaching them through every step

Ask a pilot participant to deploy a representative harmless service using the published path. Record the point where they hesitate, the terminology they misunderstand and the evidence that tells them deployment succeeded. Intervene for safety, but mark assisted steps so the observed completion is not mistaken for self-service success.

Next, change one friction point and repeat with comparable participants or tasks. A shorter median may come from selecting more experienced users, so preserve cohort context and the number of incomplete attempts. A one-hour target can be an internal goal for a defined workload; it is not an industry law for every regulated or data-intensive service.

Voluntary adoption supplies useful feedback, while some controls legitimately require mandated platform use. In either case, measure whether the platform reduces work and preserves required capabilities. Maintain an exception path for unsupported workloads and use exceptions as product research rather than treating them automatically as disobedience. Publish the supported journey, current limitations and improvement backlog. The platform earns sustained use when developers can complete real work safely and the team responds to evidence about where they cannot.

| Observation | Value (developers) |
| --- | ---: |
| Started | 30 |
| Built | 24 |
| Deployed | 18 |
| Qualified | 15 |

**Figure method.** Synthetic nested cohort: qualifying completion=15/30=50%; deployment-only=18/30=60%. Stages are not additive; include abandoned and assisted attempts.

## Further reading

- [Kubernetes production environment](https://kubernetes.io/docs/setup/production-environment/)
- [Google SRE incident response](https://sre.google/workbook/incident-response/)
