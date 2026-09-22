---
title: "Reserved instances are not discounts — they're financial commitments, and that distinction changes every RI decision"
description: "The \"discount\" framing for reserved instances creates bad purchasing decisions. A discount is unambiguously good — you pay less for the same thing."
date: 2025-12-01
tags: ["FinOps"]
format: note
---

The "discount" framing for reserved instances creates bad purchasing decisions. A discount is unambiguously good — you pay less for the same thing. A commitment is different: it requires that the thing you're committing to remains stable for the duration of the commitment.

An RI for a workload that gets decommissioned in eight months isn't a 40% discount. It's paying for compute you no longer need. The right question isn't "what discount does an RI give us?" It's "what percentage of our compute spend is stable enough over 12–36 months to justify a financial commitment?"

The analysis that produces better RI decisions:
- **Historical instance stability**: what churn rate do you have on this instance family and size?
- **Workload roadmap**: is this workload likely to change architecture, scale significantly up or down, or be decommissioned in the commitment window?
- **Instance flexibility**: do you have the flexibility to use Convertible RIs that allow instance family changes?
- **Coverage target**: the goal is not 100% RI coverage — it's matching RI coverage to your stable baseline, leaving variable capacity on-demand or Spot.

The organizations that mismanage RIs tend to buy them opportunistically — "these instances are running and there's a discount available" — rather than strategically, based on workload analysis. The result is good coverage numbers that don't reflect the actual utilisation of the commitments.

Treat RI purchasing as a financial planning exercise, not a purchasing optimisation.
