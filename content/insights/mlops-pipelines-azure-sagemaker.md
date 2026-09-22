---
title: "MLOps Pipelines That Actually Work: Lessons from Azure ML and SageMaker"
description: "Training a model is the easy part. Getting it into production reliably, keeping it there, and knowing when it's degrading — that's the engineering. Here's what I've found building MLOps pipelines on Azure ML and AWS SageMaker."
date: 2026-07-30
tags: ["AI & MLOps", "Cloud Architecture"]
format: article
---

There's a version of ML engineering that stops at model accuracy. Build the model, hit the target metric, hand it to someone else to "deploy". That workflow produces models that make it to production once and are never touched again — until they silently degrade and someone notices six months later that the predictions have been wrong.

MLOps exists to close that loop. Here's what the loop actually looks like when it's working.

---

## The five components that matter

Before getting into platform specifics: the components of a working MLOps pipeline don't change much regardless of what platform you're on.

1. **Data pipeline** — ingesting, validating, and transforming data for training and inference. If your data is wrong, everything downstream is wrong.
2. **Training pipeline** — reproducible, parameterised, tracked. Any training run should be reproducible from its logged parameters.
3. **Model registry** — a versioned store of trained models with metadata (training date, dataset version, metrics, who approved it).
4. **Deployment pipeline** — the path from model registry to serving endpoint, with appropriate testing gates.
5. **Monitoring** — tracking model performance in production, detecting drift, alerting when intervention is needed.

Most teams have 1 and 2. Teams with mature MLOps have all five.

---

## Azure ML: what it does well

Azure ML is a complete MLOps platform with deep integration into the Azure ecosystem. The things I've found it does particularly well:

**Pipelines as YAML.** Azure ML pipelines are defined declaratively in YAML, versioned in Git, and triggered via Azure DevOps or GitHub Actions. This makes ML pipelines first-class citizens of your existing CI/CD practices rather than something separate.

**Managed endpoints.** Deploying a registered model to a real-time or batch endpoint is straightforward. The platform handles the compute, scaling, and blue/green deployment. You define the scoring script and the environment; Azure handles the rest.

**Data versioning.** Azure ML datasets support versioning natively. This means you can pin a training run to a specific version of your dataset and reproduce it exactly later.

**The model registry.** Straightforward, well-integrated, supports tagging and metadata. You can promote models through environments (dev → staging → production) with approval gates.

**Where it gets complicated:** Azure ML's compute configuration can be opaque, and debugging failures in remote training jobs is harder than it should be. Local development that mirrors cloud behavior requires careful setup. The SDK has also changed significantly across versions — documentation sometimes reflects older patterns.

---

## SageMaker: what it does well

AWS SageMaker is broader — it encompasses everything from data labelling to model training to inference. The parts I've found most useful in production:

**SageMaker Pipelines.** Similar to Azure ML pipelines in concept, defined in Python using the SageMaker SDK. More flexible than YAML-based definitions but requires more code.

**Training jobs.** SageMaker's managed training infrastructure handles distributed training well. The spot instance integration for training jobs is genuinely useful for cost — training jobs that can tolerate interruption are significantly cheaper.

**Model Monitor.** The built-in monitoring capability detects data drift and model quality degradation. It runs as a scheduled job, compares current inference data against a baseline, and generates reports. Not perfect, but a reasonable starting point for production monitoring.

**Batch Transform.** For offline batch inference on large datasets, SageMaker's batch transform is simpler than running your own batch processing infrastructure.

**Where it gets complicated:** SageMaker's breadth is also its complexity. There are multiple ways to do most things, and the right path isn't always obvious. The IAM configuration is genuinely intricate — getting permissions right across SageMaker, S3, ECR, and KMS takes more effort than it should. The local SageMaker runtime helps but doesn't fully mirror the cloud environment.

---

## What neither platform handles well out of the box

**Feature stores across training and inference.** Both platforms have feature store offerings (Azure ML feature store, SageMaker Feature Store), but in my experience they require significant investment to use effectively and the consistency guarantees between training-time and inference-time features are something you have to think through carefully.

**A/B testing for models.** Routing a percentage of production traffic to a new model version alongside the current one, measuring performance on real traffic, and automatically promoting or rolling back — this exists conceptually on both platforms but requires custom implementation to do properly.

**Explaining model decisions.** Both platforms have integrations with explainability tools (SHAP, LIME), but wiring these into a production pipeline where you can audit the decision on a specific prediction is still significant custom work.

**Cross-team governance.** Who can promote a model to production? What approvals are needed? What happens when a model in production needs to be rolled back? These governance questions aren't answered by the platforms — you need to build processes and tooling around them.

---

## The monitoring gap that bites everyone

The most common MLOps failure mode I've encountered: teams invest in training pipelines and deployment pipelines, and then treat production as "done". The model is deployed. It's generating predictions. End of story.

What's not being tracked: whether the distribution of incoming data has changed relative to the training distribution, whether prediction accuracy has degraded on recent data, whether the model is encountering inputs it wasn't trained on.

Model drift is quiet. It doesn't throw exceptions. It generates subtly wrong answers that only become visible when a business metric eventually degrades or a user complains.

At a minimum: log a sample of inputs and predictions to a durable store, compute drift metrics on a schedule, and alert when drift metrics cross a threshold. The implementation doesn't need to be sophisticated — but it does need to exist.

---

## The practical recommendation

Start with the platform your team already knows. If you're on Azure, use Azure ML — the integration with your existing Azure infrastructure, DevOps pipelines, and identity management is genuinely valuable. If you're on AWS, SageMaker gives you enough to build a production-grade pipeline without introducing a separate tool.

The framework matters less than the discipline: versioned data, tracked experiments, a model registry, deployment gates, and production monitoring. Get these five things working before worrying about anything else.

*Building or reviewing an MLOps setup? [Happy to think through specific design questions.](/about)*
