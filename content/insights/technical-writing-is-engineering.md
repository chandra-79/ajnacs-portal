---
title: "Technical writing is an engineering skill. Not a soft skill. An engineering skill."
description: "The framing of writing as a \"soft skill\" in engineering has produced decades of engineers who regard documentation as an obligation to be minimised and clear communication as optional."
date: 2025-09-24
tags: ["Engineering Leadership"]
format: article
---

The framing of writing as a "soft skill" in engineering has produced decades of engineers who regard documentation as an obligation to be minimised and clear communication as optional. The framing is wrong and the consequences are expensive.

Writing forces precision in a way that conversation does not. You can discuss an architectural approach in a meeting and leave with everyone nodding in apparent agreement while holding genuinely different mental models of what was decided. Writing down the design forces the author to commit to specifics: which service owns which data, what happens when the external API is unavailable, how the system behaves at twice the expected traffic volume. The gaps in the reasoning become visible in the writing before they become visible in production.

Design documents, architectural decision records, runbooks, and post-mortems are not administrative overhead. They are the engineering artifacts that make collaborative systems work. A design document reviewed by three engineers before implementation catches the integration assumption nobody questioned in the verbal discussion. A runbook tested by a new on-call engineer surfaces the step that was obvious to the author and incomprehensible to someone without that context. An ADR that explains why a technology was chosen and what conditions would make the team reconsider prevents the architecture from being relitigated every six months by engineers who weren't present for the original decision.

The career leverage of clear writing is also real. An engineer who can write a clear technical proposal will have their ideas considered by stakeholders who were not in the meeting. An engineer who can write a clear post-mortem will surface systemic issues that verbal discussions in a conference room typically do not produce. Writing scales influence in ways that direct conversation does not.

Teaching writing to engineers means treating it as a technical skill: give specific feedback, provide examples of what clear looks like, and create incentives for good documentation rather than minimum viable documentation.
