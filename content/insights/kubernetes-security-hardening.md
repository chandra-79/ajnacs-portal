---
title: "Kubernetes Security Hardening: The Controls That Actually Reduce Attack Surface"
description: "Default Kubernetes configurations are not production-secure. Here are the specific hardening controls — RBAC, Pod Security Standards, network policies, image policies, secrets management — that reduce attack surface and what each actually protects against."
date: 2026-09-02
tags: ["DevSecOps", "Containers", "Security"]
series: "DevSecOps Pipeline"
seriesOrder: 4
format: article
---

A Kubernetes cluster out of the box has a large attack surface. Pods can communicate freely. Containers run as root by default. Any pod can access the Kubernetes API with the default service account, which has broad permissions in many configurations. Secrets are base64-encoded, not encrypted.

None of these are unfixable. They're defaults chosen for developer convenience, not production security. Here's the set of controls I consider baseline for any production cluster.

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

**Admission controllers** can enforce image policies before pods start. OPA Gatekeeper or Kyverno allow policies like "images must come from approved registries" and "images must not use the `:latest` tag" (which pins to a specific image).

**Image signing** with Sigstore/Cosign allows you to verify that an image was built by your CI pipeline and hasn't been tampered with. The admission controller verifies the signature before allowing the image to run. This is the strongest control for supply chain security in Kubernetes.

**Regular base image updates**: a hardened cluster with outdated container images is still vulnerable. Automate base image updates (Dependabot for container base images, or Renovate Bot) and run Trivy or Grype image scanning in CI to catch vulnerabilities before deployment.

## Secrets: don't trust etcd at rest by default

Kubernetes Secrets are stored in etcd. etcd is not encrypted at rest by default — base64 is encoding, not encryption. Anyone with access to the etcd datastore can read all secrets.

Enable etcd encryption at rest. For managed clusters:
- EKS: secrets encryption is optional, uses AWS KMS. Enable it.
- GKE: encrypted by default with Google-managed keys; customer-managed keys available.
- AKS: encryption at rest with platform keys by default; customer-managed keys available.

Better: don't store sensitive secrets in etcd at all. Use the External Secrets Operator or the CSI Secrets Store Driver to pull secrets from AWS Secrets Manager, Azure Key Vault, or GCP Secret Manager at pod startup. The secret exists in memory; it never lives in etcd.

## Audit logging

Kubernetes API server audit logging records every request to the API — who created what, who deleted what, who accessed which secrets. This is essential for incident response and compliance.

Audit logs should be shipped to a central logging system (CloudWatch Logs, Azure Monitor, GCP Cloud Logging, or your own ELK stack) where they're retained and searchable. The default audit policy logs everything, which is voluminous; a policy that logs at `RequestResponse` level for sensitive operations (secret access, RBAC changes) and `Metadata` level for routine operations is more manageable.

*Reviewing your cluster security posture or hardening a new cluster? [Happy to compare configurations.](/contact)*
