---
title: "Kubernetes Operators: When to Build One and When to Stop at CRDs"
description: "Operators extend Kubernetes with custom domain logic. But writing an operator is a significant commitment — the control loop, the reconciliation logic, the RBAC, the upgrade path. Here's when operators solve real problems and when simpler alternatives are enough."
date: 2025-02-05
tags: ["Cloud Architecture", "Containers", "Programming"]
format: article
---

Kubernetes Operators are applications that extend the Kubernetes API with domain-specific knowledge. An operator for a database might know how to perform a rolling upgrade, manage backups, handle leader election, and respond to member failures — all through standard Kubernetes primitives like CustomResourceDefinitions (CRDs) and reconciliation loops.

The concept is genuinely powerful. The reality is that most teams don't need to write operators; they need to use the right ones that already exist, and understand when a simpler pattern (a Helm chart, a simple CRD with a scripted reconciler) is appropriate.

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

**Enforcing organizational policies as code**: an operator that watches Deployments and ensures every deployment has required labels, has resource limits set, and uses an approved base image registry can enforce policies across the cluster without requiring every team to remember them.

**Automating Day 2 operations for your own platform**: if you run a platform where teams provision databases or queues through self-service, an operator that responds to a `DatabaseInstance` CRD and provisions the actual database (in an RDS instance, or in the cluster, or in a managed service) provides consistent, auditable provisioning without manual steps.

## When an operator is overkill

**You just need a ConfigMap with watch logic**: if the use case is "run a script when a ConfigMap changes", a sidecar container or an init container with `kubectl watch` is simpler than a full operator.

**You want to wrap a Helm chart with some defaults**: Helm's values system and pre/post hooks cover most needs. An operator that creates Helm releases is usually unnecessary complexity.

**The lifecycle logic is simple enough for shell scripts**: operators shine for complex, stateful lifecycle management. For "create a namespace and some RBAC when a team is onboarded", a Helm chart with a pre-install hook is simpler.

**You don't have the bandwidth to maintain an operator**: operators are running software that needs updates as Kubernetes evolves, security patches, and fixes when edge cases emerge. The maintenance cost is real. Don't write an operator without committing to that maintenance.

## The scaffolding: Kubebuilder vs Operator SDK

**Kubebuilder**: the reference implementation from the Kubernetes SIG. Scaffolds a Go project with controller-runtime, generates CRD manifests from Go type annotations, provides webhooks for validation and defaulting. The right choice for Go developers building operators that will be maintained long-term.

**Operator SDK**: wraps Kubebuilder with additional features — Ansible operator support, Helm operator support (wrap an existing Helm chart as an operator), and OLM (Operator Lifecycle Manager) integration for distribution via OperatorHub. More accessible if your team isn't writing Go.

The Helm operator mode is worth understanding: you define a CRD and point the operator at a Helm chart; the operator applies the chart values whenever the CR is created or updated. For simple cases, this is a 80% solution with 20% of the effort of writing a controller.

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

*Building a Kubernetes operator or deciding whether an operator is the right pattern for a use case? [Happy to think through the design.](/contact)*
