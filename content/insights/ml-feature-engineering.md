---
title: "Feature Engineering for Production ML: What Makes the Difference Between a Model That Works and One That Ships"
description: "Feature failures can undermine production ML even when the model itself is unchanged. The features are inconsistent between training and inference, stale, or encode information the model shouldn't have access to."
date: 2027-08-30
tags: ["AI & MLOps", "Data Engineering"]
format: article
---

Feature engineering is the process of transforming raw data into the input representations that a model uses for prediction. In academic settings, this is often treated as a preprocessing step — clean the data, engineer some features, train the model. In production, feature engineering is an ongoing operational concern with its own failure modes, latency requirements, and governance questions.

The failures are predictable and well-documented. Understanding them before they occur is cheaper than investigating them after.

## Training-serving skew

Training-serving skew is one important source of ML model degradation in production. It occurs when the features used during training are computed differently from the features served at inference time.

A concrete example: during training, "average purchase value in the last 30 days" is computed from a full historical dataset in a batch job. At inference time, the same feature is computed from a real-time database query. If the training computation handles null values differently from the inference computation, or if the training dataset has different data quality characteristics than production data, the model is effectively being asked to make predictions on different inputs than it was trained on.

Shared transformation code, versioned outputs and parity tests can reduce this risk. A feature store can help coordinate definitions and historical retrieval, but it is not mandatory and does not automatically eliminate skew.

## Point-in-time correctness

A subtler version of training-serving skew is point-in-time leakage: features in the training dataset that encode information that would not have been available at the time the prediction would have been made.

Example: a fraud detection model trained to predict whether a transaction is fraudulent. If the training feature "number of fraud reports on this account in the last 7 days" is computed using the full historical record (including reports that came in after the transaction), the model is trained on information it cannot have at inference time (when the transaction happens, future fraud reports don't exist yet). The model will appear to perform well in training and fail in production.

Constructing a training dataset with correct point-in-time features requires joining on time: for each training example at time T, compute features using only data that existed before T. This is more complex than a naive join and requires explicit time-bounded feature computation.

## Feature freshness

For real-time inference, feature freshness matters. A "user's activity in the last hour" feature computed 6 hours ago is stale. For latency-sensitive applications, features need to be pre-computed and cached, with a refresh frequency appropriate to how quickly they change.

Feature freshness SLAs:
- How frequently does this feature change?
- How stale can the feature be before it meaningfully degrades prediction quality?
- What is the cost of computing this feature in real-time versus pre-computing and caching?

Features derived from slowly-changing data (user demographic information) can be pre-computed infrequently. Features derived from rapidly-changing signals (real-time activity, recent transactions) need either real-time computation or high-frequency pre-computation.

## The feature store

A feature store is the infrastructure layer that addresses these concerns. Key capabilities:

**Consistent feature computation**: feature definitions live in the feature store, not scattered across training pipelines and inference services. Both read from the same definitions.

**Offline store (training)**: historical feature values, with point-in-time correct retrieval. Typically backed by a data warehouse or lakehouse.

**Online store (inference)**: low-latency key-value store for real-time feature retrieval. Pre-computed features written by a batch or streaming pipeline, retrieved by the inference service.

**Feature monitoring**: distribution monitoring on computed features — detecting when feature values have shifted significantly, which is often an early signal of data quality issues upstream.

Options include open-source feature-store frameworks, managed services and simpler versioned pipelines. Evaluate point-in-time semantics, online serving and operating cost against actual requirements.

## Feature governance

In production ML systems with multiple models, feature reuse is both a benefit (reduced computation, consistency) and a governance challenge. If Feature A is computed by Team X and used by five models across three teams, a change to the computation logic for Feature A affects all five models.

Good feature governance practices:
- Feature documentation: what does this feature measure, how is it computed, what are the known limitations?
- Feature owners: who is responsible for the correctness and freshness of a feature?
- Deprecation process: how is a feature retired without breaking models that depend on it?
- Change notification: who gets notified when a feature's computation logic changes?

These questions are as important as the technical implementation. A feature store without governance is a shared dependency that breaks silently.

*Building out a feature engineering and feature store infrastructure? The right approach depends heavily on model latency requirements and team structure. [Happy to think through the design.](/contact)*

## A feature is a contract with a clock

Define the entity, measurement, unit, time window, availability time and missing-value behavior. A field named `purchase_count_30d` is incomplete without saying whether the current transaction is included, which timezone defines the boundary and whether cancelled purchases count. Those choices can change the model input while leaving the column name and type unchanged.

Event time and availability time answer different questions. An event may occur at 10:00 but arrive in the data platform at 10:15. A prediction made at 10:05 could not have used it, even though its event timestamp precedes the prediction. Historical reconstruction needs to respect what the serving path actually knew, including late arrivals and later corrections.

Document whether the feature is computed from a mutable source or an immutable event history. A backfill can repair analytics while unintentionally leaking future knowledge into a training set. Keep the original availability metadata and define the retrieval semantics. The fact that a feature store offers point-in-time joins does not guarantee that every configured source captures this distinction correctly.

## Worked example: future information inflates a feature

Consider a hypothetical account assessed at noon. Three purchases are relevant to a 24-hour feature window: $40 occurred at 09:00 and was available at 09:01; $60 occurred at 11:00 but arrived at 12:30; $100 occurred at 13:00. At noon, the serving system legitimately knows only the $40 purchase.

An event-time-only historical join can include the first two purchases and produce $100, even though the $60 event was not yet available. A naive end-of-day aggregation includes all three and produces $200. The chart compares the correct available-at-decision value of $40, the event-time-only value of $100 and the end-of-day value of $200.

These synthetic values show two distinct leaks: late-arriving information and future events. The event-time-only feature is $60 too high, or 150% above the correct $40 value. The end-of-day feature is $160 too high, or 400% above it. Those percentages describe this constructed feature error, not a prediction-accuracy effect. Whether the model's decision changes depends on its learned relationship and threshold.

To reproduce the example, store each purchase with entity identifier, amount, event timestamp and available timestamp. At the noon cutoff, require both timestamps to be no later than noon and require event time to fall within the defined lookback window. In a real system, availability must reflect the serving path rather than an arbitrary ingestion timestamp from a different pipeline.

## Missingness is information with consequences

Do not silently replace every missing value with zero. Zero purchases, unknown purchase history and a failed feature lookup represent different states. The model may need separate indicators or a fallback path. Use the same interpretation during training and serving, and evaluate what happens when missingness increases during an upstream outage.

Defaults should be versioned. Changing a missing age from a median value to zero can change predictions across a large population without altering model weights. A feature owner should identify downstream consumers and coordinate the migration. An apparently harmless data cleanup can be a behavioral deployment.

Monitor valid range, null rate, freshness and entity coverage. A stable average can hide a lookup failure concentrated in new accounts. Compare missingness by relevant segment and source. Avoid treating a drift alert as proof that the model needs retraining before checking the data contract itself.

## A practical feature-parity lab

Create a small synthetic event table containing ordinary purchases, a cancellation, a duplicate event and a late arrival. Implement the feature once as a batch transformation and once through the intended serving path. For selected decision timestamps, compare the exact values and status flags. Use hand-calculated expected values for the small fixture so both implementations cannot agree on the same unnoticed mistake.

Add tests for window boundaries, timezone conversion, duplicate suppression and missing entities. Include a corrected event whose new value becomes available after the decision. Decide whether the historical reconstruction should show the value known then or the corrected value for retrospective analysis; both can be useful, but they are different datasets and need different names.

The worksheet should record feature version, entity, decision time, source event identifiers, computed value, freshness and expected value. When a discrepancy appears, classify it as definition mismatch, timing mismatch, source incompleteness or implementation error. That classification directs the fix more effectively than a general complaint about training-serving skew.

## Release features with their consumers

A model expects a particular feature schema and semantics. Deploying a new feature definition while an old model remains active can invalidate the tested configuration. Use versioned features or a coordinated release, and test rollback with both old and new consumers. Keep incompatible values out of the same unversioned field.

For a streaming feature, rehearse replay and recovery. Restarting a consumer can duplicate counts unless state and offsets are managed correctly. A late event may require an update to a previous window rather than the current one. The right behavior depends on the feature's contract, so write it down before selecting an implementation.

Finally, measure feature value as well as infrastructure cost. A rarely used expensive feature may add little predictive benefit, while a simple freshness fix may improve many models. Ablation studies and consumer inventories help prioritize work. The aim is a dependable set of inputs whose meaning can be reconstructed, not an ever-growing catalog of transformations nobody can safely change.

## Sources and further study

- [Feast — Point-in-time joins and availability timestamps](https://docs.feast.dev/getting-started/concepts/point-in-time-joins)
- [scikit-learn — Common pitfalls and data leakage](https://scikit-learn.org/stable/common_pitfalls.html)
- [Breck et al. — The ML Test Score](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/)
