# AI into production

## Release a policy assistant only when its answers cite the right version
@meta grounded-policy-assistant | Build an answer evaluation for source support, current policy and justified abstention.
@flow Freeze policy corpus | Retrieve eligible passages | Verify answer and citation | Confirm or abstain
@metric Answerable cases with fully supported answers | % | 134/180 | 159/180
@metric Unanswerable cases correctly handed off | % | 8/40 | 31/40
@ref NIST · Generative AI Profile | https://doi.org/10.6028/NIST.AI.600-1

### Situation and scope

A service desk wants an assistant for internal policy questions. The pilot covers one published policy collection with a revision date and named owner. An answer must quote or cite supporting current policy and hand off policy gaps. Set 85% full support on answerable questions and at least 80% appropriate handoff on unanswerable ones.

### Plan and execution

Create a versioned fixture with ordinary questions, similar policies with conflicting dates, and requests with no answer. Freeze the examples before testing. Review retrieval and answer quality separately: an author can locate the needed passage manually when retrieval misses it. Add revision and effective-date filters, give the model a bounded answer format, and require passage-to-claim verification by a human reviewer for the acceptance set.

### Rollout and handover

Run in shadow with reviewed replies before exposing output to a pilot group. Release to one policy team only after meeting both gates. Keep the existing human route, corpus update ownership, and a quick way to pause answers after an incorrect policy change. Deliver reviewed examples alongside the evaluation rubric.

### How to read the numbers

The same 180 answerable and 40 unanswerable synthetic requests are scored twice using one rubric. The pilot clears the support gate and misses the handoff gate by one case. Inspect the remaining unsupported outputs before broadening the release.

## Put human approval between an AI recommendation and a record update
@meta approval-before-record-change | Let an assistant draft the change while an accountable user confirms the exact write.
@flow Read current record | Draft validated change | Authorised reviewer approves | Write once and audit
@metric Correct routing suggestions | % | 152/200 | 179/200
@metric Changes recorded without required approval | changes | 12 | 0
@ref NIST · Generative AI Profile | https://doi.org/10.6028/NIST.AI.600-1

### Situation and scope

A support team wants suggestions for moving tickets between queues. The assistant may propose a routing change. The application authorises the write and ties it to a human approval of the exact record, current version and proposed queue. The release requires zero unapproved state changes in the fixture and a clear recovery path for a bad approval.

### Plan and execution

Define a finite set of queues and legitimate transitions. Build a read-only proposal stage and publish a form that shows the evidence and exact proposed update. On submit, the backend revalidates the current record version and the reviewer's authority. Make accepted requests idempotent. Include tests for stale proposals, withdrawn access, duplicated clicks and malformed responses.

### Rollout and handover

Start with suggestions only. Observe how reviewers handle uncertain recommendations and add a feedback reason for overrides. Use scoped authorisation and audit records when enabling writes for one team. Hand over a reversible queue transition procedure and approve rollback ownership in the support platform before widening use.

### How to read the numbers

Use 200 paired synthetic tickets, with separate failure cases to test the write boundary. Correct suggestion rate measures usefulness. Zero unauthorised writes in the fixture confirms the expected boundary for the cases tested. It cannot replace access review and ongoing monitoring.

## Promote a registered model with a versioned rollback
@meta model-registry-canary | Pin the model and its features, test parity and route a stable canary with an explicit reversion.
@flow Register artifacts | Validate feature parity | Route consistent cohort | Revert or promote
@metric Serving p95 | ms | 155 | 141
@metric Downstream acceptance in labelled sample | % | 907/1000 | 915/1000
@ref MLflow · Model Registry | https://mlflow.org/docs/latest/ml/model-registry/workflow/

### Situation and scope

A catalogue categorisation model receives a re-trained candidate. Its previous promotion procedure published weights independently of feature and label definitions. A new release has to preserve version lineage, remain within 180 ms p95, and avoid a drop of more than two percentage points in pre-defined critical category slices.

### Plan and execution

Register the artifact with training run, feature schema, label mapping and serving image. Verify the deployed input transformation matches the one used in evaluation. Replay a frozen, independently labelled dataset and separate high-traffic labels from rare ones. Route a stable cohort to the candidate, capture both version identifiers, and verify that operators can restore traffic to the pinned last-good model and service image.

### Rollout and handover

Review latency and errors immediately. Wait for labels when judging output quality. Keep the old model and schema-compatible features available through the observation period. Hand over the dashboard with per-slice views, a release record, and the action needed for upstream feature incompatibility.

### How to read the numbers

Both models see the same 1,000 labelled synthetic requests. Aggregate acceptance rises by eight cases. That small change cannot establish a reliable improvement and can hide regressions in rare labels. Require evidence for the agreed slices before promotion.

## Revoke document access without leaving stale retrieval results
@meta retrieval-permission-refresh | Test permission changes, deletion and cached results across ingestion, search and response.
@flow Apply source entitlement | Version content and ACL | Authorise each retrieval | Revoke and verify
@metric Queries that returned withdrawn content | % | 16/120 | 0/120
@metric p95 time to reflect a grant change | minutes | 67 | 6
@ref NIST · Generative AI Profile | https://doi.org/10.6028/NIST.AI.600-1

### Situation and scope

An internal search assistant indexes selected documents. Ownership changes can leave snippets active after a user loses access. Include the retrieval index, cached answers and source links. Target zero policy violations in the entitlement test and propagation within ten minutes for 95% of timed grant changes. Deny when the current authorisation cannot be resolved.

### Plan and execution

Track source version and access metadata at chunk creation. Enforce current caller permissions at service retrieval, with access decisions outside the model. Identify all caches and key them for the applicable entitlements or avoid caching restricted results. Test membership changes, deletion, moved folders and partial index updates. Verify the answer and citation resolve only to currently accessible records.

### Rollout and handover

Introduce scoped corpora first. Recheck source identity for any share link and log access decisions without copying sensitive content into model traces. Demonstrate a failed entitlement update reaching the fallback. Assign deletion reconciliation and audit review to the corpus owner and document incident routing.

### How to read the numbers

The 120 paired attempts begin after scripted entitlement changes. A separate 40-change fixture measures propagation time. The timing quantile does not demonstrate immediate revocation. A request-time access check is still necessary when stale index data may exist.

## Choose a threshold for review instead of accepting every suggestion
@meta selective-classification-threshold | Compare harmful errors and coverage after routing low-confidence predictions to people.
@flow Sample real-shaped tickets | Calibrate on held-out data | Choose a review cutoff | Monitor coverage and errors
@metric Automatically accepted suggestions | % | 500/500 | 365/500
@metric Incorrect automatic suggestions among all requests | % | 61/500 | 22/500
@ref scikit-learn · Probability calibration | https://scikit-learn.org/stable/modules/calibration.html

### Situation and scope

An issue classifier is allowed to make low-cost routing decisions and send ambiguous work to a human. Set a maximum review queue of 150 issues per 500 and require fewer than 25 incorrect automatic suggestions on the locked validation fixture. Use output scores associated with the defined class, and track performance by queue.

### Plan and execution

Split tuning, calibration and evaluation data before choosing a threshold. Compare the default acceptance rule to several candidate thresholds on the calibration set. Report error among automatically accepted suggestions and incorrect automatic suggestions per total eligible requests. Involve team leads in sizing the manual queue. Score rare classes separately and preserve an operator override.

### Rollout and handover

Enable automation for agreed classes and cap volume. Watch the review queue, time to resolve, recent input mix and customer-facing errors. Pause automatic actions when quality or staffing drops below the agreed floor. Hand over the threshold rationale, current calibration data and the cadence for reevaluation.

### How to read the numbers

Both policies see 500 synthetic requests. The new policy routes 135 to review, within the example capacity. Of the 365 accepted suggestions, 22 are incorrect, an error rate of about 6.0% among accepted items. Among all requests, the error share is 4.4%. Keep those two denominators visible.

## Evaluate demand forecasting with the calendars the model actually saw
@meta time-aware-forecast-evaluation | Replace random holdouts with rolling cutoffs, point-in-time features and a seasonal baseline.
@flow Freeze historical snapshots | Train as of cutoff | Forecast future horizon | Replay and compare
@metric Mean absolute forecast error | units per item-day | 19.8 | 16.4
@metric Forecasts with known stockout history | % | 162/2000 | 162/2000
@ref scikit-learn · TimeSeriesSplit | https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.TimeSeriesSplit.html

### Situation and scope

A fulfilment team needs a seven-day demand forecast. Its early model looked strong with a random train/test split. The new acceptance test requires improvement over last week's same-day forecast across locked time folds and review of every feature produced after order close.

### Plan and execution

Choose fixed origins and consistent horizons. Recreate the feature values available at each forecast time. Compare against a seasonal naive baseline and use an evaluation gap when needed for label delays. Treat stockouts as a censoring caveat because observed sales can understate demand. Review errors by item volume and holiday periods before claiming a single average benefit.

### Rollout and handover

Run in shadow for at least one restocking cycle and compare forecast snapshots issued on time. Publish fallback rules for missing features or a stale model. Hand over the dataset snapshots, scoring job and threshold for manual review when inventory circumstances depart from training.

### How to read the numbers

The example compares the seasonal baseline and candidate over 2,000 synthetic item-days using the same folds. MAE is about 17.2% lower. Both models have identical stockout-marked exposure, but those observations require a distinct error interpretation.

## Make daily scoring recoverable after a partial write
@meta batch-scoring-recovery | Rerun a scheduled model job without duplicate output and require a manifest before consumers can read it.
@flow Snapshot source and model | Write staged shards | Validate row manifest | Publish one version
@metric Duplicate published rows after injected retry | rows | 184 | 0
@metric Median delay from scheduled start | minutes | 43 | 58
@ref Apache Airflow · Best practices | https://airflow.apache.org/docs/apache-airflow/stable/best-practices.html

### Situation and scope

A warehouse uses daily demand scores in a replenishment dashboard. A task restart sometimes publishes a subset twice. The next workflow has to finish within 75 minutes, make incomplete output invisible to consumers, and reproduce a prior date using the same code, model and source snapshot.

### Plan and execution

Use a deterministic scoring run identity built from the partition date and immutable input and model versions. Write temporary shards and validate distinct record keys, expected count and schema before committing a durable manifest or warehouse transaction. Inject a crash after the first shard and another after the manifest. Verify recovery distinguishes committed and incomplete runs.

### Rollout and handover

Publish the candidate in a parallel location until the dashboard owner approves equivalence. Flip ownership for one operating cycle and keep the previous version readable. Alert on missing manifests, stale dates or mismatched counts. Hand over retry instructions and retention rules for inputs and predictions.

### How to read the numbers

Ten paired synthetic runs contain the same workload and failure schedule. The recorded delay increases by 15 minutes. The median is within the example deadline and observed duplication falls to zero. Count deadline misses before approving rollout. Measure compute and storage costs before adopting it for every model.

## Reduce AI cost per accepted answer while keeping the quality gate
@meta model-routing-unit-cost | Route ordinary queries to a smaller model with a reviewable escalation path and a per-accepted-answer cost ledger.
@flow Classify workload | Route to appropriate model | Review answer with one rubric | Compare allocated cost
@metric Allocated inference and review cost | USD | 54 | 36
@metric Accepted answers | % | 430/500 | 422/500
@metric Cost per accepted answer | USD | 0.12558 | 0.08531
@ref FinOps Foundation · Unit Economics | https://www.finops.org/framework/capabilities/unit-economics/

### Situation and scope

A documentation assistant sends every question to one model. The pilot tests cheaper routing for routine queries, retains the same acceptability rubric, and requires at least 84% accepted answers at a lower cost per accepted answer. Scope inference and review time consistently across the two runs.

### Plan and execution

Define routing by observable workload attributes and permit escalation when the first response lacks the required evidence. Replay a sealed test mix with blinded reviewers. Count failed calls, escalation and human review cost in both scenarios. Analyse highly technical and ambiguous questions separately so changes on easy cases cannot hide drift where errors matter.

### Rollout and handover

Expose one opt-in cohort to the pilot and cap delays from double calls. Keep the previous route ready and track manual escalation load. Hand over cost reconciliation, a versioned evaluation set and the owner authorised to pause a route. Recompute the denominator through the [cloud cost guide](/insights/cloud-unit-economics/).

### How to read the numbers

The 500 synthetic cases yield 430 and 422 approved answers. Cost per accepted answer falls from roughly 12.56¢ to 8.53¢. The candidate meets the example's aggregate 84% gate with 84.4%. Review pass rates on high-impact slices before promotion.
