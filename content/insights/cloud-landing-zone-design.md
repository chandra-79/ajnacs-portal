---
title: "Cloud Landing Zone Design: The Foundation That Everything Else Depends On"
description: "A landing zone is the account, network, identity, and governance baseline that cloud workloads run in. Getting it right at the beginning is much cheaper than retrofitting it after workloads are deployed."
date: 2025-11-05
tags: ["Cloud Architecture", "DevSecOps"]
format: article
---

A cloud landing zone is the configured, governed baseline environment into which workloads are deployed. It answers the questions that need to be answered once and applied consistently: how are accounts or subscriptions structured, how is identity managed, what network topology is used, what policies are enforced, what logging and monitoring is in place.

Organizations that skip landing zone design deploy workloads into an unstructured environment and accumulate the debt of inconsistent security controls, ad-hoc account structures, and governance gaps that are expensive to fix retroactively.

## The components

**Account or subscription structure**: cloud resources are organized into accounts (AWS), subscriptions (Azure), or projects (GCP). The structure determines billing boundaries, security isolation, and blast radius for configuration mistakes.

The most common enterprise pattern: separate accounts by environment (production, staging, development) and by workload domain. A production account for the core business application, a separate account for data analytics, a separate account for security tooling. This provides natural billing attribution, security isolation (a compromised production account doesn't affect data analytics), and clean service control policy application.

AWS Control Tower, Azure Management Groups, and GCP Resource Hierarchy provide the organizational structure above individual accounts/subscriptions, enabling centralized policy management across many accounts.

**Identity and access management**: how are human users and service accounts managed? The principle is least privilege from the beginning, not as a retrofit.

For human access: federated identity (Entra ID, Okta, or your corporate IdP) integrated with cloud IAM. Engineers do not have individual IAM users; they authenticate through your corporate directory. Privileged access (production write access, security tooling) uses just-in-time elevation (Azure PIM, AWS IAM Identity Center permission sets) rather than permanent standing access.

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

Organizations that begin cloud adoption without a landing zone typically spend 2-3x more effort on landing zone work compared to doing it upfront, because they are working around existing workloads and cleaning up accumulated problems.

*Designing a cloud landing zone for a new cloud environment or retrofitting governance into an existing one? [Happy to compare approaches for your specific provider and scale.](/contact)*
