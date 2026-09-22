---
title: "Why ML Models Fail at Deployment (And Almost Never at Training)"
description: "Training metrics and production performance are measured differently, on different data, against different success criteria. The gap between them is where most ML projects die."
date: 2027-05-19
tags: ["Enterprise AI", "AI & MLOps"]
format: article
---

The model achieves 94% accuracy on the test set. The team is satisfied. The model ships to production. User feedback starts arriving: the model is wrong constantly, in patterns that seem obvious in retrospect.

The training metrics were real. The production performance is also real. They measure different things.

## The training-production gap

**Distribution shift.** The training data represents the world as it was when the data was collected. Production data represents the world as it is now. In domains where the world changes — fraud patterns, user language, product catalog, market conditions — a model trained on historical data drifts in predictive quality as time passes. The model learned the old distribution. Production has a new distribution.

**Label shift.** The test set labels were created by a labeling process that may not match the ground truth in production. Annotators who disagreed systematically in one direction produce training data with systematic bias. The 94% accuracy on the test set is 94% accuracy on the labels — which may not be 94% accuracy on the thing you actually care about.

**Feedback loop contamination.** In production, model outputs influence future data. A recommendation model that surfaces popular items produces user behavior that increasingly confirms that popular items are good, because users are mostly seeing popular items. The training data for the next model is contaminated by the previous model's outputs.

**Input preprocessing differences.** The training pipeline preprocesses data one way. The production inference pipeline preprocesses data a slightly different way. Someone changed the tokenizer. A numerical feature is normalized differently. These differences are typically small individually and catastrophic collectively.

## Where deployment actually fails

Most ML deployment failures are not model failures. They are infrastructure failures:

- The feature pipeline in production computes features slightly differently than the training pipeline
- The serving infrastructure has a memory limit that causes batch size reduction, which changes throughput and latency characteristics
- Model serialization introduces floating-point precision differences
- The monitoring is set up for traditional software metrics (latency, error rate) and not for model-specific metrics (prediction distribution, feature drift)

The deployment fails silently. The model is running. Predictions are returned. The error rate is zero. The model is just wrong — but not in a way that the monitoring catches, because the monitoring was never configured to detect it.

## The fix

Train and serve with the same feature pipeline, or test exhaustively that they are equivalent. Monitor prediction distributions, not just infrastructure metrics. Set up alerts for input distribution shift. Have a retraining trigger when performance degrades, not a manual retraining schedule. Test the deployment on recent data before full rollout.

None of these are novel. All of them are frequently skipped.
