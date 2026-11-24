---
title: "OCI Architect Associate Study Guide: What the Exam Actually Tests"
description: "A practitioner's guide to the Oracle Cloud Infrastructure Architect Associate exam — the topics that get the most questions, the OCI-specific concepts that differ from AWS/Azure, and a focused study path for engineers with prior cloud experience."
date: 2025-01-24
tags: ["Cloud Architecture", "OCI", "Certifications"]
format: article
---

Use the [Oracle University Architect Associate learning path](https://learn.oracle.com/ols/learning-path/become-an-oci-architect-associate/163512/162234) to find the current exam code and blueprint before booking. AWS or Azure experience helps with the baseline concepts. Focus your labs on OCI resource identity, routing, storage and recovery.

The sections below are a practice sequence. Use Oracle’s current blueprint for official topic coverage and the registration page for timing.

## What to measure

**Repeatable hands-on verification.** Track whether you can finish a lab from a blank tenancy and explain each design choice without notes. For 12 labs with 9 completed unaided, unaided completion is 75%. Revisit failed domains and verify the current exam blueprint directly before booking.

*Illustrative measurement. Any numbers in this example are hypothetical.*

## Tenancy and IAM: the foundation the exam builds on

OCI's identity model is compartment-based. Everything in OCI lives in a compartment — a logical grouping of resources that forms the boundary for policies, quotas, and access control. Understanding the compartment hierarchy and how policies attach to compartments (not individual resources) is fundamental to OCI IAM.

**Policies** grant permissions to groups, not users. The syntax is explicit:
```
Allow group <group-name> to <verb> <resource-type> in <location>
```

Verbs matter: `inspect` (list), `read` (inspect + get), `use` (read + update operations), `manage` (full control). The exam tests whether you know which verb allows which actions.

**Dynamic Groups** allow compute instances, functions, and other OCI resources to authenticate with IAM and call OCI APIs. This is the OCI equivalent of AWS IAM Roles for EC2 — essential for any architecture where a compute resource needs to access Object Storage, Secrets Manager, or other services without stored credentials.

**Federation** with identity providers (IDCS, Microsoft Entra ID, Okta) is frequently tested. Know how to set up a federation, understand the difference between IDCS (Oracle's native identity service) and external providers, and understand group mappings.

## Compute and networking

**Compute shapes** come in four families: Standard (general purpose), Optimised (high CPU frequency), GPU, and Dense I/O (NVMe-attached storage). The Flex shapes (VM.Standard.E4.Flex, VM.Standard3.Flex) let you specify OCPUs and memory independently — know how these work and the ratio limits.

**Virtual Cloud Network (VCN)** architecture: VCN → subnets (public or private) → security lists or network security groups. The difference between security lists and network security groups is tested — security lists are attached to subnets and apply to all resources in the subnet; NSGs are attached to individual VNICs and give per-resource control. NSGs are more flexible; new architectures should prefer them.

**Route tables** control traffic flow. Know the default route table, know how to add a route for internet-bound traffic (through an Internet Gateway), and know how Private IPs in different subnets route to each other. The exam includes routing scenarios.

**Load Balancer vs Network Load Balancer**: OCI Load Balancer (Layer 7, HTTP/HTTPS) vs Network Load Balancer (Layer 4, TCP/UDP). Know which to choose for which use case. The exam tests this.

**FastConnect** (dedicated connectivity, similar to AWS Direct Connect) and **VPN Connect** (IPSec VPN) for hybrid connectivity. Know the architecture of each and when to choose one over the other.

## Storage: the types and their use cases

- **Block Volume**: persistent block storage for compute instances. Boot volumes and data volumes. Know about volume performance tiers (Lower Cost, Balanced, High Performance), volume backup policies, and cross-region replication.
- **Object Storage**: Standard, Infrequent Access, and Archive tiers. Lifecycle policies automate tier transitions. Pre-Authenticated Requests (PARs) allow temporary access to objects without credentials.
- **File Storage**: NFS-based, multi-client access. For shared file systems across compute instances.
- **Local NVMe**: included with Dense I/O shapes, ephemeral, very high IOPS. Data is lost when instance terminates.

The exam frequently asks about when to use which storage type. Block Volume for OS and database, Object Storage for unstructured data and backups, File Storage for shared file systems.

## Database services

OCI's database offerings are distinct from other clouds because of the Autonomous Database. Know these:

- **Autonomous Database**: Oracle's managed database service with automated tuning, patching, and scaling. Two workload types: OLTP (Autonomous Transaction Processing) and Analytics (Autonomous Data Warehouse). The exam tests the differences.
- **Base Database Service**: managed Oracle Database on bare metal or VMs with full control over the Oracle version and configuration.
- **Exadata**: Oracle's high-performance database platform. Know the infrastructure architecture (DB Servers + Storage Servers + RDMA network).
- **MySQL HeatWave**: managed MySQL with the HeatWave in-memory query accelerator for analytics on the transactional database without ETL.

## High availability and disaster recovery

OCI's physical structure: **Region** → **Availability Domains (ADs)** → **Fault Domains (FDs)**. The available number of availability domains varies by region. Each availability domain has three fault domains. Check region availability before settling on an HA design.

The key architectural pattern: distribute resources across multiple ADs for region-level HA, distribute within an AD across multiple FDs for AD-level HA. For a 3-AD region, running a 3-node cluster with one node per AD gives you protection against AD failure.

**Remote Peering** connects VCNs across regions. Know the use cases for intra-region peering (Local Peering Gateway) vs cross-region peering (Remote Peering Connection via DRG).

## The study approach for engineers with cloud experience

For engineers already certified on AWS or Azure:

1. **OCI concepts documentation** (not the tutorials, the architecture reference) — read the IAM, Networking, and Compute sections carefully. The architecture is different enough to require careful reading.
2. **Oracle's free OCI learning path** on Oracle University — the "OCI Architect Associate" path covers the exam objectives systematically.
3. **Practice exams** — Oracle provides sample questions; third-party practice exams (Whizlabs, ExamTopics) are useful for pattern recognition.
4. **Hands-on**: OCI Free Tier provides access to most services needed for the exam. Build the architectures — a VCN with subnets, a compute instance, a load balancer, Object Storage policies.

When reviewing practice questions, explain which architecture meets the constraints and why the other options fail. Verify question count and duration with Oracle for your specific booked exam.

*Preparing for OCI certification alongside other cloud certs? [Happy to share what's worked.](/contact/)*
