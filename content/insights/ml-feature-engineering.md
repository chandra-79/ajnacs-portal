---
title: "Feature Engineering for Production ML: What Makes the Difference Between a Model That Works and One That Ships"
description: "Most ML model failures in production are not model failures — they are feature failures. The features are inconsistent between training and inference, stale, or encode information the model shouldn't have access to."
date: 2026-04-06
tags: ["AI & MLOps", "Data Engineering"]
format: article
---

Feature engineering is the process of transforming raw data into the input representations that a model uses for prediction. In academic settings, this is often treated as a preprocessing step — clean the data, engineer some features, train the model. In production, feature engineering is an ongoing operational concern with its own failure modes, latency requirements, and governance questions.

The failures are predictable and well-documented. Understanding them before they occur is cheaper than investigating them after.

## Training-serving skew

Training-serving skew is the most common source of ML model degradation in production. It occurs when the features used during training are computed differently from the features served at inference time.

A concrete example: during training, "average purchase value in the last 30 days" is computed from a full historical dataset in a batch job. At inference time, the same feature is computed from a real-time database query. If the training computation handles null values differently from the inference computation, or if the training dataset has different data quality characteristics than production data, the model is effectively being asked to make predictions on different inputs than it was trained on.

Preventing this requires a feature store: a shared system that computes features once, stores them, and serves the same computed values for both training and inference. The training pipeline pulls features from the same store that the inference pipeline uses. Consistency is enforced by architecture, not by convention.

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

Options: managed feature stores (Feast, Tecton, SageMaker Feature Store, Vertex AI Feature Store) or custom-built using a combination of dbt/Spark for offline and Redis/DynamoDB for online.

## Feature governance

In production ML systems with multiple models, feature reuse is both a benefit (reduced computation, consistency) and a governance challenge. If Feature A is computed by Team X and used by five models across three teams, a change to the computation logic for Feature A affects all five models.

Good feature governance practices:
- Feature documentation: what does this feature measure, how is it computed, what are the known limitations?
- Feature owners: who is responsible for the correctness and freshness of a feature?
- Deprecation process: how is a feature retired without breaking models that depend on it?
- Change notification: who gets notified when a feature's computation logic changes?

These questions are as important as the technical implementation. A feature store without governance is a shared dependency that breaks silently.

*Building out a feature engineering and feature store infrastructure? The right approach depends heavily on model latency requirements and team structure. [Happy to think through the design.](/contact)*
