---
title: "Implementing SLOs and Error Budgets: From Reliability Theater to Working Contract"
description: "Most SLO initiatives produce dashboards nobody consults and budgets nobody spends. How to pick SLIs that reflect users, set targets you can defend, wire burn-rate alerts that beat threshold paging, and make the error budget an actual decision instrument."
date: 2027-08-16
tags: ["Reliability", "Observability", "Platform Engineering", "Engineering Leadership"]
format: article
---

Service Level Objectives are the most adopted-in-name, least adopted-in-practice idea in modern operations. Some organizations have *something* called an SLO — usually a dashboard created during a past reliability push, displaying a number like 99.9% next to a graph nobody has consulted since. Meanwhile the on-call rotation still pages on CPU thresholds, and the release-versus-reliability argument is still settled by whoever escalates loudest.

The gap isn't conceptual — the concept fits in a paragraph. It's that SLOs only produce value at the last step, when the error budget changes actual decisions, and most implementations stop three steps earlier. Here's the full path.

## The concept, in one paragraph

An **SLI** is a measurement of user-experienced service health, expressed as a ratio of good events to total events (successful requests / all requests; fast-enough requests / all requests). An **SLO** is a target for that ratio over a window (99.9% over 28 days). The **error budget** is the complement — the 0.1%, the quantity of failure you're *allowed* — and it converts reliability from a virtue into a resource: something you can measure the consumption of, spend deliberately on risky changes, and defend when it runs low. Everything operationally interesting about SLOs happens because failure became a budget instead of a sin.

## Step one: SLIs that measure users, not servers

The classic failure is instrumenting what's easy — host CPU, pod restarts, queue depth — and calling it an SLI. Users don't experience your CPU. The discipline: for each critical user journey (not each microservice — journeys), define good-versus-bad from the user's side of the interface. For a request-driven API, the workhorses are **availability** (successful eligible outcomes / eligible attempts, measured at a boundary that captures user-visible failure, with explicit treatment of client errors and timeouts) and **latency** ("requests faster than 400 ms / all requests" — as a good-event ratio, which composes with the budget math, rather than a p95 statistic, which doesn't). For pipelines: **freshness** (data younger than N minutes at consumption / all reads) and **completeness**. For anything with correctness stakes: a **quality** SLI, even a proxy one.

Start with a small number of SLIs per journey that cover its distinct user needs. Ten SLIs per service is a metrics catalog, not an objective — and the surest sign a team skipped the "which failures do users actually feel?" conversation, which is the valuable part of the whole exercise.

## Step two: targets you can defend, windows that fit decisions

The target-setting failure mode is aspiration: someone declares 99.99% because it sounds professional, without noticing that's four minutes of monthly unavailability — a bar their single-region architecture and 30-minute human response time cannot mathematically clear. Set targets from **measured baseline** (run the SLI for a month first; if reality is 99.5%, compare that baseline with user needs and fund any necessary gap rather than declaring a higher target without a plan) and from **user tolerance** (what does the journey actually require? Checkout and search have different stakes; internal batch tooling different again). Additional reliability can require substantial and uneven investment; there is no universal tenfold engineering-cost law — redundancy, automation, faster detection — and that cost should be a conscious purchase, not a slide-deck flourish.

A **28-day rolling window** is one possible operating choice; calendar windows can also fit reporting or contractual needs. Define how the window affects decisions. In a simplified model requiring six independent successful calls, each with a 99.9% success probability, their product is about 99.4015%. That calculation is not a general prediction for a service graph: correlated failures, retries, optional dependencies and different populations change the relationship. Measure the user journey directly and use composition models only with stated assumptions.

## Step three: burn-rate alerting — the operational payoff

Here's where SLOs stop being reporting and start being operations. Naive threshold alerting ("page if error rate > 1%") is simultaneously too twitchy (a 90-second blip pages a human at 3 AM for something that consumed 0.1% of budget) and too slow (a 0.9% error rate sustained for a week quietly torches the whole budget without ever crossing the line). **Burn-rate alerting** fixes both by alerting on *budget consumption velocity*: a burn rate of 1 means you're consuming exactly your budget; 14.4 means approximately 1.94 days to consume a full 28-day budget under steady-rate assumptions. The standard implementation — **multi-window, multi-burn-rate** — pages on fast burns over short windows (14.4× over 1 hour: something is on fire *and it matters*), tickets on slow burns over long windows (1–2× over three days: a leak worth fixing this week, not tonight), and requires both a long and short window to agree before firing, which can reduce transient alerts when the windows are chosen and tested carefully.

A migration to burn-rate alerts should test whether it produces **fewer irrelevant pages and clearer response actions** — because the alert definition now literally encodes "user-visible harm accumulating faster than agreed." That property is also the strongest weapon against alert fatigue, which is the actual reliability killer in most organizations.

## Step four: the budget as a decision instrument (or: the part everyone skips)

An error budget nobody consults is a graph. The implementations that work wire it into three standing decisions. **Release posture:** budget healthy → ship at will, spend some on chaos experiments and risky migrations; budget burning → releases need more scrutiny; budget exhausted → feature releases pause in favor of reliability work — *by pre-agreed policy signed by product and engineering leadership before the first breach*, because negotiating it during the breach reliably produces the loudest-voice outcome the SLO was meant to replace. **Prioritization:** recurring budget drains become the reliability backlog's ranking function — the SLO tells you which debt actually harms users, which is precisely the information "we should fix tech debt" arguments always lacked. **Review cadence:** a monthly look at budget consumption, near-misses, and whether the SLO still matches user expectations — SLOs are living contracts; a consistently met or breached target should be reviewed against user needs, architecture, measurement quality, and funding.

Start small and concrete: **one critical user journey, two SLIs, a defensible target, burn-rate paging, and a signed budget policy** — run that loop for a quarter until the team trusts it, then expand. The anti-pattern is the org-wide SLO mandate that generates four hundred objectives in a quarter, none load-bearing.

The cultural shift underneath is the real product: reliability stops being an unbounded moral obligation ("never break") and becomes an engineered, negotiated quantity ("this reliable, at this cost, and here's the meter"). That reframe is what lets teams ship fast *and* sleep — not because the tension between velocity and stability disappeared, but because it finally has a currency, a meter, and a contract governing how it gets spent.

## Write the denominator as carefully as the target

Consider a fictional checkout service. A qualifying event is a checkout attempt accepted at the public service boundary, excluding explicitly identified load-test traffic. A good event completes successfully within the agreed latency threshold and returns a usable result. The definition says how duplicate retries, client cancellations, malformed requests, and dependency failures are counted. Without these decisions, two teams can report different availability from the same traffic and both believe their queries are correct.

Do not exclude failures merely because they occurred outside the application process. A gateway timeout can be a user-visible failure even when the application never increments its request counter. Conversely, a deliberately rejected invalid request should not necessarily consume the same budget as a valid checkout that fails. Agree on eligibility and publish examples. Track excluded traffic separately so an instrument or policy change cannot silently make the service look healthier.

A request-based objective weights busy periods more heavily than quiet periods. A time-based availability objective weights equal time intervals equally. Neither is automatically wrong, but they answer different questions. State the measurement location, event population, window, threshold, and missing-data behavior in the SLI definition. A dashboard title containing only 99.9% cannot communicate these choices.

## A complete budget calculation

The chart uses a synthetic completed 28-day window with 2,000,000 eligible events and a 99.9% target. The allowed bad-event count is 2,000,000 × 0.001 = 2,000. Suppose 1,200 events were bad. Observed success is 99.94%; 60% of the error budget was consumed and 800 bad events remain relative to that fixed population. The chart compares 2,000 allowed, 1,200 consumed, and 800 remaining. These values are exercise inputs, not customer results.

In a live rolling window, both the event count and the historical failures change as events enter and leave. The remaining count is therefore not a fixed entitlement to cause 800 more failures tomorrow. A traffic surge changes the denominator, and an old incident aging out changes the consumed portion. Show the observation window and event volume alongside the percentage so readers understand the movement.

For a 99.9% objective, the allowed bad-event fraction is 0.001. A measured bad-event fraction of 0.0144 corresponds to a burn rate of 14.4. With steady traffic and a constant fraction, a full 28-day budget would be exhausted in 28 / 14.4 = about 1.94 days. This projection assumes comparable event volume over time; a request-based budget under strongly varying traffic needs event-volume context.

The commonly cited 14.4 threshold corresponds to consuming 2% of a 30-day budget in one hour under the usual steady-rate approximation. For a 28-day window, the analogous calculation is 0.02 × 28 × 24 / 1 = 13.44. Choose the consumption fraction and detection window first, then calculate the threshold. Copying a table without its window assumptions produces a policy that differs from its label.

## A worksheet for alert behavior

Create a small fixture with timestamped eligible and bad-event counts. Include steady healthy traffic, a short intense failure, a long mild failure, no traffic, and missing telemetry. Calculate the long-window and short-window burn rates independently, then apply the chosen conjunction. The short window helps confirm that the problem is still active; the long window establishes meaningful accumulated impact. It does not guarantee the absence of flapping.

Specify what zero eligible events means. Returning zero errors by dividing an empty population is not evidence of health. A low-traffic service may need synthetic checks, longer windows, or a separate alert for its critical operation. Missing monitoring data also needs its own state: treating it as success can hide the failure of the measurement system exactly when the service is unreachable.

Replay an incident fixture and record when each alert fires and resolves. Ask whether the responder still has time to change the outcome and whether the alert routes to someone with a safe action. A mathematically correct alert can be operationally useless if its runbook only says to watch a dashboard. Include a drill in which the dependency is unavailable and the application itself remains healthy, because ownership of mitigation may cross team boundaries.

## Make reliability policy specific enough to use

Write the policy before a breach. Identify the accountable service owner, product decision-maker, measurement source, and review cadence. Define which changes continue during an exhausted budget: an urgent security repair, a reliability fix, and a routine feature release need not have the same treatment. A blanket freeze that prevents repairing the service can be counterproductive. Record exceptions and their rationale rather than negotiating them invisibly.

Budget health is one input to risk decisions. A large remaining budget does not authorize unsafe experiments, data loss, or disregard for individual users. A service can meet a global ratio while one tenant or region experiences unacceptable harm. Inspect meaningful segments and separate data-integrity or security obligations that cannot be expressed as an expendable count of failed requests.

Use recurring budget consumption to prioritize investigation, then consider effort, risk, and available remedies. The largest incident by total errors may have a different prevention cost from a small recurring defect. A useful review compares the proposed change with the failure mechanism it addresses and the evidence that would show improvement. Avoid turning one noisy metric into the entire engineering strategy.

## Validate composition instead of multiplying blindly

Multiplying six independent 99.9% success probabilities yields approximately 99.4015% for an operation that requires all six to succeed. That is a simplified model, not a direct prediction for an arbitrary microservice graph. Failures can be correlated, retries can recover some attempts while increasing load, dependencies can be optional, and the measured populations may differ. Shared infrastructure often makes independence particularly implausible.

Draw one real user journey and identify synchronous requirements, fallbacks, caches, and asynchronous work. Use traces and failure exercises to determine which dependency failures actually become bad user events. Then set internal objectives and timeouts consistent with the journey. This is more informative than assigning every service the same number and assuming the end-to-end result follows automatically.

The first operating review should show the SLI contract, a reproducible query or worksheet, telemetry coverage, tested alert behavior, and one decision changed by the evidence. Publish the limitations as part of the methodology. That gives readers a way to challenge the numbers constructively and gives the team a reason to keep the objective alive after the dashboard launch.

## Primary references

- [Google SRE Workbook: implementing SLOs](https://sre.google/workbook/implementing-slos/)
- [Google SRE Workbook: alerting on SLOs](https://sre.google/workbook/alerting-on-slos/)
