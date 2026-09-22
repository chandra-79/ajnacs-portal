---
title: "The Real Cost of Technical Debt: How to Measure It and When to Pay It Down"
description: "Technical debt is real but often argued about in vague terms. The conversations that get debt prioritized are the ones that translate it into concrete cost: slower delivery, higher incident rates, longer onboarding time."
date: 2026-12-11
tags: ["Engineering Leadership", "Architecture"]
format: article
---

Technical debt is one of those concepts that engineering leaders use frequently and business stakeholders hear skeptically. This is partly because "we need to pay down technical debt" is sometimes accurate and sometimes a euphemism for "we want to rewrite something we don't like." Telling them apart requires being concrete about what the debt actually costs.

The engineering teams that consistently get technical debt prioritized are the ones who can answer: what does this cost us right now, and what will it cost us if we don't address it?

## What technical debt actually is

Ward Cunningham's original metaphor was specific: technical debt is the difference between the code you wrote to ship quickly and the code you would write with full understanding of the problem. Like financial debt, it carries interest — the ongoing cost of working with the suboptimal code.

The metaphor has since been extended to cover things that are also real problems but are slightly different in character: outdated dependencies (obsolescence debt), poor test coverage (testing debt), complex and unmaintained infrastructure (infrastructure debt), missing documentation (knowledge debt). These are all worth addressing, but they accrue and compound differently.

The common thread: they impose ongoing costs on engineering work that would not exist if the codebase were in better shape.

## The costs that are measurable

**Delivery velocity impact**: how much longer does it take to ship a feature in an area with significant debt compared to a clean area? If it takes two weeks to safely add a feature to a legacy component that would take two days in a well-structured service, the debt is costing you 8 engineering-days per feature. With five features per quarter in that area, you are losing 40 engineering-days — approximately 2 engineer-months — to the debt annually.

**Incident rate**: technical debt areas correlate with higher incident rates. If a legacy service has 3x more incidents than comparable services, the investigation, response, and remediation time attributable to that debt is measurable. Pull incident data, filter by service, multiply by average time-to-resolution.

**Onboarding cost**: how long does it take a new engineer to be productive in a heavily indebted area versus a well-documented, clean area? If it takes 3 months to become productive in one system versus 3 weeks in another, that is a real cost to every hire that works in that system.

**Developer experience drag**: harder to measure precisely but reflected in retention and productivity metrics. Engineers who spend significant time on workarounds, fighting the codebase, and managing symptoms rather than solving problems are less productive and more likely to leave. If one team's attrition is systematically higher than comparable teams, the quality of the codebase is worth investigating as a contributing factor.

## Categorizing debt by urgency

Not all technical debt has the same priority. The framework worth using:

**High urgency (address in current quarter)**:
- Debt that is actively causing incidents
- Debt that is blocking specific high-value work
- Security vulnerabilities in components that cannot be patched without rework

**Medium urgency (plan for next 1-2 quarters)**:
- Debt that slows delivery in a high-velocity area by more than 30%
- Dependencies approaching end-of-life
- Testing gaps in high-risk business logic

**Low urgency (keep on the backlog, address opportunistically)**:
- Code style inconsistencies
- Refactoring opportunities that don't affect velocity or reliability
- Documentation gaps in stable, rarely-changed areas

The prioritization criteria: how much is this costing us now, and how much worse will it get if left unaddressed? Debt that is expensive today and getting more expensive deserves urgent attention. Debt that is mildly annoying and stable can wait.

## Making the case for debt work

The conversation that gets debt prioritized is not "this code is messy and it bothers us." It is:

"Over the last two quarters, we have spent approximately 6 engineer-weeks dealing with incidents in Service X. Our analysis of those incidents traces a majority of them to the same architectural limitation. We estimate that addressing this will cost 4 weeks of engineering time and will reduce incident-related work in this area by 70%, freeing up roughly 4 engineer-weeks per quarter going forward. Payback period: approximately two quarters."

This is a business argument, not a technical one. It has a cost, a benefit, and a timeline. It is the kind of argument that engineering managers and product leaders can evaluate on its merits.

*Prioritizing a technical debt backlog or making the case for remediation work to non-technical stakeholders? [Happy to compare approaches for your specific context.](/contact)*
