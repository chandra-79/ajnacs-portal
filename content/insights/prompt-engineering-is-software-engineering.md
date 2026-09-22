---
title: "Prompt engineering is software engineering with worse feedback loops"
description: "Writing prompts for LLMs is software engineering. The feedback loops are worse, the determinism is lower, and the testing practices are less mature — but the discipline is the same."
date: 2029-04-20
tags: ["Enterprise AI"]
format: note
derived: true
---

Writing prompts for LLMs is software engineering. The feedback loops are worse, the determinism is lower, and the testing practices are less mature — but the discipline is the same.

A prompt is an instruction to a system. When you change it, you change the system's behavior. That behavior change can be subtle: a different tone, a slightly different structure, edge cases handled differently. And because the system is non-deterministic, "it worked when I tested it" is not the same guarantee it is in traditional software.

The engineering practices that apply:
- **Version control your prompts.** If you can't see what changed between last week's version and this week's, you can't diagnose a regression.
- **Write evaluations, not vibes.** A suite of test cases with expected outputs or evaluation criteria is infinitely more useful than checking whether the output "looks right" to whoever's reviewing it.
- **Test edge cases explicitly.** The happy path works. It's the malformed inputs, the ambiguous requests, and the adversarial users that will break your production system.
- **Document the reasoning.** Future maintainers need to understand why a prompt is written the way it is — not what it does, but why the specific phrasing was chosen.

Organisations that treat prompt engineering casually end up with production AI workflows that nobody understands, nobody tested systematically, and nobody owns. The bar for AI systems should be the same as for any other software that touches your users.
