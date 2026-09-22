---
title: "Every team measures time to deploy. Almost none measure time to value."
description: "DORA metrics provided the engineering industry with a credible, research-backed set of measures for delivery performance."
date: 2028-12-15
tags: ["Engineering Leadership", "Architecture"]
format: article
derived: true
---

DORA metrics provided the engineering industry with a credible, research-backed set of measures for delivery performance. Deployment frequency, lead time for changes, change failure rate, and mean time to recovery are genuinely useful. They are also exclusively pipeline metrics — they measure the efficiency of the delivery process, not the effectiveness of what gets delivered.

A team with excellent DORA metrics can be consistently delivering software that does not solve user problems. They ship frequently, with low failure rates, and recover quickly from incidents. The features they ship are not adopted, the metrics they were designed to move do not move, and the business outcomes they were supposed to enable do not materialise. From a DORA perspective, this team is high-performing. From a product perspective, they are efficient waste producers.

The full lead time includes everything from problem identification to validated outcome: the time a user need exists before it is translated into a product requirement, the time requirements spend in backlog before they enter development, the time in development before deployment, and the time post-deployment before the team knows whether the feature achieved its intended effect.

Teams that engineer the full lead time make different decisions. They invest in feature flags and experimentation infrastructure because you cannot measure whether a feature works without the ability to run experiments. They track adoption metrics alongside deployment metrics because deployment is not the finish line. They treat the discovery phase as a process with a duration, not a precondition that happens at indeterminate speed before "real work" begins.

The DORA metrics are worth tracking. They become more valuable when paired with outcome metrics that validate the business effect of what was delivered. Efficiency without effectiveness is a fast path to delivering the wrong thing well.
