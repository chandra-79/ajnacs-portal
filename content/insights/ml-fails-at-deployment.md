---
title: "Why an offline ML score is not a deployment readiness check"
description: "Good offline evaluation metrics are necessary for a production-ready ML model. They are not sufficient."
date: 2029-01-01
tags: ["Enterprise AI", "AI & MLOps"]
format: article
derived: true
---

Offline model quality and production service quality are different measurements. A model can score well on a held-out dataset and still fail when a required feature arrives late, preprocessing differs, or the user population changes. That does not establish that most models fail at deployment. It establishes that deployment introduces assumptions an offline score may not test.

## Make feature availability part of the contract

Suppose a hypothetical fraud model uses the number of recent failed payment attempts. During training, an analyst joins a completed transaction table that includes events arriving after the prediction time. In production, those events may not yet exist. The training feature has information the live model cannot obtain, so the apparent offline performance is misleading.

Build the training join as of the prediction timestamp. Record both event time and the time the feature became available. Test a late event, a missing value, and a corrected event. A shared transformation library helps reduce differences, but it does not by itself guarantee equivalent source data or timing.

## Look beyond an overall accuracy

The chart uses a fictional evaluation with two equally sized groups of 100 transactions. The model classifies 95 correctly in group A and 70 in group B. Overall accuracy is 165/200, or 82.5%. That average conceals a 25-percentage-point difference. The reason might be data quality, different base rates, insufficient examples, or a genuinely different task; the chart alone cannot identify the cause.

For rare outcomes, accuracy may be a poor primary metric. A model that predicts the majority class can appear accurate while missing the events the business needs to detect. Report the confusion matrix and choose precision, recall, cost, or another outcome measure that matches the decision. Keep the threshold and denominator explicit.

## Rehearse the service before promotion

Replay permitted, representative records through the actual preprocessing and serving code. Compare feature values with the training pipeline, and record where they diverge. Load-test realistic batch sizes and missing-feature behavior. A successful response with a fallback value should be distinguishable from a fully informed prediction.

Deploy initially in a mode that allows comparison without giving the model uncontrolled authority. Define a fallback, a rollback artifact, and a person responsible for responding to quality changes. Drift in an input distribution is a reason to investigate; it is not proof that retraining will help. Retraining can reproduce a data-quality problem unless the cause is understood first.

The worksheet has prediction time, feature availability, transformation version, model version, predicted outcome, eventual label, and label-arrival time. Use it to verify that the production quality estimate has had enough time to mature. The ML Test Score and the technical-debt literature explain why the surrounding system needs testing alongside the learned model.

Before closing the rehearsal, assign an owner to each unexplained mismatch. A documented discrepancy is still unresolved until someone can explain its effect on the prediction or remove it.

## Sources and further study

- [Breck et al. — The ML Test Score](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/)
- [Sculley et al. — Hidden Technical Debt in Machine Learning Systems](https://research.google/pubs/hidden-technical-debt-in-machine-learning-systems/)
