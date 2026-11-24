---
title: "AI Governance Is Not a Compliance Document — It Is an Operational Discipline"
description: "An AI governance framework needs to influence delivery and operation as well as document policy. Governance that actually shapes how AI systems are built, deployed, and monitored looks different."
date: 2028-06-23
tags: ["Enterprise AI", "Governance", "Engineering Leadership"]
format: article
---

The AI governance framework is published. It is comprehensive, properly formatted, and satisfies the questions from the board. It describes acceptable use, risk categories, oversight processes, and accountability structures.

It is also read almost exclusively by the team that wrote it and the auditors who review it.

The AI projects proceed as before. The governance document is filed.

## What governance looks like on paper vs. in practice

On paper, governance includes: policies about which use cases are permitted, data handling requirements, human oversight requirements for high-risk decisions, bias and fairness evaluation criteria, incident escalation paths.

In practice, governance is effective when it changes the behavior of engineers, product managers, and business owners making day-to-day decisions about AI systems.

The gap between a stated requirement and demonstrated behavior is an operational governance problem.

## The questions that reveal whether governance is real

Is an engineer who is about to use a customer's data to fine-tune a model aware that this requires a review? Not because they were told once in a training session, but because there is a process they encounter when they try to do it?

When a new AI feature is designed, is the governance review a step in the design process — before engineering begins — or a checkbox that happens after the feature is built and ready to ship?

When an AI system behaves unexpectedly in production, is there a defined escalation path, and does the team know what it is?

When an AI vendor is evaluated, is there a defined process for assessing their data handling, model provenance, and security practices?

These are operational questions, not documentation questions.

## The operationalization

Governance becomes real when it is embedded in the tools and processes that engineers and product managers use every day. A review step with a documented exception path and accountable approver. A required field in the deployment template that asks about the AI risk category. A Slack channel that notifies the AI review team when a new AI system is deployed to production.

Governance that exists only in documents is an audit artifact. Governance that exists in process and tooling shapes decisions.

A project can introduce serious risk when the governance process is disconnected from the work and nobody owns the resulting decisions.

## Turn one policy sentence into a control

Take the requirement that an assistant must not disclose restricted documents to an unauthorized user. A policy statement establishes the intent. The implementation needs an authorization decision before retrieval, source-level permission metadata, cache isolation, and tests showing that a changed permission removes access. Logging should identify the decision without creating a new broadly accessible copy of the restricted text.

A hypothetical review covers 24 AI services. Twelve have a named production owner and a tested disable procedure, eight have an owner but no tested disable procedure, and four have neither. The chart shows this inventory. It measures one narrow operational property, not overall compliance. A service in the first category may still have unresolved fairness, privacy, or security issues.

## Assign decisions to roles with authority

The product owner defines the intended use and acceptable business outcome. The data owner approves the data scope. Engineering owns the deployed behavior and recovery path. Security and other specialists review risks in their areas. The organization needs a clear decision when those responsibilities intersect, rather than assuming that a committee's presence makes accountability complete.

Record exceptions with a reason, a responsible decision-maker, a compensating control, and an expiry or review trigger. An exception without a trigger can become the normal process by neglect. A review trigger can be a new data category, a new external tool, a material model change, or a change in who receives the output.

## Rehearse the governance path

Use a tabletop exercise in which an assistant cites an internal document in a response intended for an external recipient. Ask who detects the event, who can stop further disclosure, how the affected output is identified, and which records support the investigation. Keep the exercise fictional. The purpose is to expose missing authority and evidence without creating a real incident.

Then test the technical disable procedure in an approved environment. Disabling a user-interface button may leave a background task or API route active. Confirm which capabilities stop, what happens to queued work, and how users continue their task. A documented procedure becomes useful when another operator can execute it correctly.

The worksheet contains service purpose, users, input classes, action capabilities, owner, evidence links, unresolved risks, and next review trigger. Keep it close to the delivery workflow and update it when the system changes. NIST's framework provides a broad vocabulary for governing and managing AI risks; application-specific threat guidance supplies concrete scenarios. The organization still has to decide how those ideas map to its actual service, and demonstrate that the resulting controls work.

## Sources and further study

- [NIST — AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [OWASP — Prompt injection risks](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
