---
title: "Architecture Governance: Decision Rights, Supported Paths and Evidence"
description: "Use decision records, automated checks and timely review to make architectural obligations explicit without unnecessary waiting."
date: 2027-06-18
tags: ["Architecture", "Engineering Leadership", "Platform Engineering", "Engineering Practice"]
format: article
---

Enterprise architecture governance has spent two decades oscillating between failure modes. The classical one: the Architecture Review Board — a monthly committee through which all significant designs pass, staffed by architects distant from delivery, producing weeks of latency, rubber-stamp theater, and an engineering organization that learns to describe whatever it was already building in whatever vocabulary gets approval. The reactive one: autonomy absolutism — "teams decide everything" — which reads as enlightenment for about two years, until the estate has eleven message brokers, five half-adopted frontend frameworks, no shareable security posture, and integration costs that compound with every hire. Both fail the same underlying test: **governance exists to make the estate's decisions coherent over time at the lowest possible tax on delivery** — the committee maximizes the tax; the vacuum abandons the coherence.

A practical approach can combine four mechanisms, with required review retained where the decision's consequences justify it.

## Principles and decision records: legible intent

Governance starts with *written, reasoned* intent: a **small set of architecture principles** with teeth — not "we value scalability" (a horoscope) but decision-shaped commitments ("services own their data; no shared databases across team boundaries," "buy context, build core," "everything deployable independently") — each with its rationale and its price admitted, because a principle whose cost is hidden gets discarded at first contact with that cost.

Beneath principles sit **Architecture Decision Records** — the practice that carries most of the weight. An ADR captures one significant decision: context, options weighed, choice, consequences — a page, in the repo, next to the code it governs. The compounding value is institutional memory (the "why is it like this?" that otherwise costs an archaeology sprint per year, answered in two minutes), but the *governance* value is subtler: ADRs make decisions **reviewable without being gate-kept** — anyone can read, comment, and challenge asynchronously, and the discipline of writing the context forces the thinking the committee meeting only pretended to. The operating rules that keep ADRs alive: they're written *when the decision is made* (not archaeologically), they're immutable-plus-superseding (a reversed decision gets a new ADR pointing back — the history is the asset), and "significant" is defined by blast radius (hard to reverse, crosses team boundaries, or sets precedent — the two-pizza decision needs no record; the message-broker selection does).

## Paved roads and fitness functions: governance as infrastructure

The mechanism that replaced the committee's *enforcement* function: make the preferred way the easy way. The **paved road** — the blessed stack with templates, CI, observability, security, and deployment pre-wired (the platform-engineering golden path) — governs more effectively than any mandate, because deviation stops being rebellion and becomes a visible, self-funded choice: you may leave the road, but you own what the road was providing. The governance conversation shifts from "is this allowed?" to "is departing worth it to you?" — which is the right question, answered by the people who'll pay for it, with the ADR documenting their reasoning.

For the rules that genuinely must hold everywhere — security floors, data-protection obligations, the interoperability contracts — enforcement belongs in **machinery, not meetings**: policy-as-code in pipelines (the linter that rejects the unencrypted bucket, the unpinned dependency, the schema change that breaks N-1 compatibility), **fitness functions** (automated checks that architectural properties still hold: dependency-direction rules, service-boundary respect, latency budgets — executable architecture tests, run continuously, per the evolutionary-architecture playbook), and scorecards that make each service's conformance visible (production-readiness checklists as dashboards, not audits). Automated checks can evaluate declared properties frequently, while deployed behaviour and unmodelled obligations still require other evidence.

## Advisory review: the humans, repositioned

Human review survives — repositioned from gate to **service**. The working format: a standing architecture-advice forum (weekly, open, minuted) where teams *bring* designs early because it's genuinely useful — senior perspective, cross-team pattern-matching ("team B solved this; here's their ADR"), and the early catch of the collision course two teams are on. The rules that keep it advisory rather than creeping back to gatehood: attendance is invited-not-required for most decisions (mandatory only for the blast-radius tier the principles define), advice is recorded in the team's ADR but the *team decides* (the advice-process model — decision rights stay with the owners; accountability travels with the decision), and the architects staffing it are embedded practitioners on rotation, not a separate caste — the surest structural defense against governance drifting away from ground truth.

What this preserves from the old model is the one thing it did well — cross-estate pattern visibility — while deleting its latency, its theater, and its adversarial dynamic. The forum's health metric is voluntary demand: when teams queue up to present *early* drafts, governance is working; when they arrive with finished designs seeking blessing, it has quietly become the board again.

## Running it: the portfolio view and the honest metrics

The remaining leadership work is portfolio-level: a **technology radar** (adopt/trial/hold, maintained honestly — including the *hold* entries that name the deprecated-but-present, with migration intent and dates, feeding the modernization roadmaps), **divergence review** as trend rather than incident (three teams leaving the paved road in the same direction is not three exceptions — it's the road needing a new lane, and the exception log is the platform team's best requirements source), and metrics that measure the governance itself: decision latency (idea to recorded decision — the tax), paved-road adoption (the coherence), exception rate and direction (the feedback), and the archaeology metric — how often "why is it like this?" has a findable answer. What's deliberately absent from the list: compliance percentages with mandated patterns, the metric that recreates the theater.

The through-line, matching every operational discipline in this series: governance modernized the same way testing, security, and deployment did — from gate to platform, from committee to code, from approval to legibility. Write the intent (principles, ADRs), pave the path (golden roads, policy-as-code), keep humans where judgment lives (advisory, embedded, on-demand), and measure the tax honestly. An estate governed this way doesn't feel governed at all — decisions flow, coherence accumulates, and important decisions have a retrievable rationale — which is precisely the point: the best architecture governance, like the best infrastructure, succeeds by disappearing.

## Distinguish a principle from a mandatory control

A principle guides tradeoffs; a mandatory control defines a requirement that a team cannot waive on its own. Mixing them creates confusion. “Prefer supported database services” can allow a justified exception. “Protect customer data according to the applicable access policy” requires evidence and an authorised decision process. Label the difference so teams know what they can decide locally.

Decision rights should follow the effect of the change. A local implementation choice can remain with the owning team. A shared protocol change requires affected consumers. A new data-processing arrangement may require security, privacy, and contractual review. A lightweight process does not mean every review is optional; it means the required review has a clear reason, scope, and response time.

Create an escalation path for disagreement. An advisory forum is useful, but a team needs to know who resolves a conflict when two services require incompatible contracts or an exception shifts cost to another owner. Record the decision and its consequences rather than leaving unresolved disagreement disguised as consensus.

## A hypothetical decision-latency model

Consider an invented review workflow with three elapsed components: three days preparing an unnecessarily large document, four days waiting for a meeting, and one day resolving the actual decision. Total elapsed time is eight days. A revised workflow assumes one day of focused preparation, two days waiting for asynchronous feedback, and the same one day of resolution, totalling four days.

The chart compares eight and four days. These are planning assumptions, not observed productivity gains. The model does not claim that less documentation always halves review time or that every decision should be rushed. Its purpose is to separate preparation, waiting, and substantive decision work so a team can measure the actual source of delay.

In a real review, record when a sufficiently complete request arrived, when feedback was provided, and when the decision was made. Otherwise a team can appear slow because it includes weeks before requirements existed, while another appears fast by starting the clock at approval. Publish the start and stop rules alongside any metric.

## Give exceptions a lifecycle

An exception record should name the unmet requirement, why the supported path is unsuitable, compensating measures, owner, review date, and exit condition. The exit condition may be migration back to the supported path, acceptance of a new supported option, or retirement of the workload. An exception with no review mechanism becomes undocumented permanent policy.

Do not make exception count a target to minimise without context. A falling count can mean the platform improved, or that teams stopped reporting deviations. A cluster of similar exceptions can reveal a missing capability. Review the reasons and outcomes, not just the total.

Cost ownership must be explicit when a team chooses an unsupported tool. Who patches it, operates it during leave, restores its data, and handles provider changes? A small trial can have a lighter bar than a business-critical production service. Define the promotion threshold before the experiment quietly becomes indispensable.

## Automated checks need evidence of coverage

A dependency rule can detect forbidden imports. A policy check can reject an unapproved configuration. A compatibility test can exercise known consumer expectations. Each check has a scope and blind spots. Describe those limits and test that a deliberate violation is actually detected.

Avoid equating a green pipeline with complete architectural conformance. Runtime permissions, manual configuration, data flows, and emergency changes can diverge from the repository. Reconcile selected deployed properties with the declared configuration and investigate drift. The check should protect an important obligation rather than merely enforce a naming preference.

False positives also have an operating cost. A rule that repeatedly blocks legitimate work without a clear repair path trains teams to bypass it. Provide an actionable message, a documented exception mechanism, and an owner who maintains the rule. Review whether the rule still reflects the architecture decision it was created to support.

## Make supported paths measurable services

A platform template is useful when a team can deploy and operate a representative workload through it. Test onboarding from a fresh account, with the permissions and knowledge a new team actually has. Include observability, rollback, dependency updates, and incident ownership rather than stopping at a successful first deployment.

Measure task completion, support effort, and the reasons teams depart from the path. A high adoption percentage can hide coerced use of a poor workflow. A lower percentage can be reasonable when the supported path intentionally covers only a subset of workloads. State the eligible population before reporting adoption.

Keep the supported path versioned and maintained. Teams need migration guidance when the template changes; copying a repository once does not make downstream services inherit future fixes automatically. Decide whether updates are pulled, generated, or centrally delivered, and test that mechanism on an existing service.

## A governance tabletop exercise

Bring one hypothetical proposal: a team wants a new message broker because the current platform cannot meet a required delivery pattern. Identify the requirement, two alternatives, affected consumers, operating owner, data lifecycle, and recovery obligations. Decide which checks can be automated and which require judgment.

Run the proposal through the documented decision process with a time limit for feedback. Record missing information and unnecessary steps. Then introduce an urgent security issue in the preferred option and determine who can change the decision. This tests the governance system under changing evidence rather than only under an orderly presentation.

The output should be a concise decision record, an implementation owner, validation criteria, and a revisit trigger. Retain the rejected options and their relevant tradeoffs without producing a transcript of every conversation. A future engineer should be able to understand why the choice made sense and what changed when it was superseded.

Governance earns its place by making consequential decisions clearer and obligations easier to fulfil. It should reduce hidden dependency and ownership problems while keeping review effort proportional to the decision. Neither a committee nor an automated gate is inherently sufficient; the evidence, decision rights, and operating feedback determine whether the process works.

## Further reading and source boundaries

- [Michael Nygard: architecture decision records](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [ArchUnit: automated architecture checks](https://www.archunit.org/userguide/html/000_Index.html)
- [C4: architecture review checklist](https://c4model.com/diagrams/checklist)
