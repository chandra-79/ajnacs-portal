---
title: "Kubernetes Operators: When to Build One and When to Stop at CRDs"
description: "Operators extend Kubernetes with custom domain logic. But writing an operator is a significant commitment — the control loop, the reconciliation logic, the RBAC, the upgrade path. Here's when operators solve real problems and when simpler alternatives are enough."
date: 2025-02-05
tags: ["Cloud Architecture", "Containers", "Programming"]
format: article
---

Kubernetes Operators are applications that extend the Kubernetes API with domain-specific knowledge. An operator for a database might know how to perform a rolling upgrade, manage backups, handle leader election, and respond to member failures — all through standard Kubernetes primitives like CustomResourceDefinitions (CRDs) and reconciliation loops.

The concept is genuinely powerful. The reality is that most teams don't need to write operators; they need to use the right ones that already exist, and understand when a simpler pattern (a Helm chart, a simple CRD with a scripted reconciler) is appropriate.

## What to measure

**Reconciliation time and steady-state churn.** If 150 objects converge within the target in a 160-object recovery drill, success within target is 93.75%. Track p95 convergence time, API errors and reconciles per unchanged object to detect needless writes.

*Illustrative measurement. Any numbers in this example are hypothetical.*

## The controller pattern that operators implement

Kubernetes is declarative. You describe the desired state; Kubernetes (and operators) work to make actual state match desired state continuously.

An operator implements a **reconciliation loop**: watch for changes to resources of a specific type (your CustomResource), and whenever a resource is created, updated, or deleted, reconcile actual state toward desired state.

The canonical structure:

```go
func (r *DatabaseReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    // Fetch the resource
    db := &myv1.Database{}
    if err := r.Get(ctx, req.NamespacedName, db); err != nil {
        return ctrl.Result{}, client.IgnoreNotFound(err)
    }

    // Check current state
    existing := &appsv1.StatefulSet{}
    err := r.Get(ctx, types.NamespacedName{...}, existing)
    
    if errors.IsNotFound(err) {
        // Desired state: database exists. Actual state: StatefulSet doesn't.
        // Action: create it.
        return ctrl.Result{}, r.createStatefulSet(ctx, db)
    }
    
    // Reconcile differences between desired and actual
    if needsUpdate(db, existing) {
        return ctrl.Result{}, r.updateStatefulSet(ctx, db, existing)
    }
    
    // Update status
    db.Status.Phase = "Running"
    return ctrl.Result{}, r.Status().Update(ctx, db)
}
```

The reconciler is called on every relevant change, and is expected to be **idempotent** — running it multiple times has the same effect as running it once.

## When an operator makes sense

**Managing stateful applications with complex lifecycle operations**: databases (PostgreSQL operator, MySQL operator, MongoDB Enterprise operator), messaging systems (Strimzi for Kafka), and search engines (Elastic Cloud on Kubernetes) are the canonical operator use cases. The reason: their operational procedures (rolling upgrades that preserve data, backup scheduling, failover promotion) require domain knowledge that generic Kubernetes primitives don't capture.

**Repairing drift** can be a controller responsibility after an object is accepted. Use admission policy to prevent newly submitted objects from violating required labels, resource rules or registry policies.

**Automating Day 2 operations for your own platform**: if you run a platform where teams provision databases or queues through self-service, an operator that responds to a `DatabaseInstance` CRD and provisions the actual database (in an RDS instance, or in the cluster, or in a managed service) provides consistent, auditable provisioning without manual steps.

## When an operator is overkill

**You just need a ConfigMap with watch logic**: if the use case is "run a script when a ConfigMap changes", If the application needs one continuous watch, a supporting process with scoped permissions may be sufficient. Regular init containers must complete before the application starts.

**You want to wrap a Helm chart with some defaults**: Helm's values system and pre/post hooks cover most needs. An operator that creates Helm releases is usually unnecessary complexity.

**The lifecycle logic is simple enough for shell scripts**: operators shine for complex, stateful lifecycle management. For "create a namespace and some RBAC when a team is onboarded", a Helm chart with a pre-install hook is simpler.

**You don't have the bandwidth to maintain an operator**: operators are running software that needs updates as Kubernetes evolves, security patches, and fixes when edge cases emerge. The maintenance cost is real. Don't write an operator without committing to that maintenance.

## The scaffolding: Kubebuilder vs Operator SDK

**Kubebuilder**: the reference implementation from the Kubernetes SIG. Scaffolds a Go project with controller-runtime, generates CRD manifests from Go type annotations, provides webhooks for validation and defaulting. The right choice for Go developers building operators that will be maintained long-term.

**Operator SDK**: wraps Kubebuilder with additional features — Ansible operator support, Helm operator support (wrap an existing Helm chart as an operator), and OLM (Operator Lifecycle Manager) integration for distribution via OperatorHub. More accessible if your team isn't writing Go.

The Helm operator mode is worth understanding: you define a CRD and point the operator at a Helm chart; the operator applies the chart values whenever the CR is created or updated. For simple cases, This may reduce implementation work when chart values and release management cover the required behavior.

## The CRD without an operator: validating admission webhooks

Sometimes you want a custom resource type — for configuration management, for developer self-service APIs — without the full operator pattern. A CRD with a validating admission webhook (which validates resources on create/update) and a mutating webhook (which sets defaults) can serve this purpose.

This is appropriate when: the resource is primarily declarative (just stores configuration), lifecycle management is handled separately, and you want the Kubernetes API to be the interface (kubectl, GitOps workflows) but don't need continuous reconciliation.

## Existing operators worth knowing

Before writing an operator, check if one exists:
- **databases**: CloudNativePG (PostgreSQL), MySQL Operator for Kubernetes, Percona operators
- **Kafka**: Strimzi, Confluent Platform for Kubernetes
- **secrets**: External Secrets Operator (pulls from AWS/Azure/GCP secrets managers)
- **certificates**: cert-manager (certificate lifecycle management, ACME protocol)
- **monitoring**: Prometheus Operator (manages Prometheus, Alertmanager, and ServiceMonitor CRDs)
- **service mesh**: Istio Operator, Linkerd Control Plane

The ecosystem of mature, production-ready operators is large enough that most infrastructure needs are covered. Writing your own should be reserved for domain-specific logic that doesn't have an existing solution.

*Building a Kubernetes operator or deciding whether an operator is the right pattern for a use case? [Happy to think through the design.](/contact/)*

## Define the API independently from the controller

Start by listing the decisions that a developer should own and the decisions that an operator should derive. An application team can choose a database service class and retention tier. The operator can select the approved instance pattern and publish the observed endpoint through an appropriate interface. A field that reflects current health belongs with observed state, so an update to desired settings does not overwrite an operational signal. Reserve explicit conditions for situations readers can act on, such as provisioning pending, invalid configuration, degraded service, or access denied. Include the generation observed by the controller so a previous healthy condition does not look current after a change.

Keep the public fields stable enough to outlive one application implementation. Validate ordinary constraints in the schema and document defaults. Reach for a webhook when the validation or conversion genuinely needs one. A custom API that calls out to an unreliable service on every write can turn validation into an outage. Decide what clients see if the dependency is down and retain a recovery path. A Kubernetes CRD can use structural schema validation and defaulting, so a webhook is unnecessary for many constraints. See the [CustomResourceDefinition guide](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/).

## Reconcile to a durable outcome

The controller can receive more than one event about the same object. It may restart after the external provider accepted an operation and before the outcome was recorded in status. Use the resource identity and a stable external reference or provider idempotency mechanism to find and adopt the operation that already exists. Persist a checkpoint where retryability depends on knowing what happened. Pending can be a useful state. Declaring the resource ready after a request was accepted is premature if it is still being provisioned or is not reachable through its approved path.

Imagine a fictional operator managing 200 database instances. It watches a provider event stream and also checks every resource once per minute to repair missed events. The periodic checks alone can add about 3.3 provider reads per second before any retries, changes, or writes. If the interval changes to ten seconds, the average becomes 20 reads per second, and checks can arrive in more concentrated bursts when the controller restarts. Compare that to the shared quota and the restoration goal before changing the interval. Add spread and a bounded worker pool if the provider cannot handle synchronized work. Measure queue waiting separately from provider latency so tuning reconciliation does not hide a saturated dependency.

Avoid unneeded writes to custom resource status. Compare the desired conditions with published conditions before updating them, and preserve the distinction between a changed condition and an identical observation. Treat a stale write conflict as a signal to fetch recent state and recalculate. Use bounded retries with backoff and a permanent failure condition for invalid input that will not succeed by retrying. If the resource needs human action, make the status explain who can resolve it and what evidence they should bring. A controller issuing the same failing API write forever makes recovery harder.

## Make deletion and ownership explicit

Decide before release what must happen when a user removes the object. The default for a persistent asset might be to retain it and emit a handoff record. Other resources may be safe to discard after a validated retention window. A finalizer can hold an object in a terminating state while an operator performs required cleanup or verifies the handoff. Removing it should follow verified completion. Rehearse a provider outage during deletion and have an authorized manual procedure for stuck resources that accounts for the external asset. Unexpected removal can cost data or leave services accruing charges without an owner. See [the Kubernetes finalizer documentation](https://kubernetes.io/docs/concepts/overview/working-with-objects/finalizers/).

Verify the ownership model for related in-cluster and external resources. A deleted configuration object should not accidentally remove a resource another application still needs. If two teams are allowed to claim the same provider object, document how conflicting desired state is resolved. An operator that overwrites legitimate manual recovery actions without a handoff mechanism can undo the work of the on-call team. Provide an approved pause or maintenance mode where needed, and define how reconciliation resumes and catches up after that mode ends.

## Test failures across version changes

Unit-test decisions against stored descriptions of desired and observed state. Then test against a real API server or a representative disposable cluster for schema defaulting, optimistic concurrency, deletion, and permissions. Use a controllable provider adapter to simulate delayed responses, accepted operations whose response is lost, and read-after-write delays. Restart the controller after the provider step to verify that it recognizes existing work. For a stateful asset, restore a test backup and verify content as well as health. A newly restored instance that answers a connection probe can still contain the wrong data.

Exercise mixed versions of the client, controller, and custom resource. If there is a CRD version change, record which version is stored and what conversion is deployed before removing compatibility. Keep a small collection of previously stored objects for upgrades, covering valid defaults, unusual optional fields, and resources in a partially complete state. Revert the controller during a rehearsal and confirm that prior code can correctly observe objects written by the new code or that the change has a separate forward recovery plan. Avoid promising controller rollback when a change to stored state cannot be reversed safely.

At review time, compare the controller to an existing supported operator, a managed service API, or a bounded one-time workflow. A controller earns its maintenance cost when continually bringing state back into alignment produces a meaningful reduction in manual handling or improves reliability. Collect evidence from a small recovery test and an upgrade before broadening the contract. If the team cannot explain what happens after a failed provider call and a restart, it has more design work to do before extending the same pattern to additional infrastructure.
