---
title: "The FinOps Maturity Model — Where Most Teams Actually Stall"
description: "The Crawl/Walk/Run framework is right. The transitions are harder than the model implies. Here's where most FinOps programs stall, and why."
date: 2027-11-10
tags: ["FinOps", "Cloud Architecture"]
format: article
---

The FinOps Foundation's Crawl/Walk/Run maturity model is one of the cleaner frameworks in the space — but it obscures more than it reveals about where programs actually get stuck.

I've worked with organizations that self-assessed as "Walking" and were functionally still Crawling. And a few that were more mature than their label suggested but had hit a ceiling they couldn't name. The model is right; the transitions are the hard part.

## Stage 1 — Crawl: The Dashboard Phase

Most organizations enter FinOps with a visibility problem. They can't see what they're spending. The first 60–90 days are usually spent on:

- Getting a cost management tool deployed (AWS Cost Explorer, Azure Cost Management, CloudHealth, etc.)
- Implementing tagging — or retroactively cleaning up the absence of it
- Getting the first showback report to engineering leads

This stage feels like progress because visibility is genuinely valuable. The risk is mistaking visibility for action. A dashboard showing you're overspending is not the same as a process that reduces it.

Teams that stay here indefinitely share a common characteristic: FinOps is owned by a centralised platform or finance team, with no engineering accountability mechanism.

## Stage 2 — Walk: Where Most Programs Actually Stall

The Walk stage is where FinOps becomes genuinely difficult — not technically, but organisationally.

Walking requires:
- **Engineering teams owning cost as a metric** — not just observing it
- **Unit economics defined and tracked** — cost per user, cost per transaction, cost per API call
- **RI/savings plan decisions made on evidence** — utilization analysis before commitment, not after
- **Regular optimization cycles** — not a one-time right-sizing project, but a quarterly practice

The stall I see most often: engineering teams receive cost visibility but not cost accountability. Leaders see the dashboard; engineers don't feel the number. The FinOps team runs optimization projects, but the savings evaporate within two quarters because the structural patterns that created the waste are still in place.

The fix is ownership, not tooling. You need cost as a first-class engineering metric — same status as latency, availability, and error rate. Until it is, Walking stays theoretical.

## Stage 3 — Run: The Discipline of Continuous Optimisation

Running organizations treat FinOps as a living practice, not a programme. What distinguishes them:

- **Real-time budget alerting** integrated with squad-level dashboards
- **Automated rightsizing** for non-critical compute based on utilization data
- **FinOps in the architecture review process** — cost modelling at design time, not post-deployment
- **Feedback loops** — engineers see the cost impact of their deployment decisions within 24 hours

The organizations I've seen reach this stage consistently have one thing in common: a senior engineering leader who treats cloud cost with the same seriousness as system reliability. When the CTO asks about cost efficiency in quarterly reviews, engineers care. When they don't, FinOps stays in a spreadsheet.

## The Transition That Matters Most

If I had to pick one transition to focus on, it's the move from visibility (Crawl) to ownership (Walk).

The technical work is tractable. The harder problem is cultural: persuading engineering teams that cloud cost is their problem, not finance's — and that solving it makes their systems better, not just cheaper.

That argument is easiest to make when you can show what over-provisioned infrastructure actually delays: deployment speed, incident response, architectural flexibility. Cost efficiency and operational excellence are usually the same conversation.

---

*Questions about building a FinOps practice that sticks? [Let's talk.](/contact)*
