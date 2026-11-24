---
title: "Plan mentorship around a capability you can verify"
description: "Define a bounded learning goal, budget preparation and feedback, and test independent judgment with a new case."
date: 2028-11-20
tags: ["Engineering Leadership"]
format: article
---

Mentorship can create value beyond the mentor's own implementation work. An experienced engineer can help a colleague develop a specific capability through practice and feedback. The size and duration of that effect depend on the learner, task and support.

Multiply by three junior engineers over a decade of mentoring and the cumulative engineering output is a significant multiple of what the experienced engineer could produce alone.

The benefit should be evaluated through observable learning rather than assumed lifetime returns.

## Why experienced engineers underinvest

**Mentorship is not measured.** The engineer who ships four features this quarter is visibly productive. The engineer who made a junior engineer significantly better this quarter — measurably more capable, producing fewer bugs, making better architectural decisions — produced value that appears nowhere in the performance system.

**Mentorship feels slower.** Doing the work yourself takes an hour. Explaining the work, watching someone else do it, answering questions, and reviewing the result takes three hours. In the short term, doing it yourself is faster. The investment may pay back through reduced support and stronger decisions, but the timing needs to be measured. Most incentive structures measure the short term.

**Mentorship feels like it requires time you do not have.** Experienced engineers are often high-demand resources. Mentorship is easy to defer when there is always a more urgent task.

**The skills are different.** Being excellent at the work does not automatically produce the ability to explain it, or the patience to watch someone else learn it at a slower pace. Teaching is a separate skill from doing. Some engineers who are excellent practitioners are genuinely poor mentors, and the awareness of this discourages the attempt.

## What effective mentorship actually requires

The 2-hour-a-week commitment is not the constraint. The constraint is intentionality: actually identifying what a specific junior engineer needs to learn, creating situations where they can learn it (not just assignments, but deliberate challenges and exposures), and providing feedback that is specific enough to change behavior.

Generic mentorship — "ask me if you have questions" — produces generic outcomes. Mentorship that says "I want you to own this incident response independently this month, and we will debrief each one" produces engineers who can own incidents.

The experienced engineers who build strong mentorship practices build organizations that outlast their own tenure in the role. That is a different kind of leverage than individual output, and more durable.

## Replace lifetime-return arithmetic with a bounded learning goal

It is not defensible to assume that mentoring accelerates every learner by six to 12 months or to project a fixed return across a 20-year career. People, tasks and environments differ. A more useful question is what the learner should be able to do independently after a defined period, what support is needed and how the team will verify the capability.

Choose a task that appears in the team's real work. For example, a learner might interpret a service trace, propose a safe diagnostic step and explain when to escalate. Define the limits of the exercise and provide a sandbox or sanitized evidence. The goal is sound judgment under the agreed conditions, not performing a production action without appropriate review.

## A fictional four-week mentoring plan

Suppose the plan contains one hour of guided practice and 30 minutes of feedback each week for four weeks. Mentor contact totals six hours. Preparing two exercises takes another two hours, giving eight hours of mentor effort. The chart separates six contact hours from two preparation hours. Learner practice time is additional and should be recorded if the team needs a complete capacity estimate.

At the end, use a different but comparable case. Ask the learner to state the hypothesis, choose evidence and explain the next action. A successful result supports a claim about that capability in that setting. It does not establish a permanent skill increase or a career-wide productivity multiplier. Revisit the task after a gap if retention matters.

## Make feedback specific enough to use

Describe the decision and its consequence. Instead of “be more systematic,” point out that the learner changed two variables before observing the first result, making the cause of the improvement unclear. Ask them to redesign the next experiment so the evidence is interpretable. Feedback can also identify a good choice: pausing before a destructive action because the environment identity was uncertain.

Invite the learner to explain their reasoning before offering a correction. The apparent mistake may have come from missing context or an ambiguous instruction. This helps the mentor improve the exercise and avoids treating every gap as a deficiency in the learner. It also makes the session a conversation about evidence rather than a recital of the expert's preferred method.

## Transfer ownership gradually

Begin with demonstration, move to guided practice and then to an independent case with review. Avoid keeping the learner permanently in shadowing mode. Watching an expert can be useful, but it does not show whether the learner can select the next step when the answer is unknown. Give them the opportunity to make a bounded decision and inspect the result.

Share the teaching materials with another reviewer and test whether they can use them. This prevents the mentoring relationship itself from becoming an exclusive dependency. Recognize the mentor's contribution through observable learning outcomes and useful materials, while reserving time for it in the plan. The value is a more capable team with clearer ways to learn, rather than a speculative calculation about decades of future output.

## Sources and further reading

- [Google SRE · Accelerating SREs to On-Call and Beyond](https://sre.google/sre-book/accelerating-sre-on-call/)
- [Google Engineering Practices · Code review](https://google.github.io/eng-practices/review/reviewer/)
