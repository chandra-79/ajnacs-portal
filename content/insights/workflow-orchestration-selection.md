---
title: "Workflow Orchestration: Airflow, Temporal, Step Functions, and Choosing by Workload Shape"
description: "Compare Airflow, Temporal and Step Functions using process shape, execution semantics, retry budgets and a concrete recovery exercise."
date: 2027-01-06
tags: ["Distributed Systems", "Data Engineering", "Programming", "Cloud Architecture", "Architecture"]
format: article
---

"We need workflow orchestration" is a sentence that launches a hundred mismatched tool evaluations, because it names a symptom — multi-step processes duct-taped together with cron, queues, and prayer — rather than a workload. The orchestration market is really **several overlapping tool families with different workload strengths**, and most selection pain comes from evaluating across families: comparing Airflow to Temporal is comparing a dishwasher to a washing machine because both involve water. Here's the taxonomy, the representative tools, and the placement rules.

## Family one: batch/data orchestrators (Airflow and descendants)

The shape: **scheduled DAGs of coarse-grained tasks over data** — extract, transform, load, validate, publish; hourly and nightly rhythms; tasks that are containers or queries taking minutes; success meaning "the data landed correctly." Apache Airflow remains the incumbent vocabulary here, with Dagster and Prefect as the modern refinements (Dagster's asset-oriented model — declaring the *data assets* and deriving the pipeline — being the significant conceptual upgrade: orchestrating *what should exist* rather than *what should run*, which is where the data world has been heading).

What this family is good at: scheduling with calendars and sensors, backfills (rerun last March after the logic fix — a first-class, load-bearing operation), dependency visualization, retry-with-alerting on task granularity, and the operational sociology of data teams (analysts reading DAG UIs). Evaluate scheduling latency and scale against the deployment; no scheduler automatically makes external effects transactional (compensation logic and exactly-once side effects are your problem, per the usual idempotency disciplines). The classic misuse: putting order processing or payment flows into Airflow because it was already installed — request-driven business transactions in a batch scheduler inherit batch latency and none of the transactional guarantees they need.

## Family two: durable execution (Temporal and kin)

The shape: **long-running, failure-sensitive business processes** — order fulfillment, onboarding, payment orchestration, infrastructure provisioning; often triggered by events, though schedules are also supported; running seconds to months; where the hard requirement is *process state must survive supported failures and expose a clear recovery path*. Temporal (and the durable-execution family around it — Cadence lineage, cloud offerings, newer entrants) solves this with a genuinely different architecture: **workflow-as-code with replay** — your workflow is code whose workflow history records the events and commands needed for deterministic replay; when a worker dies, another replays the history and continues as if nothing happened. State management, retries, timers ("wait 30 days, then..."), and the saga compensations discussed elsewhere become *language-native constructs* instead of hand-built state machines in database tables.

The price: the **determinism contract** (workflow code must replay identically — no direct I/O, clocks, or randomness in workflow logic; side effects live in activities — a real discipline with real code-review implications and a learning curve teams consistently underestimate), the operational platform itself (self-hosted Temporal is a serious stateful system; managed and self-hosted options have different control and operational tradeoffs), and versioning of in-flight workflows (long-running instances spanning deploys need explicit change-management — solvable, standard, but a discipline the cron job never asked of you). The payoff, equally real: durable history can make partial processes queryable and resumable; workflows can still stall on business failures, invalid code or unavailable dependencies.

## Family three: cloud-native state machines (Step Functions and peers)

The shape: **glue between managed services** — the S3-upload-triggers-processing pipeline, the approval flow chaining Lambdas and queues, the ML batch job coordinating cloud services. Step Functions (and Azure/GCP equivalents) define workflows as declarative state machines (JSON/YAML), integrate natively with the provider's service catalog (direct service invocations without wrapper code), and have managed control planes and billing that depends on the workflow type, such as transitions or execution duration.

Strengths: reduced control-plane operations, deep provider integration, honest durability, and drag-and-drop legibility for simple flows. Limits: expressiveness (complex branching and data manipulation in declarative JSON becomes write-only origami — the sign you've outgrown the family), portability (the definition *is* the vendor), testing ergonomics (local simulation exists but the feedback loop trails code-native approaches), and cost at very high volume (per-transition pricing compounds). The placement rule: brilliant for cloud-service choreography of modest complexity; evaluate code-based durable execution when declarative logic becomes difficult to maintain.

## The selection framework, and the estate reality

Three questions place almost any workload. **What triggers it?** Calendar/data-arrival → family one; business event/API call → family two or three. **What's the failure requirement?** "Rerun the batch" → family one; "must resume mid-process with compensations" → family two; "retry the step" → any. **Where does the logic live?** In data transformations → one; in code with complex business rules → two; in wiring between managed services → three.

And the estate-level truths that outrank tool zeal: **mature estates legitimately run one of each** (the data platform on Airflow/Dagster, transactional processes on Temporal-class, cloud glue on Step Functions) — consolidation across families buys contortion, not simplicity (the *within*-family sprawl — four Airflow instances, say — is what deserves consolidation). **The workflow layer is production infrastructure, not scaffolding**: it needs the same observability (per-run tracing, stuck-run alerting by age — the "no workflow silently stalls" invariant), the same CI (workflow definitions are code: reviewed, tested, versioned), and the same security posture (orchestrator and worker identities need only the permissions required by their tasks — they're privileged-automation surfaces per the IAM disciplines, and a compromised orchestrator is a compromised estate). And **estimate the full cost before building a workflow engine**: the hand-rolled workflow engine — a status column, a poller, a growing pile of edge cases — is among the most-repeated infrastructure mistakes of the past decade; compare the full persistence, recovery and operational cost of a custom state machine with adopting an existing platform.

The compact placement rule to leave in the design review: **data on schedules → Airflow-family; money and state machines in code → Temporal-family; cloud-service wiring → Step Functions-family** — with idempotent steps everywhere, because execution guarantees differ by product and mode while external effects still require an explicit retry contract.

## Begin with a process inventory rather than a tool ranking

Write down three representative workflows from the actual product. One might rebuild a daily analytics partition, another might provision a tenant after an approval, and a third might coordinate a cloud batch job. For each, record the trigger, expected lifetime, external systems touched, completion objective, retry policy, cancellation behavior and human interventions. The same organization can have all three shapes, and one product can support more than one. The categories above are evaluation aids, not hard capability boundaries.

A batch rebuild cares about input partitions, reproducibility and replacement of derived output. Tenant provisioning cares about partial resources, duplicate requests and long waits for approval. A cloud batch workflow cares about service integration, credentials, quotas and tracking the remote job to completion. A product that draws an attractive dependency graph may still lack the recovery behavior needed by one of these processes. Evaluate a concrete failure scenario before comparing dashboard screenshots.

## Worked retry budget with an ambiguous effect

Consider a synthetic provisioning step whose first two attempts fail safely before any resource is created and whose third attempt succeeds. Each attempt runs for two seconds. The retry policy waits five seconds after the first failure and ten seconds after the second. Ignoring queueing, total elapsed time is two plus five plus two plus ten plus two, or 21 seconds. The figure shows cumulative completion times of 2, 9 and 21 seconds after the three attempts.

This arithmetic is useful for checking a deadline, but it depends on the failures being safely retryable. Change the second failure to a timeout after the remote service creates the resource. A third attempt with a new resource identifier could now create a duplicate. The workflow engine cannot infer the remote state merely from its timeout. Use a stable operation key, query the existing resource, or reconcile the uncertain outcome before advancing.

The example also excludes scheduling delay and shared capacity. If the worker queue waits for 40 seconds, a 21-second retry calculation does not meet a 30-second end-to-end objective. Track queue delay, execution duration, backoff and external waiting separately. An operator should be able to tell whether a workflow is actively doing work, deliberately waiting, unable to obtain a worker or stuck on an unresolved external result.

## Understand replay and execution guarantees at their boundaries

Temporal records workflow history and uses deterministic replay to reconstruct workflow state. Ordinary local variables are not each stored as individual durable records. The workflow code must produce compatible commands when replaying the existing history; external work belongs in activities or the SDK's documented mechanisms. Use workflow-safe time and randomness APIs where provided instead of ordinary nondeterministic calls. Activity retries and external side effects still need their own idempotency design.

A code change can be valid for a newly started workflow while being incompatible with histories already in progress. Include workflow versioning, worker deployment strategy and replay tests in the release process. A workflow that waits for a month may outlive several deployments. Retaining the ability to process its existing history is an operational requirement, not an optional convenience after the feature ships.

Step Functions also has different execution models rather than one universal at-least-once rule. Its documentation distinguishes Standard workflow execution, asynchronous Express and synchronous Express. Standard follows an exactly-once workflow execution model with configured retries as an explicit exception; asynchronous Express is at least once, and synchronous Express is at most once. These workflow-level descriptions do not make arbitrary remote effects atomic with local application state. Evaluate retry and unknown-outcome behavior at every service boundary.

Airflow provides task scheduling, dependencies and operational state, but a successful task state does not by itself prove that a dataset is correct. Add data validation and publish outputs only after the required checks. A task retry or backfill must use the intended data interval and output identity. Appending the same rows again because a run was retried is an application design error even if the scheduler behaved exactly as configured.

## A comparative failure lab

Implement the smallest representative workflow in each serious candidate. Use a fake resource API that supports a stable idempotency key and can deliberately lose a success response. Include a wait for an external approval and a cancellation request. Stop a worker mid-step, restart the control plane where supported, and deploy a compatible code change while the instance is waiting. Record what an operator can inspect and how the instance resumes.

For a data workflow, add a backfill of one historical interval and verify that it does not overwrite unrelated intervals. For a provisioning workflow, cancel after one resource exists and verify whether cleanup is automatic, queued or manual. For a cloud integration, revoke the task's permission in the test environment and confirm that the resulting error is distinguishable from a transient service failure. Retrying an authorization failure indefinitely obscures the actual problem and consumes resources.

Score the candidates on evidence: correct final state, visibility of unknown outcomes, safe retries, version compatibility, cancellation handling and recovery effort. Also record the parts that require custom code. A managed service may remove server patching while still requiring substantial domain recovery logic. A self-hosted platform may offer desired control while introducing backup, upgrade and capacity responsibilities. Neither tradeoff is captured by a feature checkbox alone.

## Operational ownership and cost worksheet

Assign an owner to workflow definitions, worker code, credentials, control-plane health and unresolved business cases. Use narrowly scoped identities for activities or service integrations. A central orchestrator need not receive unrestricted access to every system merely because it coordinates them. Redact secrets and sensitive payload fields from histories and logs according to the platform's actual capabilities and retention settings.

Build the cost model from workload units: started workflows, state transitions, worker compute, active waiting, retained histories, logging and data transfer. Different workflow types use different billing dimensions; do not apply per-transition pricing to every mode. Preserve the region, date and assumptions when using live prices. Long waits may be computationally cheap while still increasing history retention, operational visibility and lifecycle-management needs.

The final decision record should state the chosen process shape, its tested failure behavior and the remaining obligations of the application. Set alerts on oldest unresolved work and user-visible completion objectives, not only worker CPU or scheduler availability. Durable orchestration makes progress and history more manageable; it does not remove business rejection, missing permissions, incompatible code or an external system that never confirms an action. A complete workflow includes a reviewable path for those outcomes.

### Figure methodology

Synthetic attempts each take 2 seconds, with backoffs of 5 then 10 seconds. Cumulative times are 2, 2+5+2=9 and 9+10+2=21 seconds. Queueing, jitter and external uncertainty are excluded; this is a retry-budget exercise, not a product benchmark.

| Worked observation | elapsed seconds |
| --- | ---: |
| First attempt ends | 2 |
| Second attempt ends | 9 |
| Third attempt succeeds | 21 |

## Primary references and further study

- [Apache Airflow: architecture overview](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/overview.html)
- [Temporal: workflow execution and replay](https://docs.temporal.io/workflow-execution)
- [AWS: Step Functions workflow types and execution semantics](https://docs.aws.amazon.com/step-functions/latest/dg/choosing-workflow-type.html)
