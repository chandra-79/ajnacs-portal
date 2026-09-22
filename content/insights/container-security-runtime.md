---
title: "Container Security in Production: What the Scanners Don't Tell You"
description: "Trivy catches known CVEs. Falco catches runtime anomalies. What neither tells you is whether your container security posture is where it needs to be — and what it takes to close the gap."
date: 2028-05-10
tags: ["DevSecOps", "Containers", "Security"]
format: article
---

Most organizations I encounter have some form of container scanning in place. Trivy or Snyk in CI, evaluating images against known vulnerability databases. A subset have Falco or similar runtime security tooling running in their clusters.

Both are necessary. Neither is sufficient. The gap between what they cover and what enterprise container security actually requires is where most incidents originate.

## What Scanners Cover — and What They Don't

Trivy-class scanners catch:
- Known CVEs in OS packages and application dependencies
- Misconfigured Dockerfiles (running as root, unnecessarily broad capabilities, missing USER instructions)
- Secrets embedded in layers (to varying degrees of accuracy)

What they don't catch:
- Behaviour that becomes malicious at runtime
- Lateral movement within a cluster
- Data exfiltration via unexpected outbound connections
- Privilege escalation exploiting kernel vulnerabilities or misconfigured pod security contexts

Falco-class runtime security covers the behavior layer — alerting on unexpected syscalls, network connections, file accesses. The challenge: Falco generates significant signal, and distinguishing malicious behavior from legitimate but unusual application behavior requires investment in rule tuning.

## The Posture Gaps I See Most Often

**1. Images running as root**

Default in a surprising number of base images, and developers rarely change it. Root in a container is not root on the host (usually), but combined with other vulnerabilities, it extends attack surface significantly. Enforce non-root user requirements at admission time.

**2. Excessive capabilities**

Many containers run with default Linux capabilities they don't need. Drop all capabilities and add back only what's required. This is a policy conversation more than an engineering one — most teams simply haven't had it.

**3. Unrestricted network egress from pods**

Applications that should only talk to internal services, with unrestricted outbound internet access. Kubernetes NetworkPolicy or Cilium enforcing explicit allow rules rather than default-allow egress is the fix. Easy to implement; rarely done at deploy time.

**4. Privileged containers in non-privileged workloads**

Containers running with `privileged: true` for reasons that were valid during initial development and never revisited. Audit your cluster for privileged pod specs. Most will have no operational need for it.

**5. Image provenance and supply chain**

Where are images coming from? Are base images pulled from verified registries? Is there an SBOM for container images in production? This is where the Log4Shell class of vulnerabilities lives — transitive dependencies you didn't know you had, in images you thought were clean.

## Building a Container Security Baseline

The baseline I use as a starting point for any container security programme:

- **Image scanning in CI** — fail builds on Critical CVEs with no exception list longer than your thumb
- **Signed images only in production** — Cosign or Notary v2 for supply chain attestation
- **Admission controller enforcing pod security standards** — OPA/Gatekeeper or Kyverno validating non-root, no-privileged, drop-caps-all, readOnlyRootFilesystem
- **Network policies** — default-deny ingress and egress at namespace level, explicit allows for known traffic
- **Runtime anomaly detection** — Falco with tuned ruleset, alerts routing to your SIEM or incident response platform
- **SBOM generation** — syft or similar at build time, stored alongside the image

Not all of this needs to be in place on day one. The admission controller policies and image signing prevent the most common issues at the least operational cost. Start there.

## The Human Side

Technical controls without the operational knowledge to respond to them are incomplete.

If your Falco alerts fire but nobody knows what to do, they create noise rather than signal. The response runbook for "Falco alert: unexpected outbound connection from production pod" needs to exist before the alert fires, not after.

Build the detection and the response together. That's the part of container security that vendors don't sell you.

---

*Evaluating your container security posture or building a Kubernetes security programme? [Happy to dig into specifics.](/contact)*
