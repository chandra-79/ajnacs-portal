---
title: "Implementing SLOs and Error Budgets: From Reliability Theater to Working Contract"
description: "Most SLO initiatives produce dashboards nobody consults and budgets nobody spends. How to pick SLIs that reflect users, set targets you can defend, wire burn-rate alerts that beat threshold paging, and make the error budget an actual decision instrument."
date: 2025-03-06
tags: ["Reliability", "Observability", "Platform Engineering", "Engineering Leadership"]
format: article
---

Service Level Objectives are the most adopted-in-name, least adopted-in-practice idea in modern operations. Nearly every engineering organization now has *something* called an SLO — usually a dashboard created during a past reliability push, displaying a number like 99.9% next to a graph nobody has consulted since. Meanwhile the on-call rotation still pages on CPU thresholds, and the release-versus-reliability argument is still settled by whoever escalates loudest.

The gap isn't conceptual — the concept fits in a paragraph. It's that SLOs only produce value at the last step, when the error budget changes actual decisions, and most implementations stop three steps earlier. Here's the full path.

## The concept, in one paragraph

An **SLI** is a measurement of user-experienced service health, expressed as a ratio of good events to total events (successful requests / all requests; fast-enough requests / all requests). An **SLO** is a target for that ratio over a window (99.9% over 28 days). The **error budget** is the complement — the 0.1%, the quantity of failure you're *allowed* — and it converts reliability from a virtue into a resource: something you can measure the consumption of, spend deliberately on risky changes, and defend when it runs low. Everything operationally interesting about SLOs happens because failure became a budget instead of a sin.

## Step one: SLIs that measure users, not servers

The classic failure is instrumenting what's easy — host CPU, pod restarts, queue depth — and calling it an SLI. Users don't experience your CPU. The discipline: for each critical user journey (not each microservice — journeys), define good-versus-bad from the user's side of the interface. For a request-driven API, the workhorses are **availability** (non-5xx responses / all responses, measured at the load balancer or gateway, *not* inside the service — a service that's down reports nothing from inside) and **latency** ("requests faster than 400 ms / all requests" — as a good-event ratio, which composes with the budget math, rather than a p95 statistic, which doesn't). For pipelines: **freshness** (data younger than N minutes at consumption / all reads) and **completeness**. For anything with correctness stakes: a **quality** SLI, even a proxy one.

Two or three SLIs per journey is the right number. Ten SLIs per service is a metrics catalog, not an objective — and the surest sign a team skipped the "which failures do users actually feel?" conversation, which is the valuable part of the whole exercise.

## Step two: targets you can defend, windows that fit decisions

The target-setting failure mode is aspiration: someone declares 99.99% because it sounds professional, without noticing that's four minutes of monthly unavailability — a bar their single-region architecture and 30-minute human response time cannot mathematically clear. Set targets from **measured baseline** (run the SLI for a month first; if reality is 99.5%, your first SLO is 99.5% — an honest floor to defend, tightened deliberately later) and from **user tolerance** (what does the journey actually require? Checkout and search have different stakes; internal batch tooling different again). Every nine costs roughly 10× the engineering of the previous one — redundancy, automation, faster detection — and that cost should be a conscious purchase, not a slide-deck flourish.

Use a **28-day rolling window** as the default (calendar months make budgets reset weirdly mid-incident; rolling windows keep pressure continuous), and expect the composite math to surprise stakeholders: a journey touching six services each at 99.9% delivers roughly 99.4% — which is the argument, made with arithmetic instead of adjectives, for fewer synchronous hops and for setting inter-service objectives above user-facing ones.

## Step three: burn-rate alerting — the operational payoff

Here's where SLOs stop being reporting and start being operations. Naive threshold alerting ("page if error rate > 1%") is simultaneously too twitchy (a 90-second blip pages a human at 3 AM for something that consumed 0.1% of budget) and too slow (a 0.9% error rate sustained for a week quietly torches the whole budget without ever crossing the line). **Burn-rate alerting** fixes both by alerting on *budget consumption velocity*: a burn rate of 1 means you're consuming exactly your budget; 14.4 means you'll exhaust a 28-day budget in two days. The standard implementation — **multi-window, multi-burn-rate** — pages on fast burns over short windows (14.4× over 1 hour: something is on fire *and it matters*), tickets on slow burns over long windows (1–2× over three days: a leak worth fixing this week, not tonight), and requires both a long and short window to agree before firing, which kills flapping.

Teams that migrate paging from raw thresholds to burn rates report the same two outcomes: **fewer pages, and each page meaningful** — because the alert definition now literally encodes "user-visible harm accumulating faster than agreed." That property is also the strongest weapon against alert fatigue, which is the actual reliability killer in most organizations.

## Step four: the budget as a decision instrument (or: the part everyone skips)

An error budget nobody consults is a graph. The implementations that work wire it into three standing decisions. **Release posture:** budget healthy → ship at will, spend some on chaos experiments and risky migrations; budget burning → releases need more scrutiny; budget exhausted → feature releases pause in favor of reliability work — *by pre-agreed policy signed by product and engineering leadership before the first breach*, because negotiating it during the breach reliably produces the loudest-voice outcome the SLO was meant to replace. **Prioritization:** recurring budget drains become the reliability backlog's ranking function — the SLO tells you which debt actually harms users, which is precisely the information "we should fix tech debt" arguments always lacked. **Review cadence:** a monthly look at budget consumption, near-misses, and whether the SLO still matches user expectations — SLOs are living contracts; a target that's never threatened is probably too loose, one that's always breached is either dishonest or underfunded.

Start small and concrete: **one critical user journey, two SLIs, a defensible target, burn-rate paging, and a signed budget policy** — run that loop for a quarter until the team trusts it, then expand. The anti-pattern is the org-wide SLO mandate that generates four hundred objectives in a quarter, none load-bearing.

The cultural shift underneath is the real product: reliability stops being an unbounded moral obligation ("never break") and becomes an engineered, negotiated quantity ("this reliable, at this cost, and here's the meter"). That reframe is what lets teams ship fast *and* sleep — not because the tension between velocity and stability disappeared, but because it finally has a currency, a meter, and a contract governing how it gets spent.
