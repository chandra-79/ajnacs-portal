---
title: "Technical Debt Triage: A Framework for Prioritising What to Actually Fix"
description: "All technical debt is not equal. The debt that's slowing down delivery is different from the debt that's creating risk, which is different from the debt that's just aesthetically unpleasant. Here's how to categorise and prioritize it so that 'paying down tech debt' becomes a concrete engineering investment with visible returns."
date: 2026-12-04
tags: ["Engineering Leadership", "Architecture", "Programming"]
format: article
---

"Technical debt" covers too wide a range of things to be useful as a planning category. A spaghetti module that takes three times as long to extend as it should is technical debt. A dependency with a known security vulnerability is technical debt. A test suite that passes but doesn't catch real regressions is technical debt. Undocumented tribal knowledge about why a component works the way it does is technical debt.

These have different severity, different urgency, and different remediation approaches. The first step in managing technical debt is acknowledging that it's not a homogeneous backlog.

## Four categories that require different responses

**Delivery friction debt**: code and process that slows engineers down. Overly complex modules, poor test coverage that makes changes feel risky, flaky CI that requires multiple retries, manual steps in deployment, poor local development experience.

This debt has a direct, measurable cost — engineer time. It's often the highest-priority category because it compounds: the slower engineers move, the more the backlog grows, the more corners get cut, and the more debt accumulates. The prioritisation signal: if engineers mention the same area repeatedly in retrospectives, that's delivery friction debt.

**Risk debt**: code and dependencies that create reliability, security, or compliance risk. Unsupported dependencies with known vulnerabilities. Services without adequate monitoring. Infrastructure without backup strategies. Poorly-tested critical paths.

Risk-related weaknesses can affect assurance and operations before an incident, as well as create potential incident costs. The prioritisation signal: security audit findings, incident post-mortems that point to structural issues, and dependency vulnerability reports.

**Scalability debt**: code and architecture that works now but has identifiable limits. A database query that's fast at current data volumes but will be slow at 10x. An in-process cache that won't work with more than one instance. An API design that doesn't support pagination for collections that will grow.

Scalability debt is low urgency until it isn't. The prioritisation signal: growth projections and architectural review. The right time to address scalability debt is before it becomes a crisis — a planned refactoring during normal development is much cheaper than an emergency migration under load.

**Quality debt**: code that works but is poorly structured, poorly documented, or inconsistently implemented. Inconsistent error handling. Duplicated logic. Business rules implemented in multiple places with minor variations.

Structural and documentation weaknesses can affect delivery, correctness, and operations; their actual consequence determines urgency. It's the category most often cited in "we should pay down tech debt" conversations and most often the least urgent. The prioritisation signal: it causes problems when you need to change it. Don't refactor it until you're in that area changing something anyway.

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
Low impact, low effort (score 1 when both are rated 1): do these opportunistically — when you're in the area anyway.
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

A more structured approach: examine your velocity data. Measure active effort and waiting in the affected workflow. Story-point shares do not establish time saved or a causal return from remediation. Make the business case in those terms, not in abstract quality terms.

The things that don't require separate allocation: debt that you address incidentally while changing a component anyway. Sonar's "boy scout rule" — leave the code better than you found it — can improve maintainability but still requires review, testing, and scope control. Make it a code review norm: changes to an area should include minor debt cleanup in that area.

The things that require explicit allocation: large refactorings, dependency upgrades, architectural changes. These won't happen organically. They need to be on the roadmap with committed capacity.

*Building a tech debt strategy for an engineering organization or trying to make the case for debt investment? [Happy to compare approaches.](/contact)*

## Turn a debt label into an observable condition

A useful debt item describes a mechanism and consequence. “The billing module is messy” does not establish a priority. “Adding a tax rule requires changing four duplicated implementations, and two recent changes left them inconsistent” identifies a concrete problem. Link the relevant changes, tests, or incidents. Separate the observed consequence from a forecast of what might happen next.

Record the affected workflow and its frequency. A painful task performed once a year may deserve less capacity than a moderate inconvenience repeated daily, unless its risk is much higher. Also record who bears the cost. A change that saves application-team effort while adding more platform support is a transfer, not necessarily a net improvement. Include both sides before comparing options.

Security and reliability obligations may override a convenience ranking. A confirmed exploitable vulnerability or an imminent support deadline cannot be treated as merely another item in an aesthetic cleanup list. Use the organization's established risk process to determine urgency. The debt register should connect to that process rather than invent a competing severity scale.

## Worked example: compare recurring friction with repair effort

Consider a hypothetical deployment step performed twelve times per month. Each execution takes twenty minutes of active operator effort, totaling 240 minutes. A proposed automation reduces the operator step to five minutes, totaling sixty minutes. The chart compares those monthly values. The direct reduction is 180 minutes, or three hours per month, before maintenance and exception handling.

If the automation requires eighteen hours to implement, the simple effort payback is eighteen divided by three, or six months. This is synthetic arithmetic, not a measured return or a reason to automate automatically. If upkeep consumes one hour per month, the net recurring reduction becomes two hours and the simple payback becomes nine months. If the workflow will be retired in four months, the effort case changes again.

The model does not price reliability benefits or risks. Automation might reduce a dangerous manual error, or it might amplify a mistake across many systems. Test the failure behavior and access scope. A controlled pilot should preserve a manual recovery path and demonstrate that retries do not repeat an unsafe side effect. The decision depends on the mechanism as well as the time calculation.

## Use scores as prompts, not arithmetic truth

An impact score of three is not necessarily three times the value of a score of one. These are ordinal categories unless the team has defined a defensible quantitative scale. Dividing impact by effort can organize discussion, but the resulting number is not a financial return. Two items with the same score may have different deadlines, dependencies, or consequences.

Keep a separate field for mandatory work and time-sensitive risk. Then compare discretionary improvements using evidence and ranges. A rough effort estimate can be useful if its uncertainty is visible. An unknown dependency may justify a small investigation before committing a quarter of capacity. Do not reward an item for having an unrealistically low estimate simply because the formula produces a larger score.

Review items that remain unselected. Some should be closed because the affected system is being retired or the original concern is no longer relevant. Others need a different decomposition. A large refactor can sometimes become a sequence of smaller changes with independent benefits, while some architectural work genuinely requires a coordinated investment. The register should help distinguish those cases.

## A debt-item worksheet

Write the condition, evidence, affected workflow, recurrence, consequence, proposed options, estimated effort, and verification method. Include doing nothing for a defined period as an explicit option when acceptable. State what would trigger reconsideration: a growth threshold, a repeated incident, an approaching support deadline, or a planned feature that touches the component.

For a test gap, the verification might be a test that fails under a seeded defect and passes under the intended behavior. For a query problem, it might be a repeatable workload showing acceptable latency and resource use. For missing operational knowledge, it might be another authorized engineer completing a recovery rehearsal from the runbook. “Code looks cleaner” can be valuable feedback, but it is insufficient evidence for a claimed operational benefit.

Assign an accountable owner and reserve actual capacity. A high-priority item without time or a dependency decision is not scheduled work. If the team cannot staff it, escalate the tradeoff rather than leaving a misleading due date in the register. After completion, compare the outcome with the original expectation and record unexpected costs.

## Avoid cleanup that expands the change risk

Improving nearby code while making a feature change can be sensible, but it is not free. A broad refactor can obscure the behavior being reviewed and make rollback harder. Separate mechanical restructuring from functional changes where that improves understanding. Keep tests and review focused on the invariants at risk.

The practical takeaway is to prioritize a specific cost or risk, not the emotional weight of the word debt. Preserve evidence, distinguish mandatory controls from discretionary improvements, and verify the result. A smaller backlog of well-defined decisions is more useful than hundreds of complaints carrying a numerical score nobody trusts.

## Sources and further reading

- [Architectural Decision Records · Motivation and definitions](https://adr.github.io/)
- [Microsoft Research · The SPACE of Developer Productivity](https://www.microsoft.com/en-us/research/publication/the-space-of-developer-productivity-theres-more-to-it-than-you-think/)
- [AWS · Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
