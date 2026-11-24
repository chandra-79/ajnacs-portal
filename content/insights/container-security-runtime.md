---
title: "Container Security in Production: What the Scanners Don't Tell You"
description: "Trivy catches known CVEs. Falco catches runtime anomalies. What neither tells you is whether your container security posture is where it needs to be — and what it takes to close the gap."
date: 2028-05-10
tags: ["DevSecOps", "Containers", "Security"]
format: article
---

A container-security program often begins with image scanning. Trivy or Snyk in CI, evaluating images against known vulnerability databases. A subset have Falco or similar runtime security tooling running in their clusters.

Both can contribute to a container-security program, but neither alone establishes the required posture. The gap between what they cover and what enterprise container security actually requires is that deserves explicit testing.

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

## Posture gaps to examine

**1. Images running as root**

Default in a surprising number of base images, and developers rarely change it. Container isolation depends on namespaces, capabilities, host mounts and runtime configuration. Root and privileged execution can increase exposure; user namespaces and other controls change the boundary. Enforce non-root user requirements at admission time.

**2. Excessive capabilities**

Many containers run with default Linux capabilities they don't need. Drop all capabilities and add back only what's required. This is a policy conversation more than an engineering one — most teams simply haven't had it.

**3. Unrestricted network egress from pods**

Applications that should only talk to internal services, with unrestricted outbound internet access. Kubernetes NetworkPolicy or Cilium enforcing explicit allow rules rather than default-allow egress is the fix. Verify that the networking implementation enforces the policy and that required DNS and dependency traffic remain functional.

**4. Privileged containers in non-privileged workloads**

Containers running with `privileged: true` for reasons that were valid during initial development and never revisited. Audit your cluster for privileged pod specs. Most will have no operational need for it.

**5. Image provenance and supply chain**

Where are images coming from? Are base images pulled from verified registries? Is there an SBOM for container images in production? This is where the Log4Shell class of vulnerabilities lives — transitive dependencies you didn't know you had, in images you thought were clean.

## Building a Container Security Baseline

A practical starting baseline for a container security programme:

- **Image scanning in CI** — fail builds on Critical CVEs with no exception list longer than your thumb
- **Signed images only in production** — Cosign or Notary v2 for supply chain attestation
- **Admission controller enforcing pod security standards** — OPA/Gatekeeper or Kyverno validating non-root, no-privileged, drop-caps-all, readOnlyRootFilesystem
- **Network policies** — default-deny ingress and egress at namespace level, explicit allows for known traffic
- **Runtime anomaly detection** — Falco with tuned ruleset, alerts routing to your SIEM or incident response platform
- **SBOM generation** — syft or similar at build time, stored alongside the image

Not all of this needs to be in place on day one. Prioritize admission, provenance, network and runtime controls against the workload's threat model and operating capacity; no universal incident-frequency or cost ranking is established here.

## The Human Side

Technical controls without the operational knowledge to respond to them are incomplete.

If your Falco alerts fire but nobody knows what to do, they create noise rather than signal. The response runbook for "Falco alert: unexpected outbound connection from production pod" needs to exist before the alert fires, not after.

Build the detection and the response together. That's the part of container security that vendors don't sell you.

*Evaluating your container security posture or building a Kubernetes security programme? [Happy to dig into specifics.](/contact)*

## Separate image properties from runtime permissions

An image scan describes selected packages and configuration visible to the scanner at a particular time. Runtime identity, mounted credentials, host access and network reachability determine additional exposure after deployment. A clean image can run with dangerous privileges, while a reported vulnerability may have different exploitability under different configurations. Preserve both kinds of evidence.

Consider a hypothetical review of 40 production workload definitions. Twenty-eight satisfy the chosen baseline, five request unnecessary privileges, four lack the intended egress policy and three need further investigation. These categories are mutually exclusive first findings for the exercise. The 70% baseline pass rate does not establish security: the unverified workloads remain unresolved, and a single privileged workload may have substantial impact.

For the worksheet, record image digest, provenance, runtime user, Linux capabilities, privilege escalation setting, mounts, service-account permissions and network requirements. Verify the effective deployment rather than inspecting only the source template. Admission mutation and platform defaults can change what actually runs.

## Test the baseline with an ordinary workload

Use a disposable namespace and a harmless application. Configure a non-root runtime identity, the capabilities it actually needs, a suitable seccomp profile and restrictions on privilege escalation. Test application startup and its normal file writes. A read-only root filesystem can be a useful extra control, but it is not identical to Kubernetes' Restricted Pod Security Standard and may require explicit writable volumes for legitimate temporary data.

Apply a policy that rejects a deliberately privileged test pod. Confirm the rejection reason and verify that the intended unprivileged workload still starts. Include update paths and relevant container types in the test coverage. Admission protects the operations it evaluates; it does not retroactively prove every running workload already satisfies a newly introduced rule.

Container root and host root are separated by namespaces and other controls, but the strength of isolation depends on user namespaces, capabilities, host mounts and the runtime. Avoid describing container root as categorically harmless. Treat host-level access and privileged workloads as explicit exceptions with a justified purpose and controlled placement.

## Verify network policy enforcement

Kubernetes NetworkPolicy requires a networking implementation that enforces it. Writing a policy object without that support does not create isolation. Standard policies are additive allow rules with defined selectors and traffic direction; test the actual selected workloads and paths rather than assuming a namespace label is sufficient.

In the lab, deny unnecessary egress, then permit the application's documented dependency and required DNS behavior. Verify the allowed connection and a denied connection to a harmless test endpoint. Check how the policy interacts with addresses, services and the network implementation's documented behavior. Broad domain-based filtering may require capabilities beyond the standard NetworkPolicy API.

## Connect detections to a response

Choose one benign runtime action that should trigger a selected detection rule, such as execution of an unexpected diagnostic process in the test container. Verify the event, routing, context and responder instructions. A rule can detect a symptom without proving malicious intent, so the runbook should include investigation and containment criteria rather than automatic destructive action for every alert.

For image provenance, verify the artifact digest and the identity or process that produced the attestation. A signature establishes a trust relationship under its verification policy; it does not establish that the code contains no vulnerabilities. Retain an SBOM with the deployed digest and reassess when new vulnerability information appears.

Close the review with specific controls, tested exceptions and known gaps. Prioritize by reachable impact and operational feasibility instead of assuming that one tool order always prevents the most incidents. The useful baseline combines prevention, detection and a response that the team can actually execute.

| Observation | Value (workloads) |
| --- | ---: |
| Baseline satisfied | 28 |
| Excess privilege | 5 |
| Egress gap | 4 |
| Needs investigation | 3 |

**Figure method.** Synthetic 40-workload review: 28+5+4+3=40; selected baseline pass=28/40=70%. Categories use first findings and do not establish absence of other risks.

## Further reading

- [Kubernetes Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/)
- [Kubernetes NetworkPolicy](https://kubernetes.io/docs/concepts/services-networking/network-policies/)
- [NIST SSDF](https://csrc.nist.gov/pubs/sp/800/218/final)
