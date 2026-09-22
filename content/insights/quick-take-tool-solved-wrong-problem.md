---
title: "Most Failed Tool Adoptions Solved the Wrong Problem With the Right Tool"
description: "Tool adoption failures are usually misdiagnosis failures. The tool works. The problem it was purchased to solve is not the problem that actually exists."
date: 2025-12-11
tags: ["Engineering Leadership", "Architecture"]
format: article
---

The incident management tool was adopted to improve response coordination. Six months later, incident response is not noticeably faster. The tool is well-implemented. The on-call engineers use it. The dashboards are populated. And the metric that mattered — time to resolution — has not improved.

Investigation reveals: the bottleneck in incident response was not coordination. It was unclear runbooks, poor observability, and escalation paths that required waking up specific experts who had the context everyone else lacked. The tool solved the coordination problem. The coordination problem was not the bottleneck.

## Why tool adoptions misdiagnose the problem

**The problem that is visible is not always the problem that is real.** Coordination during incidents is visible — it is loud, chaotic, and easy to observe. The root causes of slow resolution (poor observability, unclear runbooks, knowledge silos) are invisible unless you specifically instrument for them. The visible problem gets the tool. The invisible problem remains.

**Tools are solutions in search of problems.** Every tool vendor demonstrates their product solving a problem. When engineering teams evaluate tools, they are often matching the vendor's problem framing to their own situation rather than starting from a rigorous diagnosis of what their specific problem is.

**The decision maker is not the person experiencing the problem.** Observability tools are often purchased by engineering managers who have never been on call. The on-call engineers know that the problem is not "too many dashboards to check" (more dashboards). The problem is "the dashboards do not tell me what is wrong." Different problems. Different solutions.

## The diagnosis that should precede the tool

Before evaluating a tool, diagnose the problem with the same rigor you would apply to a production incident:

- What evidence shows the problem exists? (Not "it feels slow" — what do the numbers show?)
- Where in the process does the problem manifest? (Not "incidents are slow" — at what step does time accumulate?)
- What is the most likely cause? (Not "we need better tooling" — what specifically is causing the observed behavior?)
- What change would produce a measurable improvement?

The answer to the last question may be a tool. It may also be a process change, a staffing change, a documentation investment, or an architectural change. The tool adoption that follows a rigorous diagnosis is more likely to address the actual problem.

## The measurement that closes the loop

After adopting a tool, measure the specific metric that motivated the adoption. If it does not improve, the tool solved a different problem than the one that matters. This is not a failure of the tool. It is a diagnostic failure that is worth learning from.
