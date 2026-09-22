---
title: "Container Security: The Specific Misconfigurations That Open Production Systems to Attack"
description: "Running containers as root, privileged mode, unrestricted capabilities, exposed Docker sockets — the container security mistakes that appear in breach reports and how to prevent them systematically."
date: 2026-09-28
tags: ["DevSecOps", "Fundamentals"]
series: "Containerization from the Ground Up"
seriesOrder: 5
format: article
---

Container security is not a single control — it is a set of decisions made at image build time, container runtime configuration, and orchestration platform level. Most container security incidents are not novel attacks against the container runtime. They are predictable misconfigurations that expose the host OS or enable lateral movement within the cluster. This lesson covers the specific misconfigurations and the systematic controls that prevent them.

## The Threat Model

A container is a boundary, not a fortress. The threats it contains:

1. **Application vulnerability leading to container compromise**: an attacker exploits a bug in the application and gains code execution inside the container.
2. **Container escape**: from inside a compromised container, the attacker breaks out to the host OS.
3. **Lateral movement**: from a compromised container, the attacker reaches other containers or services within the cluster.
4. **Supply chain**: a malicious or vulnerable base image or dependency is pulled into the environment.

The container security controls address each stage of this attack path.

## Never Run Containers as Root

The single most impactful configuration change. A process running as root inside a container that escapes to the host is root on the host.

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
