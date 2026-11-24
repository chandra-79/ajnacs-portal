---
title: "Technical Due Diligence: Reading a Company's Engineering in Two Weeks"
description: "M&A and investment decisions hinge on technology assessments performed under time pressure with imperfect access. What actually predicts integration pain and hidden cost — architecture honesty, delivery capability, key-person risk, and the questions that surface them."
date: 2027-10-01
tags: ["Engineering Leadership", "Technology Strategy", "M&A", "Architecture", "Technical Debt"]
format: article
---

Technical due diligence is the strange discipline of assessing years of engineering decisions in days, through a keyhole, while everyone you interview has rehearsed. The acquirer wants to know what the technology is *actually* worth — what it costs to run, extend, and integrate; what risks hide in it; whether the team that built it can keep building. The target wants the deal to close. Between those incentives sits the assessor, and the craft is knowing which observations are load-bearing — because in two weeks you cannot audit a system, but you can gather evidence about engineering risks, with confidence limited by access and sampling.

## What you're actually assessing (it's not the code)

The rookie framing is "is the code good?" — and it's the least useful question, both because code quality varies wildly within every codebase and because code is the most fixable layer. The senior framing assesses four things that are expensive to change:

**Architecture honesty** — not whether the architecture is fashionable, but whether the *description matches the reality* and the reality matches the business. A well-understood monolith with clean boundaries is a better asset than a "microservices platform" that's actually a distributed monolith requiring synchronized deploys (the Conway signatures are readable in the deploy calendar). The diagnostic gold is the *delta* between the slideware and what engineers describe under gentle specific questioning ("walk me through what happens when a customer places an order — which systems, which teams, what breaks").

**Delivery capability** — the DORA-shaped vitals, read from evidence rather than assertion: deployment frequency and lead time (visible in CI history and release logs — ask for the raw data, not the summary), change-failure signatures (the incident list, the hotfix ratio), test-and-pipeline reality (watch a deploy happen; the difference between "we have CI" and a trustworthy pipeline is an afternoon of observation). Delivery cadence and validation practices inform integration planning, but neither alone establishes what a company can fix or how long integration will take.

**Dependency and liability surface** — the layer where deals acquire surprises: license compliance (license obligations require a verified component inventory and qualified legal review; run approved scans only within the agreed scope), the security posture signatures (secrets handling, patch cadence against the CVE stream, the IAM sprawl indicators, whether there's ever been a pen test and what happened after it), data-protection reality versus policy (where personal data actually lives — including the logs, per the logging-hygiene truths — and whether deletion is implementable, because data obligations can affect transaction and integration planning), and the vendor/infrastructure commitments (the pricing cliffs, the expiring enterprise agreements, the single-region architecture whose DR story is a diagram).

**Key-person and knowledge risk** — an assessment that can materially affect a deal decision: which systems have exactly one comprehender (the bus-factor mapping — ask "who would you call if X broke at 3 AM" across interviews and watch the same two names recur), what's written down versus tribal (runbooks, ADRs, onboarding time for recent hires as the honest documentation metric), and the retention reality of the people the deal's thesis quietly depends on.

## The craft: how to see through the keyhole

The access is limited and the presentations are polished, so the techniques matter: **triangulate artifacts against interviews** (repo history, ticket records, and incident logs provide additional evidence, subject to completeness and interpretation — commit patterns show the real team's shape, ticket age-distribution shows the real backlog, incident recurrence shows what postmortems actually change); **interview down the stack** (the CTO gives the vision; the senior engineer who's been there four years gives the archaeology — ask them what they'd fix first with a free quarter, then ask why it hasn't happened; the answer is usually the organizational finding); **watch for the honesty signature** — teams that volunteer their debt, name their fragile systems, and describe past incidents in mechanism-level detail are demonstrating exactly the engineering culture that makes debt fixable, while defensive polish on every answer is itself a finding; **run the cheap scans** (SCA, secrets scanning, dependency-age profiling — hours of tooling that surface objective conversation-starters); and **size the remediation, not the sin** — every finding gets an order-of-magnitude cost and a timeline ("the single-region posture is a two-quarter, N-engineer project"), because diligence output is an *investment model input*, not a code review.

## The output: findings that price, block, or plan

Structure the report by what the deal team can do with it: **value-adjusting findings** (run-cost realities, the re-platform the roadmap silently requires, the license remediation — numbers into the model), **term-adjusting findings** (key-person retention packages, escrow for compliance remediation, closing conditions on specific fixes), **integration-planning findings** (the identity-system merge, the data-model reconciliation, the delivery-cadence mismatch between acquirer and target — the items that dominate the first eighteen months and are cheaper to plan pre-close), and the rare **thesis-breaking findings** (the "AI platform" that's an outsourced demo, the architecture that cannot reach the scale the deal math assumes — the assessor's job on these is early, evidenced escalation, not report-padding). Everything gets confidence levels; two-week keyhole assessments that express certainty are advertising their own methodology gap.

And the mirror version is worth every technology leader's attention *before* any deal: the estate that would pass diligence — documented architecture matching reality, delivery metrics on dashboards, dependency hygiene automated, bus factors managed, incident learning visible — is simply a well-run estate; the diligence checklist is a health checklist with a deadline attached. Companies that run themselves as if the assessors arrive next quarter don't just close deals faster — they've internalized the discipline the assessment was ever trying to measure: engineering whose stated reality and actual reality are the same thing. That congruence, in the end, is what the two weeks are spent looking for — because everything else can be fixed, and a lack of reliable evidence requires explicit follow-up rather than unsupported confidence.

## Agree the assessment boundary before collecting evidence

Technical diligence should begin with an engagement scope: the systems, entities, environments, and questions the assessment covers. Record who authorizes access and which activities are permitted. Read-only repository access, interviews, configuration review, and scanning have different operational implications. Do not run a scanner against a production service merely because someone supplied its URL. Agree the method, timing, credentials, data handling, and incident contact before any active testing.

State what the assessment cannot establish. A short review can identify documented risks and inspect selected controls, but it cannot guarantee that a company has no vulnerabilities or that every architectural claim is correct. Restricted access should appear as a limitation in the report. An unavailable artifact is not automatically evidence of misconduct; it is a constraint on confidence that may require follow-up.

Define the investment question. An acquirer integrating identity and billing systems needs different evidence from an investor evaluating whether a product can support a larger customer base. A generic checklist is useful for coverage, but the strongest work connects technical findings to the actual transaction thesis. Keep business assumptions visible so that a change in strategy can trigger a different interpretation of the same engineering evidence.

## Build an evidence register

For each finding, record the claim, the source artifact, the collection date, the environment, and the verification method. An architecture diagram is an assertion; a sampled request trace or configuration export may help test it. A successful restore demonstration is evidence about that specific backup and procedure, not all backups. Preserve the distinction between observation, inference, and an unverified management statement.

Use interviews to explain mechanisms and locate evidence. Ask an engineer to walk through a recent release or incident, then compare the account with timestamps and artifacts. Differences can reflect outdated documentation, terminology, or incomplete memory. Investigate before treating them as dishonesty. A respectful interview often produces more useful detail than an adversarial attempt to catch someone contradicting a slide.

Protect sensitive material. The report may contain vulnerabilities, customer data locations, contract details, and information about employees. Limit distribution to the authorized audience and agree retention and deletion rules. Do not paste raw secrets into a report to prove that a secret was found. Record enough evidence to support remediation while keeping the credential itself in an approved secure process.

## Worked example: remediation capacity as a planning input

Consider a hypothetical assessment that identifies three scoped work packages: eighty engineer-hours for dependency upgrades, forty for a restore rehearsal and documentation, and sixty for tightening deployment permissions. The estimated total is 180 engineer-hours. A named team can allocate thirty hours per week to this work, giving a simple capacity lower bound of six weeks if tasks can be sequenced without additional waiting.

The chart shows the three work-package estimates, not measured effort or a guaranteed completion schedule. The arithmetic excludes procurement, specialist availability, release windows, and newly discovered work. If the restore rehearsal depends on an environment available only next month, six weeks of effort divided by capacity does not establish a six-week calendar duration. State those dependencies separately.

Attach a range or scenario to estimates that remain uncertain. For example, a dependency upgrade may require only configuration changes or may expose an incompatible API. A focused compatibility test can reduce that uncertainty. Avoid presenting a large remediation number as precise merely because the spreadsheet sums its inputs exactly. Precision of arithmetic is not precision of evidence.

## Inspect recovery and delivery through demonstrations

Ask for a representative build and deployment demonstration in an approved environment. Record what is automated, what requires privileged intervention, and what happens when a step fails. A pipeline screenshot proves that a pipeline exists; it does not prove that the pipeline deploys the current product reliably. Inspect artifact identity and the connection between source revision, build output, and deployed version.

For recovery, choose a defined scenario and objective. A database restore may demonstrate data recovery while leaving application configuration, identity, or external dependencies unresolved. Measure from the agreed start event to usable service and identify the latest recoverable data point. Do not substitute backup completion logs for a restore test. Also avoid treating one successful rehearsal as proof of every disaster scenario.

Review incident records for recurrence and follow-through. A low incident count can reflect reliability, limited usage, weak detection, or incomplete reporting. Ask how incidents are defined and collected. A high count can similarly reflect excellent visibility rather than poor engineering. Interpret the records alongside service objectives, customer impact, and operational context.

## Security, licensing, and contracts need the right expertise

Automated dependency and secret scans are useful leads, not final determinations. Validate whether a component is deployed, reachable, and used in a way relevant to the finding. A scanner can miss custom code, runtime configuration, or a dependency outside its inventory. Document tool versions and coverage. Route urgent confirmed exposures through the agreed contact path rather than waiting for the final presentation.

License obligations depend on the specific license, use, distribution, and contractual context. Engineering can inventory components and describe how they are incorporated; qualified legal reviewers should determine obligations and transaction implications. Avoid classifying every copyleft component as a defect or treating a software composition report as a legal opinion. The same separation applies to privacy, employment, and commercial contract questions.

Assess key-person dependency through operational tasks, not personality judgments. Determine whether another authorized person can build, deploy, restore, and diagnose representative systems. Documentation, rehearsals, and access continuity can reduce the dependency. Do not speculate about an employee's intentions or infer likely departure from an interview style. Report the capability gap and the evidence supporting it.

## Produce findings that support a decision

A useful finding contains the condition, evidence, consequence, confidence, proposed response, owner, and unresolved questions. Distinguish a confirmed inability to restore from a restore capability that was not demonstrated. Both may matter to a buyer, but they are not the same claim. Explain which additional evidence would change the assessment.

Group actions by urgency and dependency. Some work can occur before integration, some must precede a particular migration, and some is an accepted ongoing risk. Keep the executive summary readable while linking to the evidence register and technical detail. The report should let a decision maker understand both the concern and its limits.

The final takeaway is disciplined uncertainty. A short assessment can make an investment decision better informed when its observations are traceable and its recommendations are feasible. It becomes misleading when confidence exceeds access or when generic maturity labels replace evidence about the systems that actually matter to the transaction.

## Sources and further reading

- [AWS · Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [NIST · Secure Software Development Framework](https://csrc.nist.gov/pubs/sp/800/218/final)
- [US GAO · Cost Estimating and Assessment Guide](https://www.gao.gov/products/gao-20-195g)
