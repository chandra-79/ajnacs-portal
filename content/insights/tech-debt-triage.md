---
title: "Technical Debt Triage: A Framework for Prioritising What to Actually Fix"
description: "All technical debt is not equal. The debt that's slowing down delivery is different from the debt that's creating risk, which is different from the debt that's just aesthetically unpleasant. Here's how to categorise and prioritize it so that 'paying down tech debt' becomes a concrete engineering investment with visible returns."
date: 2025-06-09
tags: ["Engineering Leadership", "Architecture", "Programming"]
format: article
---

"Technical debt" covers too wide a range of things to be useful as a planning category. A spaghetti module that takes three times as long to extend as it should is technical debt. A dependency with a known security vulnerability is technical debt. A test suite that passes but doesn't catch real regressions is technical debt. Undocumented tribal knowledge about why a component works the way it does is technical debt.

These have different severity, different urgency, and different remediation approaches. The first step in managing technical debt is acknowledging that it's not a homogeneous backlog.

## Four categories that require different responses

**Delivery friction debt**: code and process that slows engineers down. Overly complex modules, poor test coverage that makes changes feel risky, flaky CI that requires multiple retries, manual steps in deployment, poor local development experience.

This debt has a direct, measurable cost — engineer time. It's often the highest-priority category because it compounds: the slower engineers move, the more the backlog grows, the more corners get cut, and the more debt accumulates. The prioritisation signal: if engineers mention the same area repeatedly in retrospectives, that's delivery friction debt.

**Risk debt**: code and dependencies that create reliability, security, or compliance risk. Unsupported dependencies with known vulnerabilities. Services without adequate monitoring. Infrastructure without backup strategies. Poorly-tested critical paths.

Risk debt doesn't slow you down until it causes an incident — and then it's expensive. The prioritisation signal: security audit findings, incident post-mortems that point to structural issues, and dependency vulnerability reports.

**Scalability debt**: code and architecture that works now but has identifiable limits. A database query that's fast at current data volumes but will be slow at 10x. An in-process cache that won't work with more than one instance. An API design that doesn't support pagination for collections that will grow.

Scalability debt is low urgency until it isn't. The prioritisation signal: growth projections and architectural review. The right time to address scalability debt is before it becomes a crisis — a planned refactoring during normal development is much cheaper than an emergency migration under load.

**Quality debt**: code that works but is poorly structured, poorly documented, or inconsistently implemented. Inconsistent error handling. Duplicated logic. Business rules implemented in multiple places with minor variations.

Quality debt affects future velocity but rarely causes incidents or immediate slowdowns. It's the category most often cited in "we should pay down tech debt" conversations and most often the least urgent. The prioritisation signal: it causes problems when you need to change it. Don't refactor it until you're in that area changing something anyway.

## The prioritisation framework

A simple scoring model for each debt item:

**Impact if not addressed** (1-3):
- 1: Cosmetic or minor; unlikely to cause real problems
- 2: Noticeably affects delivery speed or carries moderate risk
- 3: Significant delivery friction, reliability risk, or security vulnerability

**Effort to remediate** (1-3):
- 1: A few hours to a day
- 2: A sprint (1-2 weeks)
- 3: A quarter-level initiative

**Priority score** = Impact / Effort

High impact, low effort (score 3): do these now, as part of normal sprint work.
High impact, high effort (score 1): plan for these as explicit engineering initiatives with dedicated time.
Low impact, low effort (score 1-3): do these opportunistically — when you're in the area anyway.
Low impact, high effort (score 0.33): rarely worth dedicated effort; revisit when impact increases.

## Making tech debt work visible

Tech debt that isn't tracked doesn't get addressed. A simple tracking approach:

- Maintain a tech debt register (a shared document or a tag in your issue tracker)
- Add items when discovered, with category, score, and affected component
- Review quarterly: what's gotten worse, what's been addressed incidentally, what needs an explicit investment
- Assign ownership per component or domain — the team that owns a component owns its debt register

The common failure: a debt register that grows but nothing gets closed. This usually means the prioritisation isn't working — high-effort items sit forever because there's never a "tech debt sprint", and low-effort items don't get done because they're not on anyone's radar.

## Allocating capacity for debt reduction

The "20% time for tech debt" guideline is a starting point, not a policy. The right allocation depends on the debt load and the delivery pressure.

A more structured approach: examine your velocity data. If 30% of story points are in areas with high delivery friction, fixing that friction is a capacity investment with measurable return — stories in those areas would take less time. Make the business case in those terms, not in abstract quality terms.

The things that don't require separate allocation: debt that you address incidentally while changing a component anyway. Sonar's "boy scout rule" — leave the code better than you found it — reduces debt continuously at near-zero overhead cost. Make it a code review norm: changes to an area should include minor debt cleanup in that area.

The things that require explicit allocation: large refactorings, dependency upgrades, architectural changes. These won't happen organically. They need to be on the roadmap with committed capacity.

*Building a tech debt strategy for an engineering organization or trying to make the case for debt investment? [Happy to compare approaches.](/contact)*
