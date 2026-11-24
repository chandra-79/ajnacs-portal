---
title: "Measuring Platform Engineering Success: The Metrics That Actually Matter"
description: "DORA metrics, developer experience scores, cognitive load measures, and the platform health indicators that tell you whether your internal platform is creating value or creating another bottleneck."
date: 2026-07-21
tags: ["Engineering Leadership", "Architecture", "Fundamentals"]
series: "Platform Engineering: From Concept to Internal Developer Platform"
seriesOrder: 5
format: article
---

Platform engineering teams face a measurement challenge: their output is other teams' productivity. A platform feature that saves 200 engineering hours per month across 20 application teams delivers enormous value that is invisible in the platform team's own delivery metrics. Building the right measurement framework is essential for making that value visible, justifying continued investment, and identifying where the platform is failing to meet developer needs.

## What to measure

**A balanced platform scorecard.** Pair adoption, time to first deployment and service reliability. If 45 of 60 eligible teams use the path, adoption is 75%; a 10-team rollout is not a valid denominator for all 60 teams. Track change failures and rework to check that speed has not shifted work downstream.

*Illustrative measurement. Any numbers in this example are hypothetical.*

Further reading: [DORA’s software delivery performance metrics](https://dora.dev/guides/dora-metrics/).

## The Primary Metric: Developer Productivity

The platform exists to make application developers more productive. Productivity is multidimensional, but three signals are reliable:

**[DORA’s five delivery performance metrics](https://dora.dev/guides/dora-metrics/)**, measured per application or service:

- Change lead time
- Deployment frequency
- Failed deployment recovery time
- Change fail rate
- Deployment rework rate

Measure recovery from failed deployments here. Keep customer-facing incidents with other causes in your reliability review.

A platform that is working should improve these metrics over time. If deployment frequency is flat a year after platform adoption, the platform is not reducing friction in the deployment path. If change failure rate is rising, the platform's testing and deployment gates may be providing false confidence.

**Time to first deployment**: how long does it take a new service to go from initial creation to a successful deployment in staging? This is the most direct measure of onboarding friction. A target of under one working day is achievable with good scaffolding and self-service infrastructure. More than one week indicates significant platform usability problems.

**Developer experience (DevEx) score**: a quarterly survey of application developers measuring specific dimensions:
- "I can deploy my service without help from the platform team" (1–5)
- "The platform documentation is sufficient to unblock me" (1–5)
- "Platform incidents are communicated to me clearly and quickly" (1–5)
- "The platform helps me comply with security requirements without slowing me down" (1–5)

The questions should be specific enough that scores are actionable. "Are you satisfied with the platform?" is too broad.

## Cognitive Load as a Leading Indicator

Cognitive load — the mental effort required to do a task — is difficult to measure directly but has observable proxies.

**Ticket volume to the platform team**: if application developers are filing tickets asking "how do I configure X" or "how do I access Y," the platform is creating cognitive load it should be eliminating. Track ticket categories and use them to prioritise documentation and self-service improvements.

**Escape hatch usage**: the rate at which teams provision infrastructure outside the platform. High escape hatch usage means the platform is not covering a real need — developers are finding workarounds. The nature of the workaround tells you what to build next.

**Time spent on infrastructure vs product**: a rough measure from developer surveys. "Approximately what percentage of your last sprint did you spend on infrastructure, tooling, or platform issues rather than product features?" A platform that is working should drive this number down over time.

## Platform Health Metrics

The platform itself needs to be operated reliably. The metrics for platform health:

**Availability by capability**:
- CI/CD pipeline availability: % of time pipelines are operational
- Secrets manager availability: % of time secret reads succeed within SLA
- Container registry availability: % of time image pulls succeed

**Platform incident impact**: when the platform has an incident, how many application teams are affected? The breadth of impact is a proxy for coupling — a highly coupled platform failure is more severe than one that only affects specific capabilities.

**Adoption coverage**: what percentage of services are deployed through the platform vs. directly to the underlying infrastructure? This should trend toward 100% for new services. Legacy services may have legitimate reasons for lower platform adoption.

**Toil reduction**: track the time the platform team spends on manual, repetitive tasks. As automation matures, this number should fall. If it is not falling, the platform is not automating its own operations effectively.

## What Not to Measure

**Platform team velocity**: measuring the platform team's sprint velocity incentivises delivering features regardless of adoption or impact. A platform feature that is delivered but not adopted is not a success.

**Number of capabilities delivered**: same problem. The value is in the adoption and impact, not the delivery.

**Uptime in isolation**: a platform that is 100% available but developers are not using is not a healthy platform. Availability is necessary but not sufficient.

## Reporting to Leadership

Platform engineering investment requires ongoing justification to engineering leadership and business stakeholders. A useful reporting frame:

**Quarterly platform review**:
- DORA metric trends across platform-adopting teams vs. baseline
- Time-to-production for new services (trend)
- Developer satisfaction scores (trend)
- Infrastructure cost efficiency (the platform should also improve cost through consistent resource governance)
- Top 3 pain points from developer feedback and the platform roadmap items that address them

The platform team should be able to quantify the engineering hours saved through self-service and automation. If 50 services onboard per quarter and each onboarding takes 8 hours less than before the platform, that is 400 engineering hours per quarter — roughly 2.5 engineering months of capacity returned to product work. That is the business case in terms leadership can act on.

Platform engineering succeeds when it is invisible to the developers who benefit from it — when deploying a service is so effortless that nobody thinks about the infrastructure underneath. The measurement framework is what makes that invisibility legible as value.

## Put a measurement contract beside every metric

Use a short specification with the unit of analysis, event source, eligibility rule, numerator, denominator, window and reporting owner. In a platform pilot, a service, a recurring workflow run and a survey respondent are different units. An organization that counts all workflow executions can give a frequently deployed team more weight than several slower teams. This may suit a question about pipeline load. For onboarding, use one row per eligible service or request and record the owning team, first accepted timestamp, deployment environment, and evidence of a qualifying deployment.

| Measure | Denominator and evidence | Decision it supports |
| --- | --- | --- |
| Timely onboarding completion | Eligible requests with enough follow-up and policy-verified deployment events | Whether the target experience reaches enough teams |
| Platform support burden | Eligible requests with human work logged in a defined period | Whether a change moves work into platform support |
| Adoption among eligible teams | Eligible teams with independently verifiable use | Whether the platform reaches its intended audience |
| Application delivery performance | Eligible service deployments and changes under the published definitions | Whether service delivery speed and stability changed |

Ask a second person to reproduce one number from event records. Document how duplicates, retries, cancelled work, missing services and changed timestamps are handled. For delivery performance, group by service or an equivalent independently deployed workload and use the current DORA definitions for the dated report. Record outages unrelated to a deployment in the workload's reliability review. [DORA software delivery performance measures](https://dora.dev/guides/dora-metrics/)

## Keep unsuccessful journeys in the comparison

Set a fixed follow-up period before starting. In an illustrative 10-business-day comparison, the prior process handles 24 eligible services and 21 complete. The pilot handles 24 and 18 complete. Among completers, median time falls from 16 to 10 elapsed working hours. The completion rates are 87.5% and 75%, a decrease of 12.5 percentage points. Both numbers can be true. The pilot may have improved smooth-path experience while making common exceptions harder to resolve.

Tag unfinished records as awaiting access, awaiting approval, failed verification, abandoned, or unknown. Keep cases that join at the end under follow-up until their full window has passed. Report incomplete evidence as its own category instead of assuming missing timestamps imply failure or success. If teams intentionally opt out after starting, count them in the eligible cohort and report the reason separately. Exclusion is appropriate only when the predefined eligibility rule shows the request was never in scope.

Review which applications are comparable. A production rollout requiring data approval and a staging deployment with synthetic data have different constraints. Compare them separately and hold operational rules constant where possible. Log other changes in the same period such as an identity migration, a platform outage or a major staffing change. A before-and-after contrast with those changes cannot assign an observed difference to the platform alone.

## Estimate capacity using observed work

Separate elapsed time from active effort. An approval queue can shrink by a day while reviewer effort stays constant. A task can also move from application developers to platform engineers. For a fictional month, a reviewed sample estimates four hours of active application effort per eligible onboarding before the change and two afterward. Across 30 comparable onboardings, the gross application opportunity is 60 hours. Platform operations add 18 hours of routine support and 10 hours of recurring maintenance. For the recurring work in this simplified calculation, approximate net time returned is 32 hours. Show one-time implementation costs and avoid treating reclaimed time as immediate cash savings.

Publish the inputs and a low and high estimate if the active time data comes from recollection or small samples. Test how the result changes when rare but expensive requests are included. Include time spent by the supplier, product team and on-call if the workflow creates or removes routine work for them. When participants log activity, explain which categories are for understanding the process and keep individual measurement out of performance assessment.

A useful monthly chart puts counts of completed and incomplete requests next to support time per eligible request. Annotate product and policy changes. Health checks follow the same principle. For an example target on image pulls, measure successful eligible pulls within a user-relevant threshold over the window and distinguish platform errors from invalid producer requests using documented rules. Keep outages in the actual developer journey visible even when the cause lives in a dependency. [Google SRE Workbook on implementing SLOs](https://sre.google/workbook/implementing-slos/)

## Translate the scorecard into one next test

Segment slow completed journeys by workflow and by reason for waiting. Pick a time-consuming category with enough observations for a fresh cohort. If approval creates a bottleneck, compare queue wait and reviewer minutes after a narrowly scoped workflow change. Keep the same control requirements and record any failed mandatory checks. If access failure causes abandonment, exercise the access prerequisites with a developer who is new to the tooling before widening the pilot.

Report adoption with the eligible population and response rates beside survey scores. Follow up with respondents who experienced both fluent and blocked workflows. A sample composed mostly of template maintainers can miss the problems seen by new teams. Ask about a task the developer just attempted and request the specific point where they became blocked. Then confirm that the next proposed intervention has a measurable completion condition.

Record who owns the next test, which services are included and what evidence would reverse the decision. Repeat the checks after modernization of shared runners, policies or runtime contracts. The documentation for the next reader should include what was tried, under which operating conditions, and which changes should be evaluated separately. [DORA platform engineering guidance](https://dora.dev/capabilities/platform-engineering/)
