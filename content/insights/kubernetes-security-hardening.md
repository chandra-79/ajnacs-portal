---
title: "Kubernetes Security Hardening: The Controls That Actually Reduce Attack Surface"
description: "Default Kubernetes configurations are not production-secure. Here are the specific hardening controls — RBAC, Pod Security Standards, network policies, image policies, secrets management — that reduce attack surface and what each actually protects against."
date: 2026-04-13
tags: ["DevSecOps", "Containers", "Security"]
series: "DevSecOps Pipeline"
seriesOrder: 4
format: article
---

A Kubernetes cluster out of the box has a large attack surface. Pods can communicate freely. Containers run as root by default. Any pod can access the Kubernetes API with the default service account, which has broad permissions in many configurations. Secrets are base64-encoded, not encrypted.

None of these are unfixable. They're defaults chosen for developer convenience, not production security. Here's the set of controls I consider baseline for any production cluster.

## What to measure

**Policy enforcement coverage.** If 95 of 100 production namespaces enforce the selected policy, coverage is 95% by namespace. Weight by workloads as a second view and list exemptions with owners and expiry. Track denied admissions separately from detections.

*Illustrative measurement. Any numbers in this example are hypothetical.*

## RBAC: the principle of least privilege for cluster access

Kubernetes RBAC defines what users and service accounts can do in the cluster. The defaults are often too permissive.

The common failure: `ClusterRoleBinding` that grants `cluster-admin` to a service account or group because it was the path of least resistance when something didn't work. `cluster-admin` is full control of the entire cluster — it should never be granted to anything except emergency break-glass access.

The right approach: role-based access scoped to the namespace a team owns.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: payments
  name: payments-developer
rules:
- apiGroups: [""]
  resources: ["pods", "pods/logs", "services", "configmaps"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch", "update", "patch"]
```

Developers can view and update their deployments; they can't read secrets, modify RBAC, or interact with other namespaces.

**For workloads**: pods should have a dedicated service account with only the permissions needed. The `automountServiceAccountToken: false` setting prevents the default service account token from being mounted into pods that don't need API access — most application pods don't need to call the Kubernetes API at all.

## Pod Security Standards: replacing PodSecurityPolicy

PodSecurityPolicy (PSP) is deprecated and removed in Kubernetes 1.25. The replacement is Pod Security Standards (PSS) with the Pod Security Admission controller.

Three policy levels:
- **Privileged**: unrestricted, no security controls. For system-level infrastructure pods.
- **Baseline**: prevents known privilege escalation without breaking most legitimate workloads. Disables `hostNetwork`, `hostPID`, `hostIPC`, privileged containers, most Linux capabilities.
- **Restricted**: heavily restricted, follow security best practices. Requires non-root user, drops all capabilities, requires `seccompProfile`.

Apply at the namespace level with labels:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: payments
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/warn: restricted
    pod-security.kubernetes.io/audit: restricted
```

`enforce` blocks non-compliant pods. `warn` allows the pod but generates a warning. `audit` records to audit logs but doesn't block or warn. Roll out with `warn` first, then promote to `enforce` once workloads are compliant.

Most application workloads can run under `restricted` with these container spec settings:
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  allowPrivilegeEscalation: false
  capabilities:
    drop: ["ALL"]
  seccompProfile:
    type: RuntimeDefault
```

## Network policies: default-deny, allow explicitly

By default, every pod in a Kubernetes cluster can communicate with every other pod. Network policies are the mechanism for restricting this.

The baseline posture: a default-deny policy for every namespace that blocks all ingress and egress, then explicit allow policies for the communication that's needed.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: payments
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

Then allow the specific traffic:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-payments-api
  namespace: payments
spec:
  podSelector:
    matchLabels:
      app: payments-api
  policyTypes:
  - Ingress
  policyTypes:
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: gateway
    ports:
    - port: 8080
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: database
    ports:
    - port: 5432
```

This is more to maintain but significantly reduces the blast radius of a compromised pod. A compromised payments service that can only reach the database and the gateway is contained; one that can reach any cluster resource is a more serious incident.

Network policies require a CNI plugin that implements them — Calico, Cilium, or Weave Net. The default networking in many managed Kubernetes services (EKS with VPC CNI, GKE in some configurations) may not enforce network policies without additional configuration or plugin installation.

## Image security: admission control and signed images

Running unknown images is a risk. The controls:

**Admission controllers** can enforce image policies before pods start. OPA Gatekeeper or Kyverno allow policies like "images must come from approved registries" and "images must specify an approved digest" (a tag, even when versioned, can move unless the registry enforces immutability).

**Image signing** verifies a signature over a digest against an expected signer or identity and trust policy. Require an approved workload identity, and validate separate provenance attestations when the build process itself is in scope. Admission policies can enforce these decisions before creating workloads. See [Sigstore verification](https://docs.sigstore.dev/cosign/verifying/verify/).

**Regular base image updates**: a hardened cluster with outdated container images is still vulnerable. Automate base image updates (Dependabot for container base images, or Renovate Bot) and run Trivy or Grype image scanning in CI to catch vulnerabilities before deployment.

## Secrets: don't trust etcd at rest by default

Kubernetes Secrets are stored in etcd. etcd is not encrypted at rest by default — base64 is encoding, not encryption. Anyone with access to the etcd datastore can read all secrets.

Enable etcd encryption at rest. For managed clusters:
- EKS: secrets encryption is optional, uses AWS KMS. Enable it.
- GKE: encrypted by default with Google-managed keys; customer-managed keys available.
- AKS: encryption at rest with platform keys by default; customer-managed keys available.

The [Secrets Store CSI Driver](https://secrets-store-csi-driver.sigs.k8s.io/topics/sync-as-kubernetes-secret) can mount external values directly. Its optional sync creates a Kubernetes Secret. External Secrets Operator also commonly reconciles external values into Kubernetes Secret objects. If either path creates a Secret resource, apply controls for storage encryption and least-privilege access. Verify rotation behavior in the application as well as the provider.

## Audit logging

Kubernetes API server audit logging records every request to the API — who created what, who deleted what, who accessed which secrets. This is essential for incident response and compliance.

Audit logs should be shipped to a central logging system (CloudWatch Logs, Azure Monitor, GCP Cloud Logging, or your own ELK stack) where they're retained and searchable. On self-managed control planes, set an explicit audit policy. Metadata is often sufficient for Secret operations because request and response bodies can expose the values the policy is meant to protect. Choose body logging where it is justified and reviewed. Verify collection, retention, and access in your environment. See [Kubernetes auditing](https://kubernetes.io/docs/tasks/debug/debug-cluster/audit/).

*Reviewing your cluster security posture or hardening a new cluster? [Happy to compare configurations.](/contact/)*

## Establish who can change the security boundary

Use a small inventory of principals rather than starting from a count of policy objects. List the identities that can create workloads, change permissions, alter admission rules, publish trusted images, and read or rotate sensitive credentials. Give each a purpose, scope, owner, and review date. A role named after a single application can still confer broad access if it is bound across namespaces. Review the actual bindings and permissions together. Include both human groups and CI identities. If a workflow creates Pods with service account credentials, examine which accounts it is permitted to attach. Kubernetes calls out the indirect privileges of creating workloads in its [RBAC good practices](https://kubernetes.io/docs/concepts/security/rbac-good-practices/).

Build representative authorization checks to show what the role can and cannot do. For a read-only support identity, verify that it can read health and logs for its service and that an attempt to change a deployment or read a credential is denied. Use an approved staging identity or the access review capabilities explicitly delegated to the tester. A successful denial by one identity proves nothing about another binding or a production namespace that uses different policy. Include service and environment identifiers in the test result. Store permissions as code so removals receive the same technical review as additions.

## Separate policy rollout from application rollout

Pod Security Admission gives a migration team different ways to observe behavior. Start with a named set of intended workloads and define which policy and version are under evaluation. Use warnings and audit data while teams bring manifests into compliance. Recreate representative Pods in a nonproduction environment. Include periodic jobs and controllers that only create replacement Pods after a failure. Testing existing Pods does not prove that a node drain or scale-up can create replacements. Confirm that the evidence covers every required workload category before enabling the enforce mode in the applicable namespaces.

Suppose an illustrative program has eight namespaces with ten standard workloads each plus two infrastructure namespaces with a combined 20 workloads. All eight standard namespaces enforce the target policy, and two infrastructure workloads have documented exemptions under a separately monitored policy. The first policy covers 80 of 100 workloads. Reporting the absence of exceptions across the standard namespaces describes compliance within their scope, while the inventory still needs to account for the 20 infrastructure workloads. For each exception write down the control that still applies, who owns it, and how it can expire or be reconsidered. Distinguish a deliberate exception from an unresolved failure to enforce the control.

Verify that releases still work after changing enforcement. Keep a known compatible manifest available and update the platform templates as part of the change. If the platform creates a new namespace for a service, confirm it receives the expected labels and policies at creation. Compare environments, especially older namespaces that predate bootstrap automation. Kubernetes describes namespace-level policy and version selection in its [Pod Security Admission guide](https://kubernetes.io/docs/concepts/security/pod-security-admission/).

## Verify containment from a workload viewpoint

Default-deny policies are useful only when paired with a working application and a tested communication model. In a controlled cluster, keep a matrix of the routes required for a request, scheduled task, or recovery action. Include name resolution, identity exchange, approved service dependencies, and telemetry endpoints. Check traffic from the intended source to the actual destination and port. Verify both allowed and denied cases using owned test workloads with known-ready endpoints. A timeout to an unavailable service is not proof that policy blocked a reachable service. Save the test context and avoid relying on traffic that predates an enforcement change.

A namespace boundary organizes resources and policies. Treat it as one layer in the isolation design. When two workloads have different trust requirements, compare service identities, network controls, host privileges, and administrative ownership. Network policies apply through a supporting plugin. Confirm their behavior on the platform and version actually running the workload, particularly for cross-node traffic and interfaces whose paths differ from a simple Pod-to-Pod test. Preserve a route for emergency operation that can be used and reviewed without granting a broad permanent exception.

## Separate secret storage, consumption, and logging

Document the source of every category of sensitive value and the places where copies can exist. An integration that mounts content into a workload can differ from one that materializes a Kubernetes Secret. The Secrets Store CSI Driver supports optional synchronization to a Secret object. If synchronization is enabled, assess the controls for that object and its lifecycle as well as for the external store. Check what the application does when the value rotates. Updating a file mount does not mean the application has reloaded it. Run a rehearsal with a harmless test credential and verify both the new value taking effect and the old value losing authority within the expected interval. See the [Secrets Store CSI Driver usage guide](https://secrets-store-csi-driver.sigs.k8s.io/getting-started/usage).

Keep credential contents out of diagnostic output, release records, and audit evidence. Audit metadata generally answers who acted, which resource they targeted, and the result. Use more detailed request or response records only when justified and after checking which sensitive payloads can enter the audit stream. Kubernetes audit records depend on server configuration and policy. Verify collection and retention by performing a controlled action on a test object and finding the expected event in the destination. Restrict access to those records and test that a responder can retrieve them through the intended process. See the [Kubernetes auditing guide](https://kubernetes.io/docs/tasks/debug/debug-cluster/audit/).

## Make hardening measurable after the rollout

Create a short verification pack for each preventive control. A test image matching the expected digest and trusted identity should be accepted. A benign fixture missing the expected attestation should produce the recorded deny or warning. Treat a signature test as evidence of artifact and identity verification. Build provenance is a separate attestation with its own policy. Establish which signals tell responders about failed verification, policy exceptions, and drift after the next cluster or controller upgrade.

Operational thresholds should trigger a decision, not an activity count. If an illustrative check finds 42,000 compliant admissions and 21 denied over a month, inspect what the 21 represent. A broken manifest repeatedly attempted by a controller does not constitute 21 independent security events. Group by workload and policy decision, identify the owners, and look at gaps in instrumentation. Run the same checks after upgrades and after changing the fleet profile. A result is only as meaningful as the scope and software versions recorded with it.
