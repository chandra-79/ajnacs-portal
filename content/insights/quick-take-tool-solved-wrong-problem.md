---
title: "Testing whether a tool changes the actual bottleneck"
description: "Run a bounded trial with representative tasks, explicit success criteria, integration cost and an exit plan."
date: 2028-06-19
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

After adopting a tool, measure the specific metric that motivated the adoption. If it does not improve, inspect adoption, workload changes and the proposed mechanism before deciding whether the tool addressed the right problem. This is not a failure of the tool. It is a diagnostic failure that is worth learning from.

## Design a trial that can fail usefully

Before a vendor demonstration, state the current workflow and the specific step the tool is expected to improve. Write down the strongest alternative explanation for the problem. If incident recovery is slow because responders cannot find the owner, a coordination tool might help. If they find the owner quickly but cannot reproduce the failure, the experiment should examine diagnostic evidence instead.

Choose a representative set of cases rather than the product's easiest demonstration. Include a routine case, an exception and a failure of the tool itself. Ask the people who do the work to perform the task while an observer records active effort, waiting and errors. The trial should reveal integration and support costs as well as the attractive happy path.

## A hypothetical incident-workflow decomposition

A fictional recovery takes 60 minutes: ten minutes to establish coordination,35 to diagnose the failure and 15 to execute a mitigation. A tool reduces coordination to four minutes while the other stages remain unchanged. Total recovery becomes 54 minutes, a 10% reduction. The chart compares the ten- and four-minute coordination stages, but the method keeps the full 60-to 54-minute outcome visible.

Calling this a 60% recovery improvement would confuse the changed component with the whole process. Calling it worthless because diagnosis remains dominant would also be premature. The tool may improve communication quality or reduce responder effort. Measure those benefits separately and decide whether they justify the recurring cost and operational dependency.

## Include adoption and exit in the experiment

Record how users learn the tool, obtain access and recover from a mistaken action. An administrator's guided demo may hide friction that ordinary users encounter. Test the export format and determine whether historical records remain readable if the subscription ends. A tool that solves today's problem but makes a future migration unusually costly should be evaluated with that consequence visible.

Create a small decision sheet with the target outcome, minimum acceptable result, integration effort, recurring ownership and exit procedure. Define the stop condition before the trial starts. If the result misses the threshold, the decision can be to refine the workflow, test another approach or stop. A sunk implementation cost is not evidence that broader rollout will create value.

## Interpret a disappointing result carefully

An unchanged metric does not prove the tool solved the wrong problem. The rollout may be incomplete, the workload may have changed, or the metric may not capture the intended benefit. Check exposure, actual use and the measurement window before drawing a conclusion. Conversely, a favorable before-and-after chart does not establish causality when staffing or demand changed at the same time.

Keep the final recommendation specific: which users and tasks benefit, under which conditions, at what ongoing cost, and with what unresolved limitations. This is more useful than a global verdict that a product is good or bad. The engineering decision is about the fit between a capability, a workflow and a constraint that the team can demonstrate.

## Sources and further reading

- [Google SRE Workbook · Incident Response](https://sre.google/workbook/incident-response/)
- [DORA · Platform engineering](https://dora.dev/capabilities/platform-engineering/)
