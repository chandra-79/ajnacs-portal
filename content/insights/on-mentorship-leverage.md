---
title: "Mentorship as engineering work: make reasoning transferable"
description: "Turn recurring questions into independent judgment with bounded practice, feedback, and a simple support-effort worksheet."
date: 2029-05-30
tags: ["Engineering Leadership"]
format: article
derived: true
---

The most experienced engineers in any organisation have accumulated something that is difficult to reproduce from documentation: the pattern recognition that comes from having been wrong in specific ways and corrected over time. They know why a particular architectural choice fails under a particular load pattern because they watched it fail. They know why a particular organisational intervention backfires because they tried it. That knowledge is the most valuable thing they can transmit.

Knowledge transfer can be missed when evaluation considers only individual output. An engineer who supports colleagues while delivering a feature contributes work that a simple feature count does not distinguish. Whether that support produces greater independence should be assessed through later evidence, not a promise that two colleagues will become independent within six months.

The mentorship that compounds is specific rather than general. General encouragement — "you're doing great, keep learning" — is pleasant and does not transfer knowledge. Specific feedback transfers knowledge: "This plan uses a scan because the current table is small. Let us test how a different data distribution changes the plan before choosing an index." The mentee who receives that feedback internalises a decision framework, not a single decision.

Making your own mistakes visible is an underused practice. Experienced engineers may present a conclusion without its uncertainty or discarded alternatives. The reasoning that led to those conclusions, including the wrong turns, is more educational than the conclusion. A senior engineer who describes a design they were confident about, why they were wrong, and what the correcting signal looked like teaches the mentee how to be wrong productively.

## Turn a review into a transferable decision

Start with a task the learner will encounter again. A useful example is diagnosing why one query became slow after a tenant grew. Ask the learner to state the symptom, identify what evidence would distinguish several explanations, and choose the next observation. The mentor should make the reasoning visible without immediately taking the keyboard. Explain why a scan might be appropriate for one distribution and expensive for another; avoid promising that a join or subquery will change behavior at a fixed traffic multiple. Query plans depend on data, indexes, statistics, parameter values and the database engine.

Agree on the boundary of independence. The learner might inspect a read-only execution plan alone, propose an index with a reviewer, and require an operator to run the production migration. Those are three different permissions. Mentoring is successful when the learner can recognize when to ask for help, including when the experiment exceeds the agreed boundary. Silent improvisation is not independence.

## A hypothetical capacity example

Suppose a mentor handles eight recurring questions each week, averaging 20 minutes of explanation. That is 160 minutes weekly. Creating an example, pairing once, and asking the learner to explain a second case requires 120 minutes of initial preparation. In a later comparable week, three questions still need 20 minutes each and maintaining the example takes 20 minutes. Ongoing support becomes 80 minutes, a reduction of 80 minutes. Simple recovery of the 120-minute preparation is 1.5 weeks at that rate.

These are fictional planning inputs, not a measured effect of mentorship. The chart compares ongoing support effort and deliberately excludes the one-time preparation. The calculation also excludes the learner's time, which must be recorded separately if total delivery effort matters. If the new work is much harder, or the mentor simply becomes less approachable, fewer questions would not be evidence of learning. Check the quality of decisions and the learner's comfort seeking assistance alongside time.

## A four-session exercise

Choose one bounded skill and write down the observable outcome. For incident triage, the outcome could be identifying the affected dependency and proposing a reversible mitigation using an unfamiliar trace. In the first session, the mentor works through a case and narrates uncertainty. In the second, the learner chooses observations while the mentor challenges assumptions. In the third, the learner handles a different case and produces a short decision record. In the fourth, another teammate reviews the result without the original mentor supplying missing context.

Keep a small evidence log: task, initial hypothesis, observation, revised hypothesis, decision and remaining question. This is a learning aid rather than an employee ranking. Do not turn the number of questions, documents or mentoring hours into a productivity target. A difficult question caught early may prevent substantial rework; a quiet week can conceal confusion.

## Watch for dependence disguised as support

The mentor who approves every choice can become a permanent gate. The learner who receives only answers may complete today's ticket without building a method for tomorrow. Counter both problems by gradually changing who proposes the next step and who checks the outcome. Rotate reviewers when the task is ready so the knowledge does not merely move from one exclusive pair to another.

Give the mentor time in the team's plan and assess contributions through concrete evidence: a colleague can now carry out a task safely, a runbook works without verbal repair, or review conversations expose a useful trade-off. Mentoring is one form of engineering contribution. Its value depends on the team's needs and the quality of the learning process, rather than an assumption that it is always the highest-leverage activity.

## Sources and further reading

- [Google SRE · Accelerating SREs to On-Call and Beyond](https://sre.google/sre-book/accelerating-sre-on-call/)
- [Google Engineering Practices · Code review](https://google.github.io/eng-practices/review/reviewer/)
