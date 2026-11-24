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

### Build a trace that tells the reviewer what failed

Each answer should carry the collection revision, query time, and exact passage identifiers the model saw. A reviewer can then distinguish three repairs. If the current passage never reached the model, investigate search or the index. If the passage arrived and the answer cites a superseded copy, inspect evidence selection or revision logic. If the answer cites the right passage and extends it to an unsupported category of employees, tighten the answer rubric and validate that judgment with a second reviewer.

Keep relevant policy passages at the same level of specificity. A document about reimbursement can be relevant without saying which expenses an employee can claim. Record the minimum evidence needed for each high-impact assertion, and require all such assertions to pass before marking an answer fully supported. Include explicit exceptions and date boundaries in the review notes.

### Revisit the failed gate before running the pilot

The illustrative handoff target of 80% needs at least 32 correct decisions out of 40. A result of 31 does not clear it. Sorting those 40 questions by missing policy, conflicting text, and applicability can show whether the weakness is concentrated in one path. Add blind examples from the same categories before changing the system, and verify that the new abstention rule does not withhold answers that have strong evidence. The [Microsoft retrieval evaluation guide](https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/rag-evaluators) separates retrieval measures from measures for the final answer.

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

### Bind approval to the proposed change

Store a pending proposal with the exact ticket identifier, observed record version, allowed destination, and expiration. Show those fields to the reviewer together with the current queue. When the reviewer confirms, the backend checks the reviewer’s present authority and applies the proposal only if the expected record version is still current. If another operator moved the ticket first, show the new state and require fresh approval. A sentence from the model or a note in the ticket has no effect on that decision.

Use a proposal identifier in the write transaction. If the reviewer loses the response and presses confirm again, the same identifier should return the earlier outcome without a second transition. Give reversals their own audit event. An undo action should restore the earlier queue only if that reversal is still valid for the current ticket.

### Define a fixture that isolates the boundary

A fictional review run uses five states for each transition. It tests an approved write, rejection, expiry, reviewer access removal, and version change. Score one outcome per proposal and inspect the stored ticket history, since an error message alone cannot tell whether the record was touched. Measure how often the model suggests the right queue separately from whether the application performs the right write. See the [NIST Generative AI Profile](https://doi.org/10.6028/NIST.AI.600-1) for ways to document human oversight and operational testing.

Record the expected reviewer and authorisation scope beside each fixture outcome for audits.

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

### Make a rollback restore the whole serving contract

A registry entry should point to a model artifact and a record of the feature order, transformations, and label dictionary it expects. Store the serving image digest and the revision of the endpoint configuration with the release. Before the canary, replay a small set of known requests through both deployments and log the transformation version beside the predicted class. A correct model running against differently encoded inputs can fail before traffic or latency gives an obvious clue.

Keep the previous feature path readable while its model is still the fallback. Rehearse rollback with one request already in flight and a second arriving after the switch. Confirm which deployment answers each and verify that downstream systems interpret both outputs correctly. A rollback procedure that restores the image but leaves new preprocessing enabled is incomplete.

### Inspect a slice big enough to matter

Suppose 50 of the illustrative replay cases belong to a rarely used category. A two-case decline in that slice equals four percentage points, enough to miss the stated two-point gate even if total acceptance improved. Preserve the slice denominator in the release record and classify repeated requests from the same account before drawing conclusions. The [MLflow registry workflow](https://mlflow.org/docs/latest/ml/model-registry/workflow/) explains model versions and aliases. Keep the exact version in the rollout record even when the serving system also uses an alias.

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

### Separate revocation enforcement from cleanup

An access change affects two different processes. The retrieval request must enforce the latest resolvable authorisation before it supplies text to the model. A worker can then update or remove stale search entries. The cleanup worker’s elapsed time is useful for operations, but the time until a revocation is respected depends on the request-time check. A result that begins before an access change needs an explicit rule about whether it may complete. For stronger revocation requirements, recheck before releasing any answer built from restricted passages.

Inspect hybrid search results, generated summaries, browser history, and citation targets independently. A citation link protected by its source does not protect the sentence the application already displayed. Verify both a current member and a recently removed member against the same documents. Check that a stale cache cannot override a denial and that an unavailable authority service routes to the documented fallback.

### Compare the event record to what the user can see

In a synthetic replay, freeze the document revision and vary the caller’s membership. Save only identifiers and decision codes in the diagnostic report. Count a restricted snippet in the answer as a failed check even if the source link correctly refuses access. Track grants with a separate timer because delayed permission increases affect availability, while delayed revocation affects confidentiality. The [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) provides a basis for recording the controls and their owners.

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

### Translate the decision into reviewer capacity

The example’s 135 routed requests leave room for 15 more cases under the limit of 150 per 500 arrivals. At an illustrative three minutes per review, that is 405 minutes of work for the pilot block. If arrivals bunch at peak time, seven reviewer hours spread across a week may not meet the queue’s deadline. Estimate the peak arrival rate and work that reviewers can clear in that interval. Record escalations and reassignments so the capacity forecast includes the work that falls outside a normal first pass.

A higher acceptance threshold can send more cases to review. Estimate the resulting workload for each relevant queue. If staffing is limited, defer eligible traffic or keep a queue on manual processing rather than dropping a guardrail for higher-risk tickets. The decision belongs with the owner of that queue.

### Recheck calibration when the mix changes

Split a calibration plot into score bands and show the number of cases and percentage correct in each. Sparse bands give little evidence about how a new threshold will behave. Keep the locked validation fixture for regression checks and gather a fresh, representative labelled sample after rollout. Record the share of arriving cases that are reviewed and the error share of automatic decisions. The [scikit-learn calibration guide](https://scikit-learn.org/stable/modules/calibration.html) explains why the reliability of a model’s reported probability requires separate evaluation.

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

### Reconstruct the forecast as it would have appeared

For each historical origin, select feature versions by the timestamp at which the forecasting system could consume them. A promotion plan changed on Tuesday does not belong in a forecast issued on Monday even if both rows refer to the same week. Store the feature snapshot, forecast creation time, target horizon, and arrival time of the observed outcome together. Freeze the seasonal baseline using the same availability rules.

An illustrative timing test uses sales for two weeks and a promotion confirmed after the first origin. Run both folds, then deliberately add the late promotion to the first fold. The test should flag the input as unavailable even if that change improves the reported score. Keep restored or corrected stock records separate from what operators could see at the origin.

### Interpret stockouts and error by horizon

Report absolute error at each horizon so an improvement on tomorrow’s forecast cannot hide a decline on day seven. Flag cases where a stockout prevents sales from recording full demand. A forecast above observed sales in that slice may represent excess inventory or censored demand. Where possible, check backorders or alternative availability signals before deciding. The [time-series split documentation](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.TimeSeriesSplit.html) describes ordered train and test indices. The application still needs to reconstruct when each feature and label became available.

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

### Place the publication boundary where consumers can verify it

Define a partition identifier and immutable input, model, and code versions before starting. Each attempt writes to its own staging location. The consumer reads only a committed version whose manifest records the shard names, row counts, and checksum or another integrity check the consumer can validate. If two attempts finish concurrently, pick one via a transaction or a conditional write supported by the storage layer. A list of files observed by a directory scan cannot establish that publication is complete.

A committed manifest should be visible only after all its referenced shards are durable. Hold previous committed versions until any readers that rely on them have finished. Clean incomplete attempts using a retention rule and verify that the cleanup path cannot delete data reachable from a committed manifest.

### Measure recovery against the day’s deadline

In an illustrative replay, inject a crash before manifest publication, then inject a second fault immediately after publication and before the scheduler receives confirmation. The first retry should finish or replace staging. The second should discover the already published version and verify its identity. Track deadline misses and p95 delay as well as the median. A correct late prediction can still be unusable for a dashboard that has already informed replenishment. [Apache Airflow’s best practices](https://airflow.apache.org/docs/apache-airflow/stable/best-practices.html) describe how to design tasks that can safely retry.

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

### Look for the break-even point in the cost ledger

Write a separate line for the first model call, routing overhead, any escalation, and human review. If a fictional small call costs one cent, a larger call costs eight cents, and routing costs one cent per request, the expected inference expense is two cents plus eight cents times the escalation share. At 25% escalation that is four cents. At 75% it reaches eight cents, equal to calling the larger model directly under these illustrative rates. Include costs such as output processing and idle capacity if they differ between routes.

The pilot’s per-accepted-answer comparison also depends on answer quality. Count every submitted eligible question in the original sample. A system that drops difficult questions can appear cheaper among completed answers while serving fewer users. Show first-pass acceptance, eventual acceptance, and time to a useful answer alongside retry and escalation volume.

### Preserve a reviewable fallback

Version the policy that identifies ordinary questions, limit repeated calls per question, and specify who can disable the route. Separate cached repeat queries from new queries during the replay. A burst of repeated questions could otherwise make a model change look better than its expected performance on new work. The [FinOps Unit Economics guidance](https://www.finops.org/framework/capabilities/unit-economics/) covers the choice of cost and business output measures.
