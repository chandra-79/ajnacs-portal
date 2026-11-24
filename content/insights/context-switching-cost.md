---
title: "Context switching: measure the interruptions you can change"
description: "Separate meeting time, resumption effort and support obligations before redesigning the engineering calendar."
date: 2029-02-09
tags: ["Engineering Leadership"]
format: article
derived: true
---

The cognitive cost of context switching in knowledge work is well-documented and consistently underweighted in how engineering teams structure their days. Recovery time varies with the task and interruption; a single fixed penalty should not be treated as a universal estimate. Rebuilding the mental model of a system design under active development, or recovering the specific reasoning thread of a debugging session, takes longer when the problem is novel and the context is deep.

A standard engineering calendar does not reflect this cost. Meetings are scheduled at hourly intervals without accounting for the context switching overhead between them. The result is that a day with six scheduled meetings leaves individual intervals of 30 to 45 minutes between them, which may be poorly suited to some forms of sustained investigation. The day feels productive — it was filled with meetings — and produces little engineering output.

The teams that manage this problem do so at the team level rather than the individual level, because individual solutions — "I'll turn off Slack and focus" — are insufficient when the meeting obligations are team obligations. Meeting-free blocks designated and defended as a team commitment, not personal preferences that can be scheduled over when a stakeholder needs a time slot. Batched asynchronous communication, where messages are read and responded to in specific windows rather than continuously. Explicit measurement of meeting load per engineer, distinguishing between the manager's meeting burden and the engineer's, which are often reported as the same but experience very differently.

The engineering work that requires sustained attention — system design, complex debugging, architecture decisions, learning new technology — can be difficult to divide into short blocks, depending on the task and available handoff notes. Protecting the conditions for that work is a team performance decision with compounding effects on what the team can produce.

## Measure the calendar separately from recovery effort

Start with observable events. Record scheduled meeting minutes, the number of task changes and the length of the available work blocks. If an engineer chooses to estimate the time needed to resume a task, keep that estimate separate from clock time and make participation voluntary. There is no universal 20-minute recovery penalty that can be multiplied by every interruption. Task complexity, the interruption's content, the person's experience and the quality of saved notes all affect the result.

Do not turn calendar analysis into surveillance. The goal is to identify a scheduling constraint that the team can change. Aggregate the observations, avoid collecting private meeting content, and agree on a short retention period. A person with more interruptions may be providing essential support to others. Moving that work elsewhere changes who carries it; it does not make the work disappear.

## Work through a fictional week

Suppose an engineer records 12 task transitions in one week and estimates an average of eight minutes to reconstruct useful context after each. The estimated recovery effort is 96 minutes. In a later week with batched nonurgent questions, there are seven transitions with the same assumed average, or 56 minutes. The chart shows a 40-minute difference in the model. Neither average is a research benchmark, and the difference is not proof of improved productivity.

Check whether support requests waited longer, whether colleagues were blocked, and whether urgent work still reached the right person. If the team reduced interruptions by making assistance inaccessible, the local time saving may simply have become somebody else's delay. Include at least one service measure for the people who rely on the interrupted engineer.

## Leave a resumption note before switching

A practical note contains the current hypothesis, evidence already checked, the next command or experiment, and any state that must be preserved. For debugging, record the failing input and the reason for the next observation. Avoid a transcript of every terminal action. The useful artifact is a short explanation of where the reasoning stands.

Try the note on a low-risk task. Stop at a natural boundary, return later, and ask whether the note lets you resume without reconstructing the entire investigation. If it does not, identify the missing context. A colleague can help test whether the note depends on information that exists only in the author's memory. This exercise improves handoffs as well as personal resumption.

## Negotiate an interruption policy

Agree which events justify immediate contact, which use an asynchronous queue and when that queue is reviewed. An urgent production issue needs a staffed escalation path. A routine design question can often wait until a planned review window. Publish the expected response time so quiet work is not mistaken for absence.

Choose meeting blocks with the whole team's time zones and accessibility needs in mind. Putting every meeting in one person's morning may put them in another person's evening. Pilot the arrangement and inspect both focus opportunities and collaboration delays. The right result is a workable service agreement between concentration and availability, rather than a rule that all meetings are wasteful or that all complex work requires the same uninterrupted duration.

## Sources and further reading

- [Microsoft Research · The SPACE of Developer Productivity](https://www.microsoft.com/en-us/research/publication/the-space-of-developer-productivity-theres-more-to-it-than-you-think/)
- [Google SRE · Accelerating SREs to On-Call and Beyond](https://sre.google/sre-book/accelerating-sre-on-call/)
