---
title: "Cloud Landing Zone Design: The Foundation That Everything Else Depends On"
description: "A landing zone is the account, network, identity, and governance baseline that cloud workloads run in. Getting it right at the beginning is much cheaper than retrofitting it after workloads are deployed."
date: 2027-10-27
tags: ["Cloud Architecture", "DevSecOps"]
format: article
---

A cloud landing zone is the configured, governed baseline environment into which workloads are deployed. It answers the questions that need to be answered once and applied consistently: how are accounts or subscriptions structured, how is identity managed, what network topology is used, what policies are enforced, what logging and monitoring is in place.

Organizations that skip landing zone design deploy workloads into an unstructured environment and accumulate the debt of inconsistent security controls, ad-hoc account structures, and governance gaps that are expensive to fix retroactively.

## The components

**Account or subscription structure**: cloud resources are organized into accounts (AWS), subscriptions (Azure), or projects (GCP). The structure determines billing boundaries, security isolation, and blast radius for configuration mistakes.

The most common enterprise pattern: separate accounts by environment (production, staging, development) and by workload domain. A production account for the core business application, a separate account for data analytics, a separate account for security tooling. This supports billing attribution and permission boundaries. Cross-account roles, shared identities and organization-level controls can still connect blast radius, so verify isolation rather than assuming compromise cannot cross accounts.

AWS Control Tower, Azure Management Groups, and GCP Resource Hierarchy provide the organizational structure above individual accounts/subscriptions, enabling centralized policy management across many accounts.

**Identity and access management**: how are human users and service accounts managed? The principle is least privilege from the beginning, not as a retrofit.

For human access: federated identity (Entra ID, Okta, or your corporate IdP) integrated with cloud IAM. Engineers do not have individual IAM users; they authenticate through your corporate directory. Privileged access should use suitable time-bounded grants and approval where appropriate. Azure PIM can support eligible role activation; AWS IAM Identity Center permission sets define access and session properties but are not, alone, a complete just-in-time approval workflow.

For service accounts: no long-lived credentials. Use cloud-native identity mechanisms (AWS IAM Roles for EC2/Lambda/ECS, Azure Managed Identities, GCP Service Accounts with workload identity federation) so applications authenticate without storing credentials.

**Network topology**: the hub-and-spoke pattern is the enterprise default. A central hub contains shared services (VPN/ExpressRoute gateway, firewall, centralized DNS, bastion hosts). Spoke VNets/VPCs contain individual workloads. Traffic between spokes routes through the hub for inspection.

Define private IP address ranges at landing zone time, before any workloads are deployed. Overlapping address spaces between VNets/VPCs and on-premises networks cause routing problems that are expensive to resolve after workloads are running.

**Policy baseline**: policies that apply to all accounts and all resources. On AWS, Service Control Policies applied at the organizational unit level. On Azure, Azure Policy assigned at the Management Group level. On GCP, Organization Policies.

Essential policy baseline:
- Deny resource creation in unsupported regions (data sovereignty, cost management)
- Require encryption at rest on all storage resources
- Require specific tags on all resources (cost attribution)
- Deny public access on storage buckets/blobs unless explicitly allowed
- Require MFA for all human identities accessing the cloud console

**Logging and monitoring baseline**: CloudTrail (AWS), Activity Log (Azure), or Audit Logs (GCP) enabled in all accounts. Logs aggregated to a central, immutable log archive account. VPC flow logs enabled. A security operations center (SIEM) or cloud-native security service (AWS Security Hub, Microsoft Sentinel, Google Chronicle) ingesting security-relevant events.

## The automation imperative

A landing zone that exists as documentation and is applied manually is not a landing zone — it is a checklist that will be applied inconsistently and will drift over time.

Landing zone configuration should be code:
- AWS Control Tower with AWS CDK or Terraform for account baseline automation
- Azure Landing Zone (the reference implementation from Microsoft) with Bicep or Terraform
- GCP Cloud Foundation Fabric

When a new account is created, it should automatically receive all baseline configuration — policies, networking, IAM, logging — through automated deployment. Manual steps are an exception, not the rule.

## When to invest in landing zone design

Before the first production workload is deployed. The cost of designing a landing zone before workloads exist is 100% spent on design and automation. The cost of designing it after workloads exist is design, automation, plus the effort to migrate existing workloads and fix the security and governance gaps that accumulated in the unstructured environment.

Retrofitting a baseline can require migration, compatibility work and remediation around existing workloads. Estimate that effort from the estate rather than assuming a universal multiplier; an incremental baseline can still be appropriate when requirements are evolving.

*Designing a cloud landing zone for a new cloud environment or retrofitting governance into an existing one? [Happy to compare approaches for your specific provider and scale.](/contact)*

## Treat the baseline as a versioned service contract

A landing zone is consumed by workload teams, so its contract should distinguish what a new account receives from what the application team must supply. Central teams can provide identity integration, protected audit delivery, network allocation and policy boundaries. They cannot determine every workload's business recovery objective or retention requirement without that workload's owner. Document those handoffs alongside the technical configuration.

Begin with one representative application and its threat model. Identify which resources ordinary application administrators must not control, which cross-account permissions are necessary and which emergency actions must remain possible. Separate accounts can reduce blast radius, but shared identities, organization-level privileges and cross-account grants can reconnect the failure domains. Verify isolation with negative tests instead of treating account names as evidence.

Give the baseline a version that identifies its policy bundle, network design and deployment artifacts. A workload owner should be able to discover the installed version, pending changes and required actions. A baseline update that changes routes or denies a previously used API can disrupt applications. Pilot those changes, retain deployment evidence and define remediation before broad rollout.

## Calculate onboarding effort without hiding setup cost

In a hypothetical quarter, 24 workload accounts need onboarding. Manual baseline setup requires six hands-on hours per account, or 144 hours. The automated path requires one hour per account and 48 hours of initial engineering, totaling 72 hours. The direct first-quarter difference is therefore 72 hours. These figures are illustrative planning inputs, not customer delivery results or a universal automation benchmark.

A later quarter with identical demand would use 24 execution hours before maintenance and exception handling. Do not omit those costs merely because the initial build is complete. Separate elapsed waiting time from hands-on effort: an approval can delay an account without consuming continuous engineering time. Include failed requests and retries so the reported improvement does not reflect only the successful path.

Use the figure to explain the model's inputs rather than claiming that automation halves every organization's onboarding cost. Recalculate with lower account demand or a more complex baseline. The investment can still be valuable for consistency or auditability even when direct time savings are modest, but those benefits should be described separately.

## Build acceptance evidence for each control

The worksheet needs the control objective, implementation, owner, test and evidence location. For audit delivery, generate a harmless event and verify its arrival in the protected archive. Test whether a workload administrator can disable the source or alter the archive under the chosen privilege model. For access, try a normal user, an expired grant and a documented emergency identity with non-sensitive resources.

For networking, reserve nonoverlapping addresses based on projected use and connected networks. Hub-and-spoke is one topology, not a universal enterprise requirement. Peering does not automatically create transit or inspection. Verify effective routes, forwarding, return paths and the actual appliance traversed. A shared firewall or resolver has its own capacity and recovery requirements.

For policies, distinguish permission guardrails from configuration and identity controls. An AWS SCP limits permissions but does not grant access or automatically configure resources. An Azure policy can audit, deny or modify selected behavior depending on its effect and coverage. Verify the actual service and API scope before promising a universal guarantee. Record exceptions with a reason, owner and expiry.

## Exercise incomplete provisioning and baseline updates

Interrupt a disposable account's provisioning after identity setup but before audit delivery is ready. Confirm that retry is safe, incomplete resources are visible and the account is not mistakenly approved for production use. An automation system should distinguish “created” from “ready.” Retain enough information to repair partial failure without rerunning destructive steps blindly.

Next apply a restrictive policy to one pilot workload. Test an intended denial and a legitimate change, then verify the emergency route without disabling controls for the entire organization. Publish release notes that explain the changed behavior and required action to workload owners.

Track failed onboarding, unresolved exception age and time to repair alongside speed. A fast account factory that leaves missing access or logging controls is not successful. Reconcile deployed resources with the intended baseline periodically, because the original pipeline is only one path by which the environment changes. This establishes a service that teams can use and operators can maintain rather than a one-time collection of templates.

| Observation | Value (hours) |
| --- | ---: |
| Manual setup | 144 |
| Automated execution | 24 |
| Initial automation | 48 |

**Figure method.** Synthetic 24-account quarter: manual=24×6=144 hours; automated path=24×1+48=72. Difference=72 hours. Maintenance, exceptions and elapsed approval waits excluded.

## Further reading

- [Azure landing-zone architecture](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/)
- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
