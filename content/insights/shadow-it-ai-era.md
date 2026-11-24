---
title: "Shadow AI: understand the workflow and control the data"
description: "Unapproved AI use can reveal unmet workflow needs and data-handling risks. Inventory the tasks, review the data paths and provide usable approved alternatives."
date: 2029-03-28
tags: ["Enterprise AI", "Engineering Leadership"]
format: note
derived: true
---

Unapproved AI use can reveal an unmet need and create a control problem at the same time. An employee may want a faster way to summarize a document, while the organization needs to know where that document goes, who can access it, and how long it remains there. Treating the behavior only as disobedience misses the workflow; treating it only as innovation misses the exposure.

## Make the approved route usable

Start with the tasks people are trying to complete. Distinguish public-document summarization from handling customer records, source code, credentials, or unreleased business plans. The same tool can be acceptable for one task and unsuitable for another. Review actual deployment terms and settings; a brand name alone does not determine retention, training use, access controls, or regional processing.

A hypothetical internal survey finds 50 recurring AI-assisted workflows. Twenty use public material, 18 use internal material, and 12 involve restricted information. Those categories are the chart's illustrative counts. They describe 50 workflows, not 50 unique people or 50 confirmed incidents. Multiple workflows may belong to one team.

## Turn discovery into specific remediation

For each workflow, record its owner, input classification, destination, desired output, and existing alternative. Offer an approved path for the common low-risk tasks. For restricted inputs, involve the appropriate data owner and security team before expanding access. Make the guidance concrete: whether an employee can paste a particular class of document, which workspace to use, and how to report an accidental disclosure.

Do not collect the sensitive prompt contents merely to prove that sensitive prompts exist. A self-reporting exercise can use categories and examples with fabricated data. If an actual exposure is suspected, use the established incident process rather than circulating the document through a survey or chat channel.

## Test whether the response helps

Pilot the approved route with a small group and measure whether it completes their real tasks with acceptable effort. Record blocked legitimate tasks as well as policy violations. A tool that is secure but unusable will not explain how the underlying work gets done.

The worksheet is an inventory, not a punishment score. Revisit ownership when a tool changes its terms, connectors, or sharing model. NIST's AI risk-management work provides a framework for assigning responsibilities; OWASP explains why connecting untrusted content to powerful tools introduces additional hazards. The practical objective is an approved route people understand and can use, plus a clear response when information leaves that route.

## Sources and further study

- [NIST — AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [OWASP — Prompt injection risks](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
