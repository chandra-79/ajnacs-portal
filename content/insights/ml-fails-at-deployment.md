---
title: "Most ML models fail at deployment, not at training — and this surprises teams that shouldn't be surprised"
description: "Good offline evaluation metrics are necessary for a production-ready ML model. They are not sufficient."
date: 2026-03-31
tags: ["Enterprise AI", "AI & MLOps"]
format: article
---

Good offline evaluation metrics are necessary for a production-ready ML model. They are not sufficient. The gap between an evaluation score and production behavior is where most ML projects encounter their most expensive surprises.

The reasons the gap exists are well understood, which makes the frequency with which teams are surprised by it genuinely puzzling.

**Distribution shift**: the training data distribution doesn't match the production data distribution. The model performs well on historical data from the last six months and encounters a seasonal pattern, a market shift, or a user behavior change that wasn't represented in training. Performance degrades quietly.

**Feature availability**: a feature that was available during training — derived from data that's populated at record creation — isn't available at inference time because the inference request arrives before that data is populated. The model silently uses a fallback or null value. The evaluation metrics were never calculated on this case.

**Aggregate metric masking**: the overall accuracy looks good. The accuracy for a particular user segment, geography, or input pattern is significantly worse, and the aggregate metric hid this.

**No production monitoring**: degradation starts, there are no monitors watching for it, and the team learns about it from user complaints that arrive weeks later.

The practices that close the gap: evaluate on a representative sample of production-like data, define feature availability contracts before training starts, include monitoring as a deployment requirement, and evaluate on subgroup performance, not just aggregate metrics.

Training metrics are a starting point, not a destination.
