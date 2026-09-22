---
title: "Monitoring AI Models in Production: The Observability Stack Nobody Talks About"
description: "Your application monitoring tells you when a service is down. It doesn't tell you when your model has been giving subtly wrong answers for three weeks. Here's how to build the monitoring that does."
date: 2025-04-21
tags: ["AI & MLOps", "Observability", "Infrastructure"]
format: article
---

Application observability for AI models is a different problem from infrastructure observability. Prometheus and Grafana will tell you if your inference endpoint is down, response times are high, or error rates have spiked. They won't tell you that your model has been silently degrading — giving answers that are plausible but wrong — for the past four weeks.

That's the monitoring gap that matters for AI systems, and it requires a different approach.

---

## The three things you actually need to monitor

**1. Input distribution drift**  
The distribution of data coming into your model should look similar to the distribution it was trained on. When it doesn't — when new categories appear, when feature distributions shift, when seasonal patterns change — the model's performance degrades in ways that may not be visible in your accuracy metrics (because you often don't have ground truth labels for real-time inference data).

Practical approach: log a representative sample of inference inputs. Compute statistical summaries (mean, standard deviation, percentile distributions) for numerical features and frequency distributions for categorical features. Compare these against the baseline from your training data on a scheduled basis. Alert when distributions diverge significantly.

**2. Output distribution drift**  
The distribution of model predictions should also stay relatively stable. If your binary classifier used to output 60% positive predictions and is now outputting 80%, something has changed — either in the inputs or in the model's behavior. This doesn't necessarily mean the model is wrong, but it's a signal that deserves investigation.

**3. Model quality metrics against delayed ground truth**  
For many business use cases, you can get ground truth eventually — just not in real time. Fraud predictions can be evaluated against confirmed fraud outcomes (days later). Churn predictions can be evaluated against actual churn (weeks later). Recommendation predictions can be evaluated against click and conversion data (hours later).

Build pipelines that join predictions to delayed ground truth and compute quality metrics on a regular schedule. This is the most direct measure of whether your model is actually performing — and it's what most teams skip.

---

## Practical instrumentation

The minimum instrumentation that makes the above possible:

```python
import json
import time
from datetime import datetime

def log_prediction(input_features, prediction, model_version, request_id):
    record = {
        "timestamp": datetime.utcnow().isoformat(),
        "request_id": request_id,
        "model_version": model_version,
        "prediction": prediction,
        "confidence": prediction.get("confidence"),
        # Log a sample of input features (not all — consider PII)
        "feature_summary": {
            k: v for k, v in input_features.items()
            if k in ["category", "amount_bucket", "user_segment"]  # non-PII features
        }
    }
    # Write to your logging system — CloudWatch, Azure Monitor, GCS, etc.
    log_to_store(json.dumps(record))
```

The key decisions:
- **What to log from inputs:** you need enough to detect distribution shift, but not PII or sensitive data. Log statistical buckets, categories, and derived features rather than raw values.
- **Sampling rate:** logging every prediction at high volume is expensive. Sample at 5-10% for routine monitoring; log 100% for model evaluation cohorts.
- **Prediction metadata:** always log model version, confidence/probability, and a request ID that can be joined to application logs and ground truth.

---

## Tools worth knowing

**Evidently AI** — open source library for generating data drift reports and model quality reports. Can be run as a batch job comparing inference data to a baseline. Generates HTML reports and integrates with monitoring systems. Good starting point.

**WhyLogs / WhyLabs** — statistical profiling library that generates compact statistical summaries of datasets, designed for monitoring at scale. The summaries (called "profiles") can be compared over time to detect drift without storing raw data.

**MLflow** — primarily a training and registry tool, but the model monitoring features are growing. Good for tracking metrics over model versions.

**Azure ML Data Drift Monitor** — if you're on Azure ML, the built-in data drift monitoring is reasonable and integrates with Azure Monitor for alerting.

**SageMaker Model Monitor** — similar to Azure's offering for the AWS ecosystem. Scheduled monitoring jobs that generate reports and integrate with CloudWatch.

None of these are complete solutions. They're building blocks that need to be wired together into a monitoring pipeline. The work is in the integration, not the tool selection.

---

## What to do when you detect drift

Detection without a response plan isn't useful. Before you deploy a model to production, define:

- **Alert thresholds** — at what level of drift do you alert? At what level do you escalate to model retraining?
- **Investigation runbook** — when drift is detected, who investigates, and what do they look for?
- **Rollback procedure** — if the model is actively degrading, can you roll back to a previous version? How fast?
- **Retraining triggers** — what conditions trigger model retraining? Who approves the new model before it replaces the current one?

The teams that handle model drift well are the ones where these questions were answered before the first incident, not during one.

---

Monitoring AI models in production is not glamorous work. Nobody talks about it the way they talk about model architectures or training techniques. But it's what determines whether your model is actually delivering value three months after deployment or quietly becoming a liability.

*Building monitoring for a production model? [Reach out — happy to help think through the design.](/about)*
