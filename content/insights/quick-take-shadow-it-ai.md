---
title: "Shadow IT Is Back. Now It Runs on ChatGPT."
description: "The AI adoption wave has produced a new generation of shadow IT: employees using AI tools that IT has not approved, governance has not addressed, and security has not assessed."
date: 2028-06-26
tags: ["Enterprise AI", "Engineering Leadership"]
format: article
---

Shadow IT never went away. But for a decade, it was mostly about SaaS applications — employees using Dropbox instead of SharePoint, Slack instead of the corporate messaging system, personal Google Docs instead of the corporate document management tool.

The new shadow IT is more complex: employees pasting company data into ChatGPT, using AI coding assistants with undefined data handling policies, building workflows with AI tools that have not been reviewed for security or compliance.

## Why the new shadow IT is different

**The data path needs review.** When an employee used a shadow SaaS app, they typically stored documents or communicated through an unapproved channel. Both are risks. The new shadow IT involves pasting proprietary code, customer data, financial projections, and legal documents into third-party AI systems. The data is sent to external systems and may be used to train future models, depending on the vendor's data handling policies.

**Visibility depends on the environment.** An employee using an unapproved SaaS app leaves a trace — a login event, a document in an external storage system, a credit card charge on expenses. A web-based tool may be visible through managed-device or network controls, while personal-device activity can be harder to observe.

**The behavior is normative.** Using ChatGPT has become a normal, accepted part of many professions. Employees who would have hesitated to install unapproved software think nothing of pasting work material into a free web tool. The risk perception is lower than the actual risk.

## Why blanket bans do not work

A restriction can reduce exposure in a controlled environment, but a restriction alone does not resolve the workflow need or ensure that employees understand the permitted alternative.

The organizations that address this effectively acknowledge that employees are using AI tools, assess which tools are acceptable for which data categories, provide approved alternatives for use cases with high data sensitivity, and give employees clear guidance rather than vague prohibitions.

## The governance response

Data classification is the starting point. What data can go into which tools? Publicly available information: use permitted tools after considering terms, intellectual-property restrictions and any sensitive context added by the task; public availability alone is not approval. Internal but non-sensitive information: corporate-approved tools with reviewed data policies. Sensitive data (customer PII, financial, legal, code): approved tools only, with enterprise agreements that cover data handling.

The guidance needs to be specific enough to act on. "Use AI tools responsibly" is not guidance. "Use the approved customer-data workflow and its documented workspace; escalate any input outside its permitted scope" is guidance.

Shadow IT can be a signal that the approved options are not meeting employee needs. The productive response addresses both the behavior and the underlying gap.

## Inventory the task without collecting the sensitive prompt

A discovery exercise should ask what people are trying to accomplish, which data categories they use, where the information goes, and what the approved alternative fails to provide. It does not need employees to paste confidential prompts into another survey tool. Use fabricated examples and category labels when possible, and route suspected real exposures into the established incident process.

In a fictional inventory of 40 recurring workflows, 16 have an approved route that users did not know about, 14 need a capability the approved route lacks, and ten require a data-handling review before any route can be selected. The chart separates these causes. A training campaign may help the first group; it will not by itself provide the missing capability in the second.

## Make the approved choice concrete

Publish guidance by task and data class. Name the approved workspace or deployment, the allowed input, and the action to take when a document falls outside scope. Verify the exact configuration and contract rather than assuming that an enterprise label guarantees every required control. Connectors, sharing settings, retention, and optional telemetry can change the effective data path.

Test the approved workflow with representative users. If it requires repeated copying, loses document formatting, or cannot preserve references, record those limitations. A usable sanctioned path gives the organization a practical way to reduce unreviewed work. Restrictions may still be necessary for particular data or actions; they should be specific, explained, and accompanied by a workable escalation route.

## Avoid simplistic measures of success

Fewer reported uses of an unapproved tool may mean less use, less disclosure, or less willingness to report. Pair discovery with anonymous task feedback where appropriate and inspect whether the approved route actually completes the intended work. Do not interpret every missing log entry as proof that no external processing occurred.

For the worksheet, create one row per workflow with owner, task, input class, output destination, current route, approved alternative, and unresolved need. Assign a next action to each row. Separate an unknown configuration from a confirmed violation; the evidence and response differ.

Revisit the inventory when a vendor changes data handling, a new connector is enabled, or a team begins using the output for a more consequential decision. A summarization assistant that once handled public documents may become a customer-response agent with access to internal records. The review needs to follow the capability, not merely the original product name. This is how the discovery work becomes an ongoing service-management practice rather than a one-time list of forbidden tools.

## Sources and further study

- [NIST — AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [OWASP — Prompt injection risks](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
