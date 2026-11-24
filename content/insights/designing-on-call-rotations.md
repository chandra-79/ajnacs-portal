---
title: "Designing Sustainable On-Call: Coverage, Load, and Feedback"
description: "On-call is a system you design, not a hardship you distribute. Rotation structure, page-load budgets, compensation honesty, the follow-the-sun question, and the feedback loop that turns pages into engineering work instead of attrition."
date: 2027-10-20
tags: ["Reliability", "Engineering Leadership", "On-Call", "Platform Engineering"]
format: article
---

On-call is where an engineering organization's stated values meet its 3 AM reality. Companies that describe themselves as sustainable, learning-oriented, and blameless will nonetheless run rotations where the same two people absorb every page, nobody remembers why half the alerts exist, and the exit interviews cluster around the phrase "I couldn't sleep." The tell is treating on-call as a *burden to distribute fairly* rather than what it actually is: a **system with design parameters** — load, structure, escalation, compensation, feedback — that produce either a sustainable practice or a slow-motion attrition engine, depending on choices someone is responsible for.

Here are those parameters, and the settings that work.

## The load budget: on-call has an SLO too

Start with the number almost nobody writes down: **how many pages per shift is acceptable?** The teams that run on-call well treat page load as a budgeted quantity with alarms on the budget — a locally agreed target might specify a small number of actionable pages and rare overnight interruptions; a shift that exceeds its agreed threshold triggers not sympathy but *work*: alert review, reliability investment, or staffing decisions. Two corollaries with teeth. First, **every page must be actionable by the person paged** — if the response to an alert is "watch it" or "forward to the team that owns it," it isn't a page; it's a notification wearing a siren, and it belongs in a ticket queue or someone else's rotation. The single highest-leverage on-call improvement in most organizations remains deleting and demoting alerts (the burn-rate migration covered under SLO practice does much of this mechanically). Second, **track and publish load per shift** — pages, hours of interrupted sleep, weekend interventions — because unmeasured load distributes invisibly and unevenly, and the person silently absorbing it is usually your most conscientious engineer, right up until their resignation surprises you.

## Structure: rotations, depth, and the ownership question

**Rotation size:** calculate qualified coverage, primary and secondary duty, leave, and recovery time for the service. No single team-size range guarantees sustainability. Teams too small to staff a rotation shouldn't run one alone — merge rotations with adjacent teams over a shared service surface, or question whether the service tier justifies paging at all.

**Depth:** a primary/secondary structure with explicit escalation timers (primary has 5–10 minutes to acknowledge before secondary pages) protects against the single point of failure that is one human's phone, and doubles as the mentorship channel — new joiners ride secondary for a cycle or two before taking primary, converting on-call onboarding from hazing into apprenticeship. Beyond secondary, escalation goes to a *named* incident-command or leadership chain, not to "whoever's around."

**The ownership question — "you build it, you run it" versus a dedicated ops/SRE rotation:** a developer-on-call model can strengthen the feedback loop; the person woken by the memory leak has both the ability and now the motivation to fix it, and reliability work stops being someone else's backlog. The centralized model retains its place at platform scale (shared infrastructure with deep specialist skills) and as a *transitional* structure. What doesn't work is the worst hybrid: developers ship, a separate team gets paged, and the pain never reaches the people who can end it — that's the 1990s ops model with extra YAML.

**Follow-the-sun** is the structural luxury of genuinely distributed organizations — hand coverage across time zones to reduce overnight duty when staffing and handoffs support it. If you have engineering hubs eight-ish hours apart, building rotations around them is worth real organizational effort (shared runbooks, disciplined handoffs with a written state summary, symmetric tooling access); if you don't, resist the fiction — a lone remote engineer "covering APAC" is a single point of failure with jet lag.

## The humane mechanics

The parts that determine whether people volunteer for or flee from the rotation: **compensation honesty** — on-call constrains a person's life whether or not pages fire (can't travel, can't drink, sleep with a phone), and organizations that pay for that constraint (stipends per shift, time-off-in-lieu after disrupted nights, page-load-triggered recovery days) are stating that they know it costs something; organizations that don't are pricing it at zero and paying in turnover instead. **Shift hygiene** — trade shifts freely with a visible calendar and no manager ceremony; never schedule someone's shift against their vacation re-entry week; and after a brutal overnight incident, the *default* (not the request) is that the responder's next morning is theirs. **Tooling floor** — a page must arrive with context (alert → runbook link → dashboard → recent deploys), because preparation can reduce avoidable delay during an incident: runbooks that exist and are tested, access that works from a phone/laptop without a VPN scavenger hunt, and a one-command way to declare an incident and summon help. Every friction in that path is paid at the worst possible hourly rate.

## The feedback loop is the actual product

A rotation without a feedback loop is pain distribution; the loop is what converts pain into engineering. The cadence that works: **every shift ends with a handoff review** (ten minutes: what fired, what was noise, what's still smoldering) feeding a **standing on-call review** (weekly or per-cycle: page trends, top noisy alerts, stuck remediations) with **real backlog authority** — the review must be empowered to demote alerts, schedule reliability work against feature pressure, and invoke the error-budget policy when page load says the system is out of balance. Close the loop personally too: the engineer who took the 3 AM page gets first claim on fixing its root cause during business hours — so operational knowledge informs the improvement.

And the leading indicators of rot, worth watching explicitly: rising acknowledge-then-ignore rates (alert trust eroding), page load concentrating on a subset of the rotation (skill or ownership imbalance), veterans quietly trading away their shifts (the market pricing your rotation's misery before HR does), and runbook edits trending to zero (knowledge fossilizing). Each has a boring intervention, and all of them are cheaper than the senior engineer who leaves.

The reframe that pulls it together: the pager is a *product* whose users are your own engineers, and it deserves what any product gets — load budgets, UX investment, feedback cycles, and a roadmap. Teams that run it that way discover the counterintuitive endgame: a well-designed on-call rotation becomes one of the *stickiest* parts of engineering culture — the place people learn the system deepest, trust each other most, and see their fixes matter fastest. The 3 AM page never becomes pleasant. It can become rare, actionable, fairly shared, honestly paid, and connected to funded work that improves the service — and that's the whole design brief.

## Calculate coverage before announcing a rotation

A rotation schedule is a coverage model with people in it. Define service hours, primary and backup responsibilities, maximum response expectations, and who has authority during a severe incident. Then account for leave, training, illness, holidays, and the work required after an interrupted shift. A roster that works only when nobody is absent is not fully staffed, however balanced its calendar appears.

For a fictional 24-week planning horizon with one primary shift per week, eight equally available qualified responders would each cover three primary weeks. Six would cover four; four would cover six. The chart shows these arithmetic results. They are not medically validated staffing thresholds or evidence that eight people automatically makes a rotation sustainable. Secondary coverage is additional: if it requires similar restrictions, count it separately rather than pretending it is free capacity.

Suppose the eight-person team has two people unavailable for six of those weeks. An equal annual average can hide a concentrated run of duties for the remaining six. Build the actual calendar and inspect the maximum consecutive coverage, nights, and recovery time for each person. Distinguish willing swaps from swaps made because the scheduled person cannot safely respond. Coverage fairness is a conversation supported by a schedule, not a score generated from shift count alone.

## Define the response that a page buys

A page should state what is happening, why immediate action matters, and the first safe step. An acknowledgment is confirmation that someone is taking responsibility, not proof that the service is repaired. Escalation timers should fit the service's response requirement and realistic access time. A responder must be able to escalate uncertainty before becoming trapped in a private investigation.

Separate incident coordination from technical investigation once the situation needs both. The investigator should not simultaneously diagnose a failing database, update stakeholders, and recruit help. Define who can declare an incident, restrict changes, request specialist support, and decide that a service should remain degraded while data integrity is checked. These roles can be combined for a small incident and separated as complexity grows.

The runbook's first action should be safe under incomplete information. Restarting an overloaded worker may help one failure and worsen another if it discards a useful queue or initiates a replay storm. Describe the observation that justifies the action, its expected effect, and when to stop. Include a path for an alert that does not match its runbook. A responder who follows the written procedure and still cannot resolve the issue has found a system gap, not failed a character test.

## Measure interruptions without turning people into telemetry

An alert count hides duration and timing. Ten duplicate notifications from one incident differ from ten independent investigations. Track incident grouping, actionable versus informational pages, approximate handling time, and whether the interruption occurred outside the responder's agreed working hours. Collect only the personal information needed to improve the rotation, and agree on access and retention with the team.

Do not infer sleep quality, health, commitment, or individual performance from acknowledgment speed. The purpose of these records is to identify an excessive operating burden and fix the service or staffing model. A delayed acknowledgment may reflect a delivery failure, unavailable access, ambiguous ownership, or a reasonable human circumstance. Test the notification path before attaching a personal explanation.

For a simple review worksheet, take a fictional week with 12 notifications grouped into four incidents. Two incidents needed immediate action, one should have been a daytime ticket, and one was a duplicate escalation caused by a faulty acknowledgment integration. The useful backlog contains a service repair, alert reclassification, and integration repair. A single objective to reduce notifications from 12 to six would not specify which change actually makes the service safer.

## A rehearsal before the first primary shift

Give a new responder a disposable service with realistic dashboards and a known, reversible fault. Ask them to receive a test page, locate the runbook, identify the affected user operation, and contact the secondary. The mentor observes where the tooling or documentation creates friction. This is a readiness exercise for the operating system, not a timed competition between people.

Include a broken assumption: an expired permission, a dashboard link that opens the wrong environment, or a mitigation that does not work. The desired behavior is to recognize the boundary and escalate safely. Record the missing access or explanation and repair it before independent coverage. A successful rehearsal includes asking for help when the evidence is incomplete.

Next practice a handover with an unresolved incident. The outgoing responder provides current impact, timeline, attempted actions, known hazards, open hypotheses, and the next decision. The incoming responder repeats their understanding and explicitly accepts responsibility. A calendar boundary alone does not transfer context. For cross-time-zone coverage, leave enough overlap for this exchange and a fallback when the next person is unexpectedly unavailable.

## Give the review authority to reduce the burden

After a shift, identify which work can prevent recurrence and which merely makes the next interruption easier. A better runbook matters, but it should not permanently normalize a repair that can be automated or a defect that can be removed. Put repeated operational work in the same planning process as feature work, with a named owner and a decision date.

Choose a load threshold with the people who will carry it and explain what happens when it is exceeded. The response might be temporary extra coverage, reduced nonessential changes, alert cleanup, or a specific engineering commitment. A threshold that only generates another warning does not protect anyone. Review the policy after unusual events rather than treating a number chosen during a quiet month as permanent truth.

Compensation, rest arrangements, and working-hour obligations depend on employment terms and jurisdiction. Have the responsible people confirm the applicable rules; this article offers an operating-design worksheet, not a legal standard. Whatever the arrangement, document it before assigning coverage and make the process for recovery time predictable. Asking an exhausted responder to negotiate individually is a weak operating procedure.

## Evaluate follow-the-sun by capability, not longitude

Three offices on a map do not automatically provide three equivalent response teams. Each needs sufficient service knowledge, permissions, language support where needed, and access to specialists. Handoffs add coordination work and can obscure ownership if several teams assume another is responsible. Test the same incident in each coverage period and compare missing context rather than ranking the people.

If a small service cannot support continuous skilled response, reconsider its availability promise, escalation arrangement, or architecture. A shared rotation can work when its scope and training are realistic; it can also overwhelm generalists with unrelated systems. Map the services, common failure modes, and specialist backup before merging rosters. The decision should be explicit enough that a responder knows what they are expected to diagnose and what they should escalate immediately.

A quarterly rotation review can end with three concrete outputs: an updated coverage calendar, a short list of recurring interruptions to remove, and evidence that access and escalation still work. Ask the team whether the written arrangement matches lived work, then correct mismatches. A well-designed schedule cannot guarantee that nobody leaves, but it can make responsibility visible and give people a credible route to improve how the service is operated.

## Primary references

- [Google SRE: Being On-Call](https://sre.google/sre-book/being-on-call/)
- [Google SRE Workbook: On-Call](https://sre.google/workbook/on-call/)
