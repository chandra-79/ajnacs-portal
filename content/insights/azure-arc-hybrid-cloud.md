---
title: "Azure Arc: Extending Azure Management to On-Premises and Multi-Cloud"
description: "Azure Arc projects Azure's management plane onto non-Azure resources — on-premises servers, other cloud providers, edge environments. Here's what it actually enables and where it has limitations."
date: 2027-02-19
tags: ["Cloud Architecture"]
format: article
---

Azure Arc addresses a specific organizational problem: companies that want unified management, policy enforcement, and security posture across Azure resources and resources that live outside Azure — on-premises, in other cloud providers, or at edge locations.

Without Arc, organizations maintain separate operational models for Azure and non-Azure environments. Different monitoring tools, different policy enforcement mechanisms, different security tooling, different identity management. The operational overhead compounds as environments grow.

Arc extends Azure management to supported non-Azure infrastructure. Servers, Kubernetes clusters and data services use distinct Arc capabilities and support boundaries; native Azure resources and projected resources are not interchangeable in every operation.

## What Arc enables

**Arc-enabled servers**: install the Azure Connected Machine agent on supported Linux or Windows machines that meet the documented prerequisites and connectivity requirements. The machine appears in the Azure portal as an Azure resource. You can then:

- Apply Azure Policy for configuration compliance assessment
- Use Microsoft Defender for Cloud for security posture management
- Use Azure Monitor and Log Analytics for centralized monitoring
- Apply tags for cost attribution and resource organization
- Use current Azure Update Manager and supported configuration or automation capabilities as appropriate
- Assign managed identities to on-premises machines for Azure service authentication

Review the documented agent and extension network requirements and measure overhead for the enabled features. The standard management connection uses outbound connectivity; additional features may have their own prerequisites.

```bash
## Install Connected Machine agent on Linux (after downloading the install script)
./install_linux_azcmagent.sh

## Connect to Azure
azcmagent connect \
  --subscription-id "<sub-id>" \
  --resource-group "my-hybrid-rg" \
  --location "eastus" \
  --tenant-id "<tenant-id>"
```

**Arc-enabled Kubernetes**: attach any CNCF-conformant Kubernetes cluster to Azure. Cluster appears in Azure Resource Manager; you can deploy applications and configurations using GitOps (Flux-based), apply Azure Policy to the cluster, use Microsoft Defender for Containers, and use Azure Monitor for container insights.

This is particularly useful for multi-cloud Kubernetes management. An EKS cluster on AWS and an AKS cluster on Azure can both be managed through the same Azure interfaces, with consistent policy enforcement and monitoring.

**Arc-enabled data services**: evaluate SQL Managed Instance on supported infrastructure. The current official overview lists SQL Managed Instance; do not assume older PostgreSQL offerings remain available. The data service runs in your on-premises or edge environment while being managed through Azure. This enables Azure-native data services for scenarios where data cannot leave on-premises (data sovereignty requirements, latency-sensitive edge applications).

## The governance use case

The strongest current use case for Arc is governance at scale across hybrid environments.

Azure Policy applied through Arc can assess configuration compliance across your entire estate — Azure VMs, on-premises servers, other cloud providers — from a single policy assignment. Compliance reports show which resources are compliant across all environments.

Defender for Cloud security score extends to Arc-enrolled machines. You get a unified security posture view that includes your data center alongside your cloud environments.

For organizations subject to regulatory compliance requirements (ISO 27001, SOC 2, NIST), maintaining consistent security controls across hybrid environments is a significant audit requirement. Arc provides a technical mechanism for enforcing and evidencing those controls.

## The limitations

**Arc is a management plane, not a workload migration tool**: Arc doesn't make non-Azure resources behave like Azure resources for all purposes. You can't use Azure-native features (Azure Load Balancer, Azure Blob Storage) on Arc-enrolled on-premises machines without data flowing through Azure. Arc manages; it doesn't transform.

**Latency in management operations**: management operations (policy assessment, configuration changes applied via Arc) are asynchronous and depend on the agent checking in with Azure. For time-sensitive configuration management, direct automation on the machine may be faster than waiting for Arc-mediated changes to propagate.

**Agent management overhead**: deploying and maintaining the Connected Machine agent across a large on-premises estate requires an agent deployment strategy, update management, and connectivity monitoring. At scale, this is manageable with automation, but it is not zero-overhead.

**Cost model**: distinguish resource registration from enabled management, monitoring, security and data services. Validate current pricing, entitlement, ingestion and retention for the proposed feature set; do not assume policy and Monitor are universally free with enrollment.

## When Arc is worth it

Arc is worth investing in when:
- You have significant on-premises or multi-cloud infrastructure that needs consistent management
- Regulatory compliance requires demonstrable control parity across all environments
- Your team already uses Azure-native tooling and wants to extend it, rather than adopting a separate hybrid management solution
- You're moving toward a hybrid cloud architecture over several years, with Azure as the control plane

For organizations that are primarily cloud-native (Azure-only or multi-cloud without significant on-premises), the Arc investment may not produce enough value to justify the onboarding effort.

*Evaluating Azure Arc for a hybrid environment or designing a multi-cloud management strategy? [Happy to compare what the implementation looks like at your scale.](/contact)*

## Separate enrollment from verified capability

Projecting a machine into Azure Resource Manager makes it visible to a management plane. It does not establish that monitoring, configuration assessment and updates are all functioning. Each capability has its own prerequisites, supported platforms, permissions and potentially separate billing. Define the operating result first, then select the Arc components needed to produce it.

In a hypothetical estate, 100 eligible servers are enrolled. Eighty provide the required inventory and assessment evidence, twelve are connected but lack a necessary extension, and eight have stale connectivity. Enrollment is 100%, while verified capability coverage is 80%. A portal object that exists is not evidence that the corresponding host is currently assessed or healthy.

The worksheet should include host owner, supported operating-system state, agent version, egress route, Azure resource identity, enabled extensions and last successful observation. Define when evidence becomes stale for each control. A management heartbeat and an application's successful transaction answer different questions; neither should silently stand in for the other.

## Rehearse the disconnected state

Onboard a disposable supported host using Microsoft's current procedure and a narrowly scoped onboarding identity. Use synthetic data. Verify the resource representation, then enable one required capability and confirm that its expected evidence appears. Registration is only the first checkpoint.

Temporarily interrupt the documented management egress in an isolated environment. Observe what continues locally, which central operations fail and when evidence becomes stale. Restore connectivity and verify reconciliation. A management-plane interruption need not stop the workload, but it can limit investigation or remediation, so the operating model must account for it.

Record the alternate route for authorized local administration. Protect that route and its credentials, and test it without depending on the same failed network or identity path. Centralized management can reduce context switching while introducing a shared dependency; acknowledge both effects in the recovery plan.

## Review extension privileges and host identity

Extensions may perform privileged operations on a machine. Review who may deploy, modify or remove them, and at what Azure scope. Separate onboarding from ongoing administration where practical. A uniform portal does not make Linux, Windows and Kubernetes security models identical or eliminate local administrator responsibilities.

A projected resource identity can authenticate to Azure services, subject to its effective grants and the host's local security boundary. For a lab, grant a test host one harmless action on one resource. Verify the permitted operation and a denied operation against another resource, then remove the grant and observe revocation. Retain decision evidence without recording tokens.

Maintain an agent and extension lifecycle plan: supported versions, pilot rings, update procedures, compatibility checks and rollback where supported. Measure overhead for the enabled feature set rather than assuming a universal lightweight footprint. A base agent, monitoring collection and security extensions may have different resource and cost implications.

## Evaluate the management improvement with comparable tasks

Choose a small estate representing the environments that matter. Compare inventory reconciliation, evidence retrieval and one maintenance task before and after onboarding. Record hands-on effort, incomplete operations, investigation time and the support required for disconnected hosts. A consolidated dashboard is useful only if its information is trustworthy and operators can act on it.

For Kubernetes and data services, review the support matrix separately from Arc-enabled servers. Azure's data-services overview during this review lists SQL Managed Instance; older descriptions of PostgreSQL offerings should not be carried forward as current capability. Local data placement also requires review of telemetry, metadata, backups and support access before drawing conclusions about residency.

Do not claim that policy, monitoring or related services are universally free with enrollment. Validate current pricing and entitlement for the exact feature set and region, including ingestion and retention. Cost attribution tags identify the resource's context; they do not automatically account for every on-premises operating cost.

Finish with a decision record describing the capabilities adopted, the duties remaining local, the evidence freshness required and the behavior during disconnection. This makes Arc a deliberate extension of an existing operating model rather than a promise that attaching heterogeneous infrastructure to one control plane makes it equivalent to native Azure compute.

Retain the tested support matrix and observation date alongside the decision so later product changes trigger a targeted review.

| Observation | Value (servers) |
| --- | ---: |
| Verified capability | 80 |
| Missing extension | 12 |
| Stale connectivity | 8 |

**Figure method.** Synthetic enrolled estate: 80+12+8=100 servers; verified capability coverage=80%. Registration alone does not establish current control operation.

## Further reading

- [Arc-enabled servers](https://learn.microsoft.com/en-us/azure/azure-arc/servers/overview)
- [Azure Arc overview](https://learn.microsoft.com/en-us/azure/azure-arc/overview)
- [Arc data-services scope](https://learn.microsoft.com/en-us/azure/azure-arc/data/overview)
