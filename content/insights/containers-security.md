---
title: "Container Security: The Specific Misconfigurations That Open Production Systems to Attack"
description: "Running containers as root, privileged mode, unrestricted capabilities, exposed Docker sockets — the container security mistakes that appear in breach reports and how to prevent them systematically."
date: 2026-09-28
tags: ["DevSecOps", "Fundamentals"]
series: "Containerization from the Ground Up"
seriesOrder: 5
format: article
---

Container security is not a single control — it is a set of decisions made at image build time, container runtime configuration, and orchestration platform level. Review configuration and runtime vulnerabilities as separate risks. Privilege, host integration and workload network access determine the consequences of a compromise. This lesson covers the specific misconfigurations and the systematic controls that prevent them.

## What to measure

**Signed image coverage at deployment.** If 180 of 200 newly admitted workloads use a verified image digest, coverage is 90%. Count audit-only and denied admissions separately. Check exemptions and scan age before presenting a policy-enabled cluster as fully covered.

*Illustrative measurement. Any numbers in this example are hypothetical.*

## The Threat Model

A container is a boundary, not a fortress. The threats it contains:

1. **Application vulnerability leading to container compromise**: an attacker exploits a bug in the application and gains code execution inside the container.
2. **Container escape**: from inside a compromised container, the attacker breaks out to the host OS.
3. **Lateral movement**: from a compromised container, the attacker reaches other containers or services within the cluster.
4. **Supply chain**: a malicious or vulnerable base image or dependency is pulled into the environment.

The container security controls address each stage of this attack path.

## Never Run Containers as Root

The single most impactful configuration change. A container's root UID and the corresponding host identity depend on runtime configuration and user namespace mapping. Minimize privileges and assess host exposure separately.

```dockerfile
## In the Dockerfile:
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser
USER appuser
```

```yaml
## In Kubernetes PodSpec:
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1001
    runAsGroup: 1001
    fsGroup: 1001
```

Enforce this at the cluster level with Kubernetes PodSecurity admission (restricted policy) so no deployment can bypass it:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    pod-security.kubernetes.io/enforce: restricted
```

## Drop All Capabilities by Default

Linux capabilities break root's all-or-nothing privilege model into granular permissions. Containers inherit a default set of capabilities — many of which most applications do not need.

```yaml
spec:
  containers:
  - name: my-api
    securityContext:
      capabilities:
        drop:
        - ALL                      # drop everything
        add:
        - NET_BIND_SERVICE         # only add what you actually need
                                   # (binding to ports < 1024)
```

Most web applications need zero capabilities. APIs that do not bind to privileged ports need zero capabilities. The safest default is drop ALL, then consciously re-add what the specific application requires.

## Read-Only Root Filesystem

An attacker who has code execution inside a container and cannot write to the filesystem cannot install tools, write backdoors, or modify application binaries.

```yaml
spec:
  containers:
  - name: my-api
    securityContext:
      readOnlyRootFilesystem: true
    volumeMounts:
    - name: tmp-dir
      mountPath: /tmp          # mount a tmpfs for /tmp if needed
  volumes:
  - name: tmp-dir
    emptyDir:
      medium: Memory
```

## Never Mount the Docker Socket

Mounting `/var/run/docker.sock` into a container gives that container full control over the Docker daemon — which means full control over the host and all other containers. This is a container escape by design.

```yaml
## Do not do this:
volumes:
- hostPath:
    path: /var/run/docker.sock
  name: docker-socket
```

If a CI/CD system needs to build images inside a container, use rootless build tools (Buildah, kaniko) that do not require the Docker socket.

## Image Scanning in CI

Every image pushed to a registry should be scanned for known CVEs before deployment:

```yaml
## GitHub Actions example
- name: Scan image for vulnerabilities
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: my-image:${{ github.sha }}
    severity: "CRITICAL,HIGH"
    exit-code: "1"       # fail the build on critical/high CVEs
```

Pin base images to specific digests rather than tags. Tags are mutable — `python:3.12-slim` today may reference a different image tomorrow:

```dockerfile
## Mutable — tag can be updated without your knowledge:
FROM python:3.12-slim

## Immutable — this specific image digest never changes:
FROM python:3.12-slim@sha256:d5b63a0cda135bc60d5bdb7ea42fed3adf28a72c40ea1e8a73c6dc8e9d9ef6e9
```

## Network Policies in Kubernetes

By default, every pod in a Kubernetes cluster can communicate with every other pod. This means a compromised pod has network access to every service in the cluster — databases, internal APIs, secrets stores.

```yaml
## Deny all ingress by default for a namespace
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: production
spec:
  podSelector: {}          # applies to all pods
  policyTypes:
  - Ingress

## Allow only the API to reach the database
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-api-to-database
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: postgres
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: my-api
    ports:
    - port: 5432
```

## The Security Checklist

Before any container workload reaches production:

- Non-root user in Dockerfile and enforced in PodSpec
- All Linux capabilities dropped, required ones explicitly added
- Read-only root filesystem with tmpfs for writable paths
- Docker socket not mounted
- Image scanned for CVEs; no critical/high unpatched vulnerabilities
- Base image pinned to digest
- Network policies applied (default deny, explicit allow)
- Secrets not in environment variables if possible — use a secrets store (Vault, AWS Secrets Manager, Kubernetes external-secrets)
- Resource limits set (CPU and memory) — an attacker with code execution who can consume unlimited CPU affects all other pods on the node

Container security is not a security team's responsibility after deployment. It is an engineering discipline from the Dockerfile outward.

## Separate the controls you can verify

Ask which layer makes each promise and what evidence proves it for the running Pod. A developer's Dockerfile can set a non-root user. Admission can validate the settings the team asks Kubernetes to run, and workload status can show which image the Pod actually started. Preserve evidence for all three because an image can change under a mutable tag and a deployer can override a Dockerfile default through workload configuration. [Kubernetes security context](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/)

| Question | Where to verify | Expected record |
| --- | --- | --- |
| Which artifact ran? | Workload status and release record | Runtime image identifier and digest resolved for the platform |
| Which operating-system rights were granted? | Admitted workload configuration and approved runtime checks | Expected UID, capability settings and write locations |
| What can the workload identity access? | Service account, API authorization and cloud identity | Approved policy, documented scope and positive and negative checks |
| Which network calls are intended? | Deployed network policy and test client in the intended context | Required endpoints work and selected disallowed paths fail |

Keep the deployment evidence linked to a revision and timestamp. A controlled fixture can inspect its own effective runtime settings and attempt an ordinary safe write only where the app genuinely needs one. Inspect health under the same resource constraints used in the deployment. Send logs to their intended destination while writes to the application root stay unavailable. A read-only root filesystem protects that mount. Explicit writable volumes and network or API permissions remain separate surfaces.

## Rehearse policy changes with controlled fixtures

Roll out a baseline in a disposable namespace with the intended admission and network implementations enabled. First apply a known-good workload and collect its successful admission and startup. Next use fixture variants with one deliberately unsupported setting each, such as requesting a root UID or omitting a security control that the policy explicitly checks. Inspect the returned policy reason. Use server-side validation before attempting execution and count an unexpected admission as a failed test. Kubernetes' Restricted Pod Security Standard defines specific rules. A team that requires read-only root filesystems must configure a separate policy for that requirement. [Kubernetes Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/)

Run ordinary authorized requests to the services the workload needs, with dedicated test identities and synthetic records. For each selected policy denial, verify that the test used the expected namespace and labels and compare a known-allowed path from the same test environment. A failed connection might be a broken service, transport, name, or certificate. Admission evidence plus a controlled path comparison helps isolate the enforcement behavior. [Kubernetes Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/)

Run these fixtures after updating a cluster version, runtime or policy controller. Include any approved exemptions and age them out on a named date. A temporary exception should carry its own operating owner, reason, scoped workload, compensating controls, evidence of expiry, and plan to return to the common baseline.

## Quantify what the baseline covers

An illustrative weekly audit has 80 unique production workload revisions in scope. Of those, 70 meet every selected control, five have approved exceptions to at least one control, and five have incomplete evidence. Report 87.5% fully evidenced coverage, 6.25% approved exception share, and 6.25% evidence gap. Use stable workload and revision identifiers to deduplicate rollout events. Preserve the categories separately when comparing weeks. Moving an unknown to an exception can improve auditability while leaving compliant coverage unchanged.

Report policy effectiveness for individual controls separately. If 76 of the 80 admitted workload revisions use a verified digest, the image verification coverage is 95%. That figure has a different numerator from the composite baseline. Count denied requests as attempted policy violations under a distinct denominator. A useful release view includes verification source, age of the evidence, expected digest, and whether each active exception can be retired.

Plan the next engineering action from the evidence. If all five unknowns come from workloads whose deploy system publishes no revision metadata, instrument that deployment path. If exceptions cluster around legacy port and filesystem assumptions, assign an owner to update the shared base image and test it against actual application smoke tests. Publish only aggregate coverage externally.

## Match runtime isolation to the workload

An application's UID inside a container, the host identity mapping, and the daemon's privilege differ. Docker's rootless mode runs the daemon and containers as a non-root user using a user namespace. Inspect the host and runtime configuration before assigning the same consequences to every non-root or root workload. A real evaluation should also inventory access to writable mounts, host features and trust relationships around build services. Use an isolated build service with artifacts uploaded by authorized identity when normal CI builds do not need direct access to a worker's daemon. [Docker rootless mode](https://docs.docker.com/engine/security/rootless/)

Separate workloads with demonstrably different trust or compliance requirements where shared scheduling would make the boundary difficult to verify. Before selecting a stricter runtime or node model, record the compatibility needs, time-to-start and resource budget. Check expected system behavior through regular integration tests and check access controls with safe fixtures. When a workload requires a new permission to pass, repeat the test after adding only that permission and document its owner. That record lets the next reviewer retire obsolete grants and identify which application behavior depended on them.
