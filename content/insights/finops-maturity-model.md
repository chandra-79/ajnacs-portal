---
title: "Assess FinOps Maturity by the Decisions It Improves"
description: "Apply Crawl, Walk and Run to individual capabilities, assess evidence of adoption, and track a practical improvement worksheet."
date: 2027-11-10
tags: ["FinOps", "Cloud Architecture"]
format: article
---

The FinOps Foundation's Crawl/Walk/Run maturity model is one of the cleaner frameworks in the space — but it obscures more than it reveals about where programs actually get stuck.

## Stage 1 — Crawl: The Dashboard Phase

Most organizations enter FinOps with a visibility problem. They can't see what they're spending. An initial visibility effort may include:

- Getting a cost management tool deployed (AWS Cost Explorer, Azure Cost Management, CloudHealth, etc.)
- Implementing tagging — or retroactively cleaning up the absence of it
- Getting the first showback report to engineering leads

This stage feels like progress because visibility is genuinely valuable. The risk is mistaking visibility for action. A dashboard showing you're overspending is not the same as a process that reduces it.

One possible barrier is that FinOps is owned by a centralised platform or finance team, with no engineering accountability mechanism.

## Stage 2 — Walk: Where Most Programs Actually Stall

The Walk stage is where FinOps becomes genuinely difficult — not technically, but organisationally.

Walking requires:
- **Engineering teams owning cost as a metric** — not just observing it
- **Unit economics defined and tracked** — cost per user, cost per transaction, cost per API call
- **RI/savings plan decisions made on evidence** — utilization analysis before commitment, not after
- **Regular optimization cycles** — not a one-time right-sizing project, but a quarterly practice

The fix is ownership, not tooling. You need cost as a first-class engineering metric — same status as latency, availability, and error rate. Until it is, Walking stays theoretical.

## Stage 3 — Run: The Discipline of Continuous Optimisation

Running organizations treat FinOps as a living practice, not a programme. What distinguishes them:

- **Timely cost alerting aligned with data availability** integrated with squad-level dashboards
- **Automated rightsizing** for non-critical compute based on utilization data
- **FinOps in the architecture review process** — cost modelling at design time, not post-deployment
- **Feedback loops** — engineers see cost effects with a documented reporting delay

## The Transition That Matters Most

One useful transition to examine is the move from visibility (Crawl) to ownership (Walk).

The technical work is tractable. The harder problem is cultural: persuading engineering teams that cloud cost is their problem, not finance's — and that solving it makes their systems better, not just cheaper.

That argument is easiest to make when you can show what over-provisioned infrastructure actually delays: deployment speed, incident response, architectural flexibility. Cost efficiency and operational excellence are usually the same conversation.

*Questions about building a FinOps practice that sticks? [Let's talk.](/contact/)*

## Assess a capability rather than awarding a company label

The FinOps Foundation's maturity guidance is applied to capabilities and activities. An organization can have a reliable allocation process and an immature forecasting process at the same time. It also explicitly cautions against pursuing the highest maturity label for every capability regardless of business value. Treat the labels as a way to discuss investment, not a league table.

A useful assessment begins with the decision the capability is supposed to support. For allocation, can a service owner explain and challenge the assigned cost? For anomaly management, does an unusual movement reach someone who can investigate it while the evidence is still useful? For rate optimization, can the team show how purchased commitments relate to eligible demand and future plans? These questions are more actionable than asking whether the whole company is walking or running.

## Work through a small improvement portfolio

Consider a fictional practice with three candidate improvements. Resolving unknown resource ownership is estimated at 20 engineering hours and would make $4,000 of monthly cost attributable. Adding an automated forecast report takes 40 hours and removes four hours of monthly manual preparation. Building a near-real-time anomaly pipeline takes 100 hours, while current daily reports already catch the service's observed cost events within the response requirement.

These benefits use different units and should not be ranked by adding them together. The figure compares estimated implementation hours only. The decision worksheet retains the outcome and limitation beside each estimate. Attribution does not itself save $4,000, and removing four hours of preparation is not the same as reducing the cloud bill. The anomaly project may be valuable later, but its higher sophistication is not evidence of present need.

Choose one improvement whose current failure has an identifiable consequence. If a service cannot decide whether to retire a resource because ownership is unknown, improving the catalog join may unblock a concrete action. If the forecast report already supports the planning cycle, automating it is primarily a labor and reliability decision. Explain why the selected work matters before assigning a maturity target.

## Define evidence for the next review

For ownership, measure the cost and age of unresolved lines using the same export and rule version. For reporting automation, record preparation time, correction rate and whether the report arrives in time for the actual decision. For anomaly response, record the time from a sufficiently complete signal to an investigated classification. Avoid optimizing freshness of an incomplete bill at the expense of misleading alerts.

Set a review window that covers the relevant business cycle. A monthly commitment review cannot be evaluated after two quiet days. Preserve the baseline and record changes in demand, organization or provider data that affect comparability. Report an inconclusive result when the observation is insufficient. A capability does not become mature because a target was written in a planning document.

## Keep the operating model visible

Document who supplies evidence, who decides and who implements changes. An engineering owner may need finance to explain cost recognition and procurement to explain flexibility in a contract. A central FinOps team can coordinate those roles without becoming the sole owner of every service decision. Make escalation explicit for costs that cross team boundaries.

Include exception handling. A shared recovery service may remain deliberately overprovisioned relative to everyday demand. A cost line may be temporarily unallocated because a provider identifier changed. A useful process can explain those exceptions and revisit them. Forcing every item into a simplistic score can hide the very cases where expert judgment is needed.

## A practical assessment workshop

Select one service and three capabilities. For each, bring an actual recent decision, the evidence used, the person accountable and the observed result. Identify one failure or delay in that chain. Write an improvement that removes that specific obstacle, estimate the work and define how the next decision will be better.

Review the proposed work with people who consume the output. A more detailed report is not useful if it arrives after a budget decision or cannot be reconciled to the invoice. A sophisticated optimization engine is not useful if its recommendations lack a safe implementation path. The workshop should finish with a short investment decision and a measurement plan, not an average maturity score detached from outcomes.

### Figure methodology

Synthetic planning estimates. Bars compare implementation effort only. Benefits differ in kind: attribution, manual effort and response speed. No cost saving or maturity ranking is inferred from these values.

| Worked observation | engineering hours |
| --- | ---: |
| Resolve owner mapping | 20 |
| Automate forecast report | 40 |
| Faster anomaly pipeline | 100 |

## Primary references and further study

- [FinOps Foundation maturity model](https://www.finops.org/framework/maturity-model/)
- [FinOps allocation capability](https://www.finops.org/framework/capabilities/allocation/)
- [FinOps unit economics](https://www.finops.org/framework/capabilities/unit-economics/)
