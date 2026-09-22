---
title: "GCP Associate Cloud Engineer: Topic Coverage and Exam Strategy"
description: "The ACE exam tests whether you can deploy and manage workloads on Google Cloud — not just describe services. Here's how the exam is structured, which topics carry the most weight, and how to build the hands-on foundation it expects."
date: 2026-07-14
tags: ["Cloud Architecture", "Certifications"]
format: article
---

The Google Cloud Associate Cloud Engineer (ACE) exam is positioned as the entry point to professional-level GCP certification. Unlike AWS Cloud Practitioner (conceptual) or AWS Solutions Architect Associate (architecture design), the ACE is explicitly operational — it tests whether you can deploy, configure, and manage Google Cloud resources using the Cloud Console and `gcloud` CLI.

If you haven't used `gcloud` commands in anger, the exam will be harder than the practice tests suggest.

## Exam domains and emphasis

**Setting up a cloud solution environment (17.5%):**
- Creating and managing projects, billing accounts, and resource hierarchy (Organisation → Folders → Projects → Resources)
- IAM: roles (primitive, predefined, custom), service accounts, workload identity. Know the difference between roles/viewer, roles/editor, roles/owner, and why you shouldn't use primitive roles in production.
- APIs: enabling and disabling Google Cloud APIs per project

**Planning and configuring a cloud solution (17.5%):**
- Compute: Compute Engine (VMs), Google Kubernetes Engine (managed Kubernetes), Cloud Run (serverless containers), App Engine (fully managed platform). Know when to use each.
- Storage: Cloud Storage (object), Persistent Disk (block), Filestore (NFS). Know the storage class options for Cloud Storage: Standard, Nearline (30-day minimum), Coldline (90-day), Archive (365-day).
- Networking: VPC, subnets, firewall rules, load balancers (HTTP(S), TCP/UDP, Internal). Know that GCP VPCs are global (subnets are regional) — different from AWS where VPCs are regional.
- Database: Cloud SQL (managed MySQL/PostgreSQL/SQL Server), Cloud Spanner (globally distributed relational), Cloud Bigtable (NoSQL wide-column for high throughput), Firestore (NoSQL document), Memorystore (managed Redis/Memcached)

**Deploying and implementing a cloud solution (25%)** — the heaviest domain:
This section tests actual implementation. You need to know `gcloud` commands:
- `gcloud compute instances create`
- `gcloud container clusters create` / `kubectl apply`
- `gcloud run deploy`
- `gcloud storage cp` / `gsutil cp`
- `gcloud sql instances create`
- `gcloud iam service-accounts create`

Know the flags. Know that `--zone` vs `--region` matters. Know how to SSH to a Compute Engine instance (`gcloud compute ssh`).

**Ensuring successful operation of a cloud solution (20%):**
- Monitoring: Cloud Monitoring (formerly Stackdriver), Cloud Logging, Cloud Trace, Cloud Profiler
- Log-based alerts and uptime checks
- Managing Compute Engine instances: snapshots, instance templates, managed instance groups (MIGs)
- Managing GKE clusters: node pools, cluster upgrades, horizontal pod autoscaler

**Configuring access and security (20%):**
- Workload Identity: the correct way to let a Kubernetes pod access GCP APIs without service account key files. Maps a Kubernetes service account to a GCP service account via OIDC.
- Audit logging: Data Access audit logs (who accessed what data), Admin Activity audit logs (who changed what configuration). Know which are enabled by default (Admin Activity) and which require explicit enabling (Data Access).
- VPC Service Controls: organization-level boundaries around GCP services to prevent data exfiltration
- Cloud Armor: WAF and DDoS protection, attached to Cloud Load Balancing

## The concepts that differ from AWS/Azure

**Global VPCs**: GCP VPCs span all regions globally. A single VPC can have subnets in us-central1 and europe-west2 without any peering or transit configuration. Internal traffic between regions within a VPC stays on Google's private backbone. This is architecturally different from AWS (regional VPCs) and Azure (regional VNets).

**Firewall rules**: GCP firewall rules are applied at the VPC level, not the subnet level. Rules use tags — a VM tagged `web-server` can be targeted by a rule that allows TCP 443 from anywhere to VMs with that tag. This is more flexible than security groups applied per instance.

**Cloud IAM is additive, not restrictive**: you grant access; you don't deny it (with the exception of Deny policies, a newer feature). At/above the resource level, permissions accumulate from parent levels. A user with roles/viewer at the project level has viewer access to all resources in the project.

**Preemptible VMs and Spot VMs**: Preemptible VMs are the legacy option (deprecated, still functional). Spot VMs are the replacement — they're cheaper, but Google can reclaim them at any time with a 30-second interruption notice. Not suitable for stateful workloads; well-suited for batch jobs and fault-tolerant workloads.

## Building the hands-on foundation

Google offers free credits and a free tier. The exercises worth completing before the exam:

1. Deploy a Compute Engine VM, SSH in, install a web server, create a firewall rule to allow HTTP traffic.
2. Create a GKE cluster, deploy a containerised application from Cloud Run or with kubectl, expose it via a Load Balancer.
3. Create a Cloud SQL instance, connect from a Compute Engine VM in the same VPC using private IP.
4. Set up a service account, grant it Cloud Storage access, create a VM that uses the service account, and verify it can read from a bucket without a key file.
5. Create a Cloud Monitoring dashboard with CPU utilization and an alert policy.

These five exercises cover about 70% of the scenario-based exam questions.

## Exam format and preparation

The ACE exam is approximately 50 questions, 2 hours. Multiple choice and multiple select.

Resources:
- **Google Cloud Skills Boost**: Google's official training platform. The "Associate Cloud Engineer" learning path covers all exam domains.
- **Terraform + GCP**: the exam doesn't explicitly test Terraform, but knowing how infrastructure-as-code concepts map to GCP resources helps with complex scenario questions.
- **Practice exams**: Google provides a practice exam (paid). Tutorials Dojo has a highly-rated set of ACE practice tests.

*Planning a multi-cloud certification path? [Happy to suggest an order that builds well.](/contact)*
