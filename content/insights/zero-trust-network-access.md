---
title: "Zero Trust Network Access: Implementation Over Buzzword"
description: "Zero trust is one of the most overloaded terms in enterprise security. Here's what it actually means architecturally, which specific controls implement it, and how to move from perimeter-based thinking to continuous verification without breaking existing workflows."
date: 2028-02-16
tags: ["DevSecOps", "Security", "Systems"]
series: "DevSecOps Pipeline"
seriesOrder: 3
format: article
---

Zero trust has become the kind of term that gets used in every security vendor pitch and every compliance checklist. Like most security concepts that achieve this status, it means different things to different people, and the meaning has drifted far enough from the original concept that it's worth grounding it in specifics.

The core principle, from the NIST SP 800-207 definition, is straightforward: assume no implicit trust based on network location. A request from inside the corporate network is not trusted by default. A device that was verified last week needs to be re-verified today. Access is granted per-session, after verifying both identity and device posture.

This is genuinely different from the traditional "castle and moat" model where everything inside the network perimeter is trusted and everything outside is not. The moat model failed when the moat disappeared — when users work from home, applications run in cloud environments, and the "inside" is no longer a coherent boundary.

## The five controls that implement zero trust

**1. Identity as the primary perimeter**

Every access request must be authenticated. The authenticating identity can be a person (human user), a workload (service account, pod identity), or a device. All three require verification.

For humans: SSO with strong MFA (ideally phishing-resistant MFA — hardware security keys or passkeys rather than SMS OTP). Identity provider integration (Okta, Entra ID, Google Workspace) that enforces re-authentication based on risk signals.

For workloads: workload identity rather than shared credentials. AWS IAM roles, Azure Managed Identities, GCP Workload Identity — the cloud platform proves the workload's identity; no long-lived credentials needed.

For devices: device posture assessment as part of the access decision. Is the device managed? Is the OS current? Is disk encryption enabled? Certificate-based device authentication in the access proxy.

**2. Least-privilege access, per-session**

Access is granted to specific resources for specific purposes, not to entire network segments. A developer who needs to debug a production service gets access to that service's logs — not to the entire production VPC.

Implementing this: resource-level RBAC (IAM policies that grant specific permissions on specific resources), just-in-time access provisioning (Teleport, BeyondCorp, Boundary), and time-limited credentials that expire after the session ends.

The just-in-time pattern is worth highlighting: instead of granting standing access to production resources (which can be exfiltrated or misused), access is requested, approved (automated for lower-risk tiers, human-reviewed for higher-risk), and granted for the duration of the session. After the session, the credentials expire.

**3. Network microsegmentation**

Rather than a flat network where any service can reach any other service, network policies restrict east-west traffic to only the connections that are required. A payments service should not be reachable from an analytics pipeline. A management tool should not be reachable from the public internet.

In Kubernetes: NetworkPolicy resources (with a CNI that enforces them) define allow-listed communication paths. Default-deny with explicit allows is the correct posture.

In cloud VPCs: security groups (AWS), network security groups (Azure), and VPC firewall rules (GCP) implement microsegmentation at the infrastructure level. Private endpoints for managed services (databases, queues, object storage) keep traffic on the private network and eliminate internet exposure.

**4. Continuous verification, not point-in-time**

A user who authenticated this morning and whose device was compliant at 9am needs to be re-evaluated when context changes. If their device subsequently fails a posture check, their access should be revoked.

Implementing this: conditional access policies in the identity provider that re-evaluate on each request or at regular intervals. Risk signals that trigger step-up authentication (unusual location, unusual access pattern, failed posture check).

This is where many zero trust implementations stop short — they implement strong initial authentication without continuous re-evaluation. Point-in-time verification with long session lifetimes is better than password-only access, but it's not zero trust.

**5. Logging and assuming breach**

Zero trust includes the assumption that a breach has occurred or will occur. The response: comprehensive logging of all access decisions (who requested what, when, whether it was granted), centralised and tamper-evident, with anomaly detection.

The logging requirement: every authentication event, every access decision, every resource access, with enough context to reconstruct the sequence of events in an incident investigation. SIEM integration for real-time anomaly detection.

## The migration path from perimeter to zero trust

You don't migrate to zero trust in a quarter. A realistic phased approach:

**Phase 1 (1-3 months)**: Strengthen identity. Deploy SSO across all applications. Enforce MFA everywhere. Identify service accounts using shared or long-lived credentials and plan replacement with workload identity.

**Phase 2 (3-6 months)**: Implement network segmentation. Map existing network flows, apply default-deny where possible, implement security group / network policy controls for critical workloads.

**Phase 3 (6-12 months)**: Deploy a zero trust access layer for sensitive resources. Replace VPN-to-segment access with just-in-time, resource-specific access using a tool like Teleport, Zscaler Private Access, or Cloudflare Access.

**Phase 4 (ongoing)**: Continuous posture assessment, risk-adaptive policies, and extending coverage to the remaining long tail of resources.

The pragmatic starting point: fix identity first. Most organizations that claim to be implementing zero trust have not yet achieved strong MFA enforcement. That's where the highest risk reduction per unit of effort is.

*Assessing your organization's zero trust maturity or working through a specific implementation? [Happy to compare where the effort is best spent.](/contact)*
