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

## Start every practice design with identity, scope and evidence

Set aside a disposable compartment in an authorized learning tenancy and document its owner, approved region and cleanup window. Write the expected permissions before creating anything. Give the human learner and the sample workload distinct identities. With a synthetic object in an approved bucket, ask the learner to explain which identity can read the object and which can modify the configuration. Verify the expected behavior using scoped permissions and a permitted test identity, then record the result, the resource location and the policy revision. Waiting for policy changes or confusing identities can obscure the first test, so capture both the attempted operation and the principal that made it.

OCI IAM policy statements depend on subject, resource type and location, with optional conditions. Map a proposed statement to an intended action instead of memorizing the four verbs as an API method table. The action mapping varies with resource type. Read the policy reference for the specific service and compare one approved operation and one deliberately disallowed operation in the training compartment. This tests the boundaries of the statement without broad privileges or customer data. [Oracle IAM policies overview](https://docs.oracle.com/en-us/iaas/Content/Identity/policieshow/Policy_Basics.htm)

## Trace routing and authorization as separate questions

Use a single fictional workload that processes jobs on a private subnet and stores its finished outputs in Object Storage. The workload is reached only through an approved internal route. Write the path for each legitimate request, including where it leaves the subnet and which system admits it. Compare the route rules with the applied security list and network security groups. Then identify the IAM permission relevant to the destination service. Being able to send network traffic to a service endpoint does not give the caller permission to modify resources there.

| Practice request | Path or control to verify | Observation to record |
| --- | --- | --- |
| Application to OCI Object Storage in the region | Private subnet route and service gateway configuration for the approved service | Request reaches the endpoint and IAM allows the intended object operation |
| Client to private application | Approved connected subnet or network and application port | Application responds using its expected certificate and method |
| Administrative change | Scoped human IAM group and audited configuration change | Intended permission grants the required resource action |
| New subnet for recovery | Nonoverlapping CIDR and documented connectivity | Plan meets address needs and converges on its intended route |

For an example CIDR exercise, 10.20.4.0/24 contains 256 total IPv4 addresses. Two /25 blocks split that range into 128 addresses each before provider reservations. Compare usable addresses under OCI's rules with planned VNICs and any needed headroom for load balancers, upgrades, and recovery. Demonstrate how you would adjust addressing when a connected network already uses one proposed block. Record route target, packet direction, application port, and permission check in each design decision. [Oracle OCI networking overview](https://docs.oracle.com/en-us/iaas/Content/Network/Concepts/overview.htm)

## Practice one recovery scenario end to end

Select a failure boundary before choosing resources. Fault domain placement can reduce correlated infrastructure failures within an availability domain. A design for an availability-domain loss needs service support for alternative placement and sufficient capacity outside that domain. A regional failure calls for a separate recovery design and a working second-region dependency inventory. Confirm that your intended resources are available in the regions and domains you choose. Draw the dependency separately for data, networking, identity, secrets and client failover. [Oracle OCI regions and availability domains](https://docs.oracle.com/en-us/iaas/Content/General/Concepts/regions.htm)

In a fictional exercise, a job system sets a 45-minute recovery time objective and a 10-minute recovery point objective. A verified recovery at 10:38 after a 10:00 interruption takes 38 minutes and meets the time objective. If the latest recovered correct checkpoint predates the interruption by 12 minutes, the exercise misses its data loss objective by two minutes. Record the type of database backup or replication used and the evidence that the checkpoint represents recoverable application state. A successful database connection alone does not prove the app processed the right jobs after recovery.

Use synthetic records with timestamps. Check one write before the chosen failure, one near the scenario boundary, and normal application progress after restoring. Document what is expected to be recovered, what gets replayed, and how a rerun avoids duplicate work. Compare the observed results against both objectives. Include the time needed to restore access, redirect the caller and confirm behavior rather than measuring only the creation of a new instance.

## Turn study time into observable practice

Create a worksheet with one row for each current blueprint area and links to the Oracle documentation for topics you practiced. For a design you completed with a walkthrough, schedule a fresh attempt in a temporary compartment, with the walkthrough closed. Require yourself to state the service, expected output, and reason an alternative would fail the scenario. Record a pass only when you can reproduce the setup, verify the intended behavior, and remove disposable resources at the end. A written diagram is sufficient for a topic whose service is unavailable in your approved environment. Mark that topic separately from hands-on completion.

A useful rotation includes an IAM boundary, one private network path, object lifecycle and access, storage recovery, and a failover dependency inventory. At the end of the week review failed checks by domain and prioritize repeat trials that require understanding, such as explaining a routing decision or identifying the actual identity. Review costs and quotas before each lab. Some exercises can be done with configuration planning or service limits documentation without leaving billable compute running. Save only synthetic output, record when you verified the guidance, and return to Oracle University for the official exam content and booking details. [Oracle University OCI Architect Associate learning path](https://learn.oracle.com/ols/learning-path/become-an-oci-architect-associate/163512/162234)

Build a small peer review into the rotation. Hand a colleague a single diagram and ask them to predict the outcome of one authorized storage read and one blocked configuration change. If they cannot identify the principal and destination from the diagram, revise those labels first. Capture any assumptions about regional availability and resource limits directly beside the verified practice result.
