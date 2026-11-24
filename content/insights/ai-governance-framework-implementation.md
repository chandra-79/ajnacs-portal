---
title: "Implementing AI Governance Frameworks That Don't Kill Velocity"
description: "The governance frameworks that work in enterprise AI aren't the ones that are most comprehensive — they're the ones that get followed. Here's the design pattern that threads that needle."
date: 2027-03-29
tags: ["Enterprise AI", "Governance", "Cloud Architecture", "Engineering Leadership"]
format: article
---

One failure mode in enterprise AI governance: a comprehensive, well-intentioned framework that produces so much friction that engineering teams route around it. Shadow AI adoption increases. Governance exists on paper and nowhere else.

Another failure mode: governance so permissive that it provides no real protection. Data boundaries unenforced. PII leaking into external LLMs. No audit trail. A compliance incident waiting to happen.

Threading the needle between these requires governance that's opinionated about the things that matter and invisible for the things that don't.

## The Things That Actually Need Governance

Not everything in an AI workflow needs a governance layer. The areas that do:

**Data classification and flow**: which data can enter which AI systems. This is the most important governance boundary and the most commonly skipped. Every AI-integrated feature needs a documented answer to: what data does this touch, where does it go, and what does the vendor's data processing agreement say about it?

**Model output validation**: for any AI output that drives consequential decisions or public-facing content, there must be a defined validation step before action. "Consequential" is context-dependent — a hallucinated customer support response is not the same risk as a hallucinated medical recommendation. Define the threshold explicitly.

**Audit logging**: necessary decision records, model versions and request metadata, retained under an approved policy with access controls. This is the evidence trail required for compliance investigations and for debugging systematic output failures.

**Approved tool and model registry**: a maintained list of approved AI tools, LLMs, and vendors, with the data types each can process. This isn't about blocking all unapproved tools immediately — it's about creating clarity so engineers know what's allowed without asking.

## The Things That Don't Need Heavy Governance

**How engineers use approved tools**: if GitHub Copilot is on the approved list for code on non-sensitive repositories, engineers don't need approval for each use. The governance decision was made when the tool was approved.

**Approved-model prompt design**: internal prompt changes within approved boundaries can use normal engineering review and proportionate regression evaluation rather than a separate governance committee.

**Experimentation in sandboxes**: development and prototype environments with synthetic or sample data shouldn't require the same governance as production. Slow-moving approval processes for experimental work produce shadow adoption faster than any other governance failure.

## The Approval Process That Doesn't Kill Velocity

The common mistake: requiring an approval for every AI project, with a centralised AI governance board that reviews each one. This creates a bottleneck that teams learn to route around.

The pattern that works: **pre-approved patterns with a lightweight registration requirement**.

How it works:
1. The governance team defines pre-approved patterns: "RAG pipeline using approved embedding model, approved vector store, on data classified as Internal or lower" is pre-approved. No separate approval needed.
2. Teams building within approved patterns complete a lightweight registration: document the pattern, data classification, and output use case in a shared registry. No committee review.
3. Teams building outside approved patterns (new model, new data type, novel architecture) submit a structured review request. a published review target and asynchronous review where appropriate.
4. The governance team publishes new approved patterns based on what they see coming through reviews.

This model means most AI work proceeds without a governance gate. Edge cases get reviewed efficiently. The governance team builds context that improves the framework iteratively.

## The Data Boundary Map

Before any AI tool touches production, you need an explicit data boundary map. This doesn't need to be elaborate — a simple matrix works:

| Data Classification | Internal LLM | Approved Vendor | Public LLM |
|---|---|---|---|
| Public | Approved use | Approved use | Approved public use |
| Internal | Approved boundary | Approved boundary | Not approved by default |
| Confidential | Specific controls | Reviewed terms and controls | Not approved by default |
| Restricted (PII/PHI) | Specific approval | Specific legal and security review | Not approved by default |

This illustrative table must be replaced by the organization's reviewed policy. It structures decisions about data handling that would otherwise be made informally, inconsistently, or not at all. Once it exists, it becomes a reference that engineering teams can use without asking the governance team every time.

## Measuring Whether the Governance Is Working

Most governance programmes measure compliance inputs: number of reviews completed, percentage of AI projects registered. The output that matters is risk reduction: compliance incidents prevented, data boundary violations detected, PII exposure events.

Track:
- Governance exception rate (teams requesting departures from approved patterns) — high rates indicate the approved patterns don't fit actual use cases
- Shadow AI detection (AI tools not in the registry, identified via expense reports, IT shadow scan) — indicates governance friction is driving non-compliance
- Compliance incident rate — the actual outcome the governance is designed to prevent

High exception rates, unregistered use and incidents require investigation. They can reflect unclear patterns, missing capabilities, weak enforcement or changing demand; the metrics alone do not establish which policy change is appropriate.

*Building an AI governance programme for an enterprise organization? [This conversation is worth having before the first incident.](/contact)*

## Define the boundary of a pre-approved pattern

A reusable pattern should specify intended use, permitted data classes, approved processors, available tools, output destination and required validation. "Uses an approved model" is too broad because the same model can summarize public documents or initiate consequential changes. The approval attaches to the complete operating boundary, not merely a vendor name.

Include the conditions that invalidate the pattern. Adding external recipients, introducing a new data class or replacing a read-only tool with a mutating tool should trigger review of the changed risk. A team should be able to see these conditions without interpreting a lengthy principles document. Examples of permitted and out-of-scope uses make the pattern easier to apply consistently.

Registration should produce useful operational metadata: owner, service identifier, pattern version, evaluation location and disable procedure. Avoid collecting fields that nobody uses. At the same time, do not omit the evidence that lets an operator identify which systems are affected when a provider, model or data-handling rule changes.

## Worked example: review effort and exception coverage

Imagine a hypothetical month with 50 proposed workflows. Thirty fit a documented pattern and each require 15 minutes of registration review. Fifteen need a two-hour focused review. Five need a four-hour specialist review. The chart reports the total hours in each lane: 30 × 0.25 = 7.5 hours, 15 × 2 = 30 hours and 5 × 4 = 20 hours.

Total review effort is 57.5 hours. Reviewing every workflow for two hours would take 100 hours, so this invented triage model uses 42.5 fewer hours. That is a planning comparison, not evidence that lighter review achieves equal risk control. The model works only if pattern eligibility is correctly assessed and the pattern's controls are actually enforced.

The specialist lane receives more effort per case because those cases are assumed to need it. Do not optimize solely for the lowest review time. Measure rework, missed findings and incidents as well as lead time. A fast approval that later requires an emergency redesign can be slower over the full delivery cycle.

Keep the denominator stable. Withdrawn proposals and rejected uses should remain visible with their disposition. A falling exception rate could mean patterns improved, or it could mean teams stopped registering difficult work. Interpret the metric with interviews, support requests and evidence of actual system usage.

## Make controls reusable and testable

An approved pattern should include implementation support: a configuration template, logging guidance, example evaluation cases and a tested way to disable the capability. A policy that says "protect confidential data" becomes more usable when the platform supplies scoped credentials, approved endpoints and a clear data-flow template.

Automation can check some conditions reliably, such as whether a deployment references a registered model configuration or exposes an unapproved tool. Other decisions require judgment, such as whether a new output changes the system's intended purpose. Do not force subjective questions into a Boolean scanner simply to make the dashboard look complete.

Separate evidence retention from indiscriminate logging. Immutable raw prompts can conflict with data minimization or deletion requirements. Preserve the decisions, versions and identifiers necessary for the approved purpose, and define controlled access to sensitive diagnostic content. The correct retention design depends on the workflow and applicable requirements.

## A practical pattern-review exercise

Write a pattern for an assistant that summarizes public technical documents and produces drafts for internal readers. Specify that it cannot send messages or access private repositories. Create three proposals: one matching the pattern, one adding confidential documents and one adding external publication. Ask two reviewers to classify them independently and explain their reasoning.

If reviewers disagree, revise the pattern's boundary rather than blaming the team for not understanding it. A good reusable rule should make ordinary cases predictable and exceptions explicit. Add examples from those disagreements to the documentation so the same ambiguity does not recur in every review.

The worksheet should contain proposal, matching pattern, changed capability, data flow, required evidence, decision owner and review deadline. For an approved case, run the disable procedure and verify that the registry identifies the actual deployed instance. For an exception, record the specific unresolved question and who can answer it.

Then change the underlying model or provider. Determine which workflows can proceed after regression evaluation and which need renewed data or security review. This exercise tests whether the registry supports change management rather than merely recording initial approval dates.

## Govern changes without reviewing every keystroke

Routine use within an approved scope should proceed under that authorization. Prompt and configuration changes still need the software review and evaluation appropriate to their effect. A revised instruction that changes tool behavior is more consequential than a spelling correction. The decision should follow the behavior change, not the file type.

Sandboxes can reduce risk when they use synthetic data, restricted credentials and no external effects. They still need basic access and resource controls. A sandbox that quietly connects to production data is not low risk simply because its deployment environment is named development. Make the isolation properties inspectable.

Time-bound exceptions need owners and exit criteria. An exception without a review date can become the permanent operating model by accident. Conversely, repeatedly renewing the same exception may indicate that the approved pattern should be improved. Use the review history as feedback about platform needs.

## Evaluate whether governance helps delivery

Track time to a usable decision, findings discovered before release, unresolved high-consequence gaps, tested recovery coverage and user-reported problems. Incident counts alone cannot establish how many incidents were prevented. Describe prevention as a hypothesis supported by control evidence, not an observable counterfactual total.

The program should help teams know what they can build, how to demonstrate readiness and where to get an answer when the pattern does not fit. Clear scope, reusable controls and proportionate review make that possible. A short framework that changes actual deployment behavior is more valuable than a comprehensive document whose requirements cannot be implemented or verified.

## Sources and further study

- [NIST — AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [Breck et al. — The ML Test Score](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/)
- [OWASP — Prompt injection risks](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
