---
title: "Make preventive work visible through tested outcomes"
description: "Recognize risk reduction and maintenance with clear evidence, without inventing avoided incidents or tying contribution to personality."
date: 2029-01-15
tags: ["Engineering Leadership"]
format: article
---

A visible incident response can receive more attention than a separate preventive improvement whose effect is less dramatic.

A contribution record should make that preventive work understandable without claiming that a specific incident was certain to occur.

## The measurement problem

Performance evaluation in engineering is heavily weighted toward visible outputs: features shipped, bugs fixed, incidents resolved, tickets closed. These are measurable. They have a start event and a completion event.

Preventive changes can have observable completion and validation events, even though the exact failures they might avert are not directly observable.

The engineer who finds and eliminates a class of bugs before they reach production does not create a JIRA ticket. The engineer who notices a growing disk usage trend, identifies the cause, and implements a cleanup job does not generate an alert. The engineer who reviews a proposed design and identifies an architectural flaw that would have caused problems three months later — there is no counterfactual measurement for the problems that did not occur.

## The organizational cost

The measurement problem produces an incentive problem. Engineers learn, over time, what is valued. What is visible is valued. What is invisible is not valued. The invisible work — the careful operational engineering, the defensive architecture, the proactive monitoring — is rationalized away in favor of work that will appear in a status update.

Organizations that systematically undervalue prevention accumulate operational fragility. The work that would have prevented the fragility was not rewarded, so it was not done.

## What good management does about it

Good engineering management makes the invisible visible. Not by waiting for it to appear, but by asking for it explicitly:

"What problems did you prevent this quarter?" is a different question than "What did you build this quarter?" Both questions belong in a performance conversation.

"Walk me through the last time you caught something before it became an incident" is a question that surfaces exactly the kind of work that systems engineering depends on and performance systems miss.

The quiet engineer who fixes things before they break should not have to hope that someone notices. They should be asked.

## Recognize an observed property instead of an imaginary incident

Prevention work can have a clear completion event: a restore rehearsal passes, an unsafe permission is removed, a query meets its tested performance condition or an obsolete dependency is retired. What is usually unobservable is the exact incident that would have occurred without the change. Keep that distinction explicit when describing impact.

Ask for the original risk, the change, the validation and the limitation. An engineer can demonstrate that a disk-cleanup task keeps a tested workload within its capacity limit. They cannot infer from that alone how many outages or dollars were saved. Crediting the verified improvement is both fairer and more technically defensible than inventing a dramatic counterfactual.

## A fictional capacity-headroom example

A test volume has 100 GB of usable capacity. A representative run previously leaves 85 GB in use. After a retention change, the same test leaves 60 GB. Available headroom therefore changes from 15 GB to 40 GB. The chart compares headroom, while the method preserves the fixed 100 GB denominator. This is a synthetic test example, not an availability guarantee.

Validate that the retention change does not remove data required for recovery, audit or application behavior. Repeat under a representative workload and check growth over time. More free space is useful only when the system still meets its data obligations. A performance conversation should recognize both the capacity improvement and the care taken to establish that boundary.

## Build evidence into normal planning

Create a small risk-reduction item with the service owner and the condition being improved. Give it a place in the delivery plan and define what completion means. At review, show the evidence alongside feature outcomes. This makes preventive work visible without requiring the engineer to construct a heroic narrative after the fact.

Include collaborators. The person who noticed the trend, the person who implemented the change and the person who challenged the retention assumption may all have contributed materially. A single metric or ticket count will not capture those roles. Ask for concrete examples and use the responsibilities of each role to interpret them.

## Avoid personality-based recognition

Quietness is not evidence of careful work, and visibility is not evidence of superficial work. Provide several ways to communicate contribution: a written note, a demonstration or a discussion with reviewers. People should not need the same presentation style to have their work understood.

Finally, inspect whether the organization actually funds the preventive work it praises. If every maintenance item is displaced by new features, recognition alone will not improve the service. Select important risks, assign capacity and revisit the results. The goal is a reliable habit of observing and improving the system, with credit grounded in evidence that other engineers can inspect.

## Sources and further reading

- [Microsoft Research · The SPACE of Developer Productivity](https://www.microsoft.com/en-us/research/publication/the-space-of-developer-productivity-theres-more-to-it-than-you-think/)
- [AWS · Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
