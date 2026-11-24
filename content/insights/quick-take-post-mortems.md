---
title: "Postmortem follow-ups: verify the mechanism you meant to change"
description: "Connect incident learning to testable improvements, named coordination and explicit decisions about remaining risk."
date: 2028-09-13
tags: ["Engineering Leadership", "Observability", "Resilience"]
format: article
---

The post-mortem is well-written. The timeline is clear, the contributing factors are identified, and the team's response is documented honestly. Everyone reads it, nods, and moves on.

Three weeks later, the same incident type recurs.

## The accountability gap in post-mortems

Most post-mortems identify contributing factors. Fewer convert those factors into specific, assigned, time-bounded action items. The ones that do often do not track completion. The ones that track completion often deprioritize the actions when the next sprint starts and new work comes in.

The result is a growing library of post-mortems that accurately document the organization's recurring failures.

## What a post-mortem action item actually requires

An action item that can be tracked and completed has four properties:

**Specific.** "Improve observability" is not an action item. "Test a pool-saturation indicator against known failures, select an actionable threshold, and assign the alert and runbook an owner by the agreed date" is a more specific action. A fixed 80% threshold or 60-second duration would need workload evidence before it became a paging policy.

**Assigned.** One person's name. Not "the platform team" or "whoever is working on it." A person who can say, at the next sprint review, whether the action was completed.

**Time-bounded.** A deadline. Not a vague commitment to do it "soon." A sprint or a date.

**Prioritised.** This is where most post-mortem action items die — they are created, assigned, and deprioritized when the next sprint planning happens. The team lead needs to hold the line on post-mortem actions having space in the queue.

## The review mechanism

The postmortem can create learning immediately; selected improvements need implementation and verification to change system behavior. This requires a review mechanism: at the end of each sprint, are the open post-mortem actions still open? If yes, are they in the current sprint? If not, when?

Some teams maintain a post-mortem action board alongside their normal work board, reviewed weekly. This makes the completion status of post-mortem actions visible and creates the social accountability to follow through.

## The blameless post-mortem and action items

The blameless post-mortem movement rightly focuses on system causes rather than individual blame. This is the correct approach for identifying what went wrong. It does not reduce the need for action items. Systems do not fix themselves. People fix systems. Someone needs to be responsible for each fix.

Blameless identification of system problems plus named ownership of system improvements produces the outcome post-mortems are supposed to produce.

## An action is a hypothesis about prevention or recovery

A useful follow-up describes the mechanism it intends to change. Adding an alert is appropriate only if a responder has an action to take and enough time to take it. A threshold such as 80% connection utilization is an example configuration, not a generally safe paging rule. Inspect saturation duration, queueing, rejection and user impact before selecting a condition. Test the alert against known healthy peaks as well as a failure scenario.

Write three distinct fields: the observed contributing condition, the proposed change and the evidence that will show whether the change worked. For a connection leak, the condition might be connections remaining checked out after a cancelled request. The change could ensure cleanup on cancellation. The test should cancel requests under load and verify that checked-out connections return to the expected range. A ticket saying the patch was merged is weaker evidence than that test.

## Follow the action through verification

Consider a fictional review of 12 incident follow-ups. Eight have a merged implementation, but only five have passed the failure scenario they were meant to address. Implementation completion is 8/12, or about 66.7%. Verified completion is 5/12, or about 41.7%. The chart shows counts rather than percentages to keep the small denominator visible. Three actions remain between implementation and verification, while four have not reached implementation.

Do not interpret these numbers as a maturity score. Different actions may have very different importance. One verified change that removes a high-impact failure mechanism can matter more than several low-risk documentation updates. Keep severity, expected effect and validation cost in the review record. Mark an action explicitly accepted or superseded when the team chooses another approach; otherwise the backlog becomes a collection of promises that no longer match the system.

## Rehearse the review meeting

Take one past incident and ask a colleague unfamiliar with it to explain each proposed follow-up. If they cannot identify the failure mechanism or the expected result, revise the wording. Select one action for a safe rehearsal. Establish a precondition, trigger, observable outcome and rollback. Use a test environment or a controlled production exercise with the appropriate owner rather than replaying a hazardous failure casually.

At the next review, ask whether the change was validated and what remains uncertain. A failed rehearsal is useful evidence. It may reveal that the fix addressed one path while a cancellation or timeout still bypasses cleanup. Record the newly discovered case and revise the action, rather than calling the rehearsal a failure of the person who wrote the patch.

## Preserve learning even when no new ticket is justified

A postmortem can clarify how the system behaves, improve shared understanding or confirm that an existing mitigation is adequate. It does not need an arbitrary quota of action items. Creating low-value tickets to make every review look productive can divert effort from more important work. When no change is selected, record the reasoning, the residual risk and the condition that would reopen the decision.

Assign coordination to a named owner while making clear that they are not personally responsible for every underlying cause. Give them access to the teams and capacity needed to finish. If priorities change, escalate that trade-off visibly. Blameless learning and accountable follow-through work together when ownership means making the next decision possible, rather than finding someone to blame for an unfinished ticket.

## Sources and further reading

- [Google SRE · Postmortem Culture](https://sre.google/sre-book/postmortem-culture/)
- [Google SRE Workbook · Incident Response](https://sre.google/workbook/incident-response/)
