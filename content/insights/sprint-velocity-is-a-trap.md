---
title: "Sprint velocity is the metric that most confidently measures the wrong thing."
description: "Sprint velocity became ubiquitous in software engineering planning because it answered a real question — how much can this team deliver in a sprint — with a number that could be plotted…"
date: 2029-02-12
tags: ["Engineering Leadership"]
format: article
derived: true
---

Sprint velocity became ubiquitous in software engineering planning because it answered a real question — how much can this team deliver in a sprint — with a number that could be plotted over time. The appeal is legitimate. Planning requires some model of throughput. The problem is that velocity measures what teams do, not what teams achieve, and the difference matters enormously.

A team that inflates story point estimates improves velocity without improving output. This is a rational response to being measured by velocity: the easiest way to improve the metric is to control the inputs to the metric. Story point estimation is subjective enough that calibration drift is difficult to detect from the outside. The team's velocity goes up. The actual value delivered is unchanged.

A team that tackles high-value architectural work that has low story point count — restructuring a data model to enable a class of product features, replacing a fragile integration with a more reliable pattern, improving the observability of a system that regularly causes incident confusion — reduces their velocity while increasing their future delivery capacity. From a velocity perspective, this looks like a bad sprint.

The alternatives to velocity as a planning and performance metric are not revolutionary: cycle time, which measures how long items take from start to done; lead time, which measures how long from request to delivery; business metrics tied to engineering work, which measure whether the delivered software produced the intended outcome. These metrics are harder to game because they are not controlled by the team's estimation decisions. They are also harder to collect and harder to aggregate, which is why velocity persisted despite its limitations.

The engineering leader who stops measuring velocity should replace it with something specific, not with nothing. "We don't measure velocity" and "we have no throughput model" are not the same thing, but they are easy to conflate.
