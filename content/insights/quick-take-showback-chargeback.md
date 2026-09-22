---
title: "Always Run Showback Before Chargeback — The Conversation It Starts Is the Point"
description: "Chargeback without showback produces a bill without context. Showback first gives teams time to understand their costs before accountability begins — and the conversation during showback is where the real work happens."
date: 2025-12-24
tags: ["FinOps", "Engineering Leadership"]
format: article
---

The FinOps implementation plan includes two phases: showback (show teams what they are spending, with no financial consequences) and chargeback (teams are accountable for their cloud costs against a budget).

Almost every team that tries to skip showback and go directly to chargeback regrets it.

## Why showback before chargeback matters

**Teams need time to understand their costs before they are accountable for them.** Cloud cost allocation is not always intuitive. Shared services, cross-team data transfers, reserved instance savings distribution, and tagging attribution all require explanation and adjustment before teams can accurately interpret their allocated cost. The first month of showback typically reveals attribution errors, tagging gaps, and cost components that teams did not know existed.

**The conversation during showback is the valuable one.** When a team first sees their cloud cost, they ask questions: why is storage this expensive? Where is this networking cost coming from? Why are we paying for these instances in a region we don't use? These questions produce investigation, which produces understanding, which produces optimization.

Showback before chargeback means this investigation happens without financial pressure. The team can ask the question, investigate, and fix the problem before the cost affects their budget. Under chargeback, the same investigation happens under pressure, which produces worse outcomes — either the team blames the cost attribution rather than investigating it, or they optimize aggressively without fully understanding what they are changing.

**Trust in the numbers must be established before accountability.** If the attributed costs are wrong — because of tagging gaps, shared service allocation methodology issues, or reserved instance accounting — teams will not accept accountability for costs they believe are inaccurate. Showback creates the space to establish that the numbers are accurate (or to fix them until they are) before financial accountability begins.

## What the showback period should include

- Monthly cost reports to each team with breakdown by service and resource type
- At least one meeting with each team to walk through their costs and answer questions
- A process for teams to dispute cost attribution they believe is incorrect
- Identification and resolution of tagging gaps that cause attribution errors

The typical showback period is 2–3 months. Teams that skip it consistently spend the first 6 months of chargeback disputing attribution, which is more expensive in time and relationships than the showback investment would have been.
