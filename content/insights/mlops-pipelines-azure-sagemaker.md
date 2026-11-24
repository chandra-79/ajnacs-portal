---
title: "MLOps Pipelines That Actually Work: Lessons from Azure ML and SageMaker"
description: "Training a model is the easy part. Getting it into production reliably, keeping it there, and knowing when it's degrading — that's the engineering. Here's what I've found building MLOps pipelines on Azure ML and AWS SageMaker."
date: 2024-12-19
tags: ["AI & MLOps", "Cloud Architecture"]
format: article
---

There's a version of ML engineering that stops at model accuracy. Build the model, hit the target metric, hand it to someone else to "deploy". That workflow produces models that make it to production once and are never touched again — until they silently degrade and someone notices six months later that the predictions have been wrong.

MLOps exists to close that loop. Here's what the loop actually looks like when it's working.

## What to measure

**Model promotion with evaluation and rollback.** Count promotions that pass data, model and deployment gates. If 18 of 20 candidates pass but one promoted version must be reverted, report both the 90% gate pass rate and the rollback. Measure how long the previous serving version takes to recover service.

*Illustrative measurement. Any numbers in this example are hypothetical.*

## The five components that matter

Before getting into platform specifics: the components of a working MLOps pipeline don't change much regardless of what platform you're on.

1. **Data pipeline** — ingesting, validating, and transforming data for training and inference. If your data is wrong, everything downstream is wrong.
2. **Training pipeline** — reproducible, parameterised, tracked. Any training run should be reproducible from its logged parameters.
3. **Model registry** — a versioned store of trained models with metadata (training date, dataset version, metrics, who approved it).
4. **Deployment pipeline** — the path from model registry to serving endpoint, with appropriate testing gates.
5. **Monitoring** — tracking model performance in production, detecting drift, alerting when intervention is needed.

Most teams have 1 and 2. Teams with mature MLOps have all five.

## Azure ML: what it does well

Azure ML is a complete MLOps platform with deep integration into the Azure ecosystem. The things I've found it does particularly well:

**Pipelines as YAML.** Azure ML pipelines are defined declaratively in YAML, versioned in Git, and triggered via Azure DevOps or GitHub Actions. This makes ML pipelines first-class citizens of your existing CI/CD practices rather than something separate.

**Managed endpoints.** Deploying a registered model to a real-time or batch endpoint is straightforward. The platform handles the compute, scaling, and blue/green deployment. You define the scoring script and the environment; Azure handles the rest.

**Data versioning.** Azure ML data assets support versioned references. Confirm that the underlying objects are immutable or snapshotted as well. Reproducing a run also depends on its code, dependencies, configuration and environment.

**The model registry.** Straightforward, well-integrated, supports tagging and metadata. You can promote models through environments (dev → staging → production) with approval gates.

**Where it gets complicated:** Azure ML's compute configuration can be opaque, and debugging failures in remote training jobs is harder than it should be. Local development that mirrors cloud behavior requires careful setup. The SDK has also changed significantly across versions — documentation sometimes reflects older patterns.

## SageMaker: what it does well

AWS SageMaker is broader — it encompasses everything from data labelling to model training to inference. The parts I've found most useful in production:

**SageMaker Pipelines.** Similar to Azure ML pipelines in concept, defined in Python using the SageMaker SDK. More flexible than YAML-based definitions but requires more code.

**Training jobs.** SageMaker's managed training infrastructure handles distributed training well. The spot instance integration for training jobs is genuinely useful for cost — training jobs that can tolerate interruption are significantly cheaper.

**Model Monitor.** AWS documents that SageMaker Model Monitor is no longer open to new customers and remains available to existing users. Feature-distribution checks and model-quality checks answer different questions. Quality monitoring requires ground truth joined to inference outputs. Verify equivalent capabilities in the monitoring pipeline you can actually use.

**Batch Transform.** For offline batch inference on large datasets, SageMaker's batch transform is simpler than running your own batch processing infrastructure.

**Where it gets complicated:** SageMaker's breadth is also its complexity. There are multiple ways to do most things, and the right path isn't always obvious. The IAM configuration is genuinely intricate — getting permissions right across SageMaker, S3, ECR, and KMS takes more effort than it should. The local SageMaker runtime helps but doesn't fully mirror the cloud environment.

## What neither platform handles well out of the box

**Feature stores across training and inference.** Both platforms have feature store offerings (Azure ML feature store, SageMaker Feature Store), but in my experience they require significant investment to use effectively and the consistency guarantees between training-time and inference-time features are something you have to think through carefully.

**A/B testing for models.** Routing a percentage of production traffic to a new model version alongside the current one, measuring performance on real traffic, and automatically promoting or rolling back — this exists conceptually on both platforms but requires custom implementation to do properly.

**Explaining model decisions.** Both platforms have integrations with explainability tools (SHAP, LIME), but wiring these into a production pipeline where you can audit the decision on a specific prediction is still significant custom work.

**Cross-team governance.** Who can promote a model to production? What approvals are needed? What happens when a model in production needs to be rolled back? These governance questions aren't answered by the platforms — you need to build processes and tooling around them.

## The monitoring gap that bites everyone

The most common MLOps failure mode I've encountered: teams invest in training pipelines and deployment pipelines, and then treat production as "done". The model is deployed. It's generating predictions. End of story.

What's not being tracked: whether the distribution of incoming data has changed relative to the training distribution, whether prediction accuracy has degraded on recent data, whether the model is encountering inputs it wasn't trained on.

Model drift is quiet. It doesn't throw exceptions. It generates subtly wrong answers that only become visible when a business metric eventually degrades or a user complains.

At a minimum: log a sample of inputs and predictions to a durable store, compute drift metrics on a schedule, and alert when drift metrics cross a threshold. The implementation doesn't need to be sophisticated — but it does need to exist.

## The practical recommendation

Start with the platform your team already knows. If you're on Azure, use Azure ML — the integration with your existing Azure infrastructure, DevOps pipelines, and identity management is genuinely valuable. If you're on AWS, SageMaker gives you enough to build a production-grade pipeline without introducing a separate tool.

The framework matters less than the discipline: versioned data, tracked experiments, a model registry, deployment gates, and production monitoring. Get these five things working before worrying about anything else.

*Building or reviewing an MLOps setup? [Happy to think through specific design questions.](/about/)*

## Define a candidate that can be audited and rebuilt

Begin with a run manifest. Record input snapshots, feature pipeline version, code commit, dependency and image digests, configuration, evaluation cutoff, and the immutable locations of outputs. Record the expected input shape and permissible ranges in the serving contract. Include the feature order and encodings where a model depends on them. Keep model artifacts and the components needed to serve them traceable from the same candidate record. For a deployment incident, the operator should be able to find which training run produced a prediction and which matching environment can load the previous candidate. Differences in libraries, accelerator kernels and distributed execution can affect repeatability. Define numerical tolerances and resource assumptions for a rebuild test.

A versioned data asset can reference mutable underlying objects. Confirm the retention and immutability properties of the objects it points to, then include their digests or immutable versions in the manifest. Use an evaluation cutoff that reflects what would have been known when predictions were issued. For a demand forecast issued each morning, features based on later cancellations would leak information even if both rows were processed from the same quarter. Join features using event and availability times as required. Validate both with representative production lag. Include the relevant feature snapshot, label maturity rules and observations omitted because information was missing. Report whether a pipeline rerun reuses those inputs or intentionally advances to a new snapshot.

| Stage | Evidence to retain | Example rejection |
| --- | --- | --- |
| Data preparation | Snapshot manifest, schema and time coverage | A feature arrives after the prediction cutoff |
| Training | Artifact digest, environment and run parameters | Rebuilt scoring fails the declared tolerance |
| Evaluation | Frozen cohort, baseline, metrics and reviewer decision | Aggregate gain hides a regression on a required slice |
| Deployment | Release identifier, compatibility checks and target history | A new scoring image cannot consume the live request schema |
| Monitoring | Route assignment, event times and mature outcomes | Labels have stopped joining for an important route |

## Map registry state to a durable release decision

In Azure Machine Learning, registered components can make training and evaluation steps independently reusable. Register the candidate from the pipeline output, attach its manifest, and use a versioned model asset for the target deployment. Verify the job or artifact reference identifies the same candidate digest that the evaluation report reviewed. In SageMaker Pipelines, use explicit processing, training and evaluation steps, and register the candidate in a model package group when its required checks pass. The approval status is useful in the deployment decision. Resolve a specific model package version when starting deployment. On either platform, track which release was actually deployed using the deployment’s own recorded state. [Azure ML component pipelines](https://learn.microsoft.com/en-us/azure/machine-learning/how-to-create-component-pipelines-ui?view=azureml-api-2), [Azure ML model registration](https://learn.microsoft.com/en-us/azure/machine-learning/how-to-manage-models?view=azureml-api-2), and [SageMaker model approval status](https://docs.aws.amazon.com/sagemaker/latest/dg/model-registry-approve.html).

Two candidates can clear evaluation on the same day. Require a promotion request to name the incumbent release it was tested against and the explicit candidate. Use a deployment lock or conditional update so the second concurrent request can detect that the incumbent has changed. Re-evaluate when the baseline or serving contract moves. If a train or register task retries, have it resolve the run identifier and check whether the digest already exists before writing a second record. Keep approval ownership separate from training and record who accepted the exception when evidence is incomplete. Preserve the validated environment and runtime settings for the previous release until rollback rehearsal proves they can be restored.

Test the service identity in the actual staging configuration. It needs permission to read its immutable artifact and enough approved input data to score the request. Check that it has no release approval or training role. Test permissions with the same encryption path and network restrictions as production. Resource identities can differ between model training, the registry, deployment and the running endpoint. Use a small fixture with the allowed storage and key policy before running a full-scale rehearsal, and capture the cause and role whenever startup fails. Newly deployed replicas should pass readiness with the actual scorer and a bounded synthetic prediction.

## Separate operational gates from outcome gates

Track replica health, serving errors, queue time and scoring latency first. Once a candidate is deployed alongside the incumbent, test the approved shadow route or a small weighted release depending on endpoint support. If outcomes matter days later, today's traffic produces a serving health signal and a later quality signal. Keep route assignment, scoring time, label time and candidate version so analysts can compare mature cohorts exposed to enough traffic. Record incomplete and missing predictions separately. Real serving traffic can depend on model scores, so shadow comparisons cannot measure every downstream decision or behaviour change. [Azure ML safe rollout guidance](https://learn.microsoft.com/en-us/azure/machine-learning/how-to-safely-rollout-online-endpoints?view=azureml-api-2) and [SageMaker deployment guardrails](https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails.html).

For an illustrative gate, suppose 9,500 of 10,000 eligible records score successfully, and 8,000 of the successful scores have matured enough for labels to be expected. If 7,200 join to a currently usable label, coverage among mature successful predictions is 90%. The other 800 represent a label collection gap in that cohort. The 1,500 still maturing should appear in a separate count, along with the 500 scoring failures. A quality score from the 7,200 can be biased when missingness depends on the target or a specific input category. Examine coverage by slice, monitor date and deployment version, and send the join gap to the owner who can diagnose it.

Agree on the action for every alarm. If malformed features cause failures, quarantine invalid inputs and restore a compatible feature version before deciding whether to change the model. If error rate climbs only for the new release, keep enough warm capacity to restore the previous route and verify that its served responses meet the objective. A drift alert should route to investigation, with checks for policy changes, data outages and normal seasonality. Automatic retraining needs independent training and acceptance gates, since an upstream anomaly can contaminate the next model. Capture the observed timeline to detection, rollback and stable service. Add each failure to the next staged deployment rehearsal.

## Define what happens when retraining runs late

Give the production release an owner, an expiry review date and documented criteria for staying on the last validated model. A delayed data source can produce an apparently successful training run on fewer periods than planned. Check expected row and interval coverage before device allocation or submit an explicitly marked validation-only run. Set a timeout and cost limit for expensive training retries. Evaluate the cost of the rebuild, the time to a tested candidate, and the capacity needed to keep an incumbent serving until approval. The operating result is a repeatable release path that handles stale inputs, delayed labels and interrupted deployments.
