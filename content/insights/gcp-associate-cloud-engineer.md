---
title: "GCP Associate Cloud Engineer: Topic Coverage and Exam Strategy"
description: "The ACE exam tests whether you can deploy and manage workloads on Google Cloud — not just describe services. Here's how the exam is structured, which topics carry the most weight, and how to build the hands-on foundation it expects."
date: 2027-01-11
tags: ["Cloud Architecture", "Certifications"]
format: article
---

The Google Cloud Associate Cloud Engineer (ACE) exam is positioned as the entry point to professional-level GCP certification. Unlike AWS Cloud Practitioner (conceptual) or AWS Solutions Architect Associate (architecture design), the ACE is explicitly operational — it tests whether you can deploy, configure, and manage Google Cloud resources using the Cloud Console and `gcloud` CLI.

If you haven't used `gcloud` commands in anger, the exam will be harder than the practice tests suggest.

## Exam domains and emphasis

**Setting up a cloud solution environment:**
- Creating and managing projects, billing accounts, and resource hierarchy (Organisation → Folders → Projects → Resources)
- IAM: roles (primitive, predefined, custom), service accounts, workload identity. Know the difference between roles/viewer, roles/editor, roles/owner, and why you shouldn't use primitive roles in production.
- APIs: enabling and disabling Google Cloud APIs per project

**Planning and configuring a cloud solution:**
- Compute: Compute Engine (VMs), Google Kubernetes Engine (managed Kubernetes), Cloud Run (serverless containers), App Engine (fully managed platform). Know when to use each.
- Storage: Cloud Storage (object), Persistent Disk (block), Filestore (NFS). Know the storage class options for Cloud Storage: Standard, Nearline (30-day minimum), Coldline (90-day), Archive (365-day).
- Networking: VPC, subnets, firewall rules, load balancers (HTTP(S), TCP/UDP, Internal). Know that GCP VPCs are global (subnets are regional) — different from AWS where VPCs are regional.
- Database: Cloud SQL (managed MySQL/PostgreSQL/SQL Server), Cloud Spanner (globally distributed relational), Cloud Bigtable (NoSQL wide-column for high throughput), Firestore (NoSQL document), Memorystore (managed Redis/Memcached)

**Deploying and implementing a cloud solution**:
This section tests actual implementation. You need to know `gcloud` commands:
- `gcloud compute instances create`
- `gcloud container clusters create` / `kubectl apply`
- `gcloud run deploy`
- `gcloud storage cp` / `gsutil cp`
- `gcloud sql instances create`
- `gcloud iam service-accounts create`

Know the flags. Know that `--zone` vs `--region` matters. Know how to SSH to a Compute Engine instance (`gcloud compute ssh`).

**Ensuring successful operation of a cloud solution:**
- Monitoring: Cloud Monitoring (formerly Stackdriver), Cloud Logging, Cloud Trace, Cloud Profiler
- Log-based alerts and uptime checks
- Managing Compute Engine instances: snapshots, instance templates, managed instance groups (MIGs)
- Managing GKE clusters: node pools, cluster upgrades, horizontal pod autoscaler

**Configuring access and security:**
- Workload Identity: the correct way to let a Kubernetes pod access GCP APIs without service account key files. Maps a Kubernetes service account to a GCP service account via OIDC.
- Audit logging: Data Access audit logs (who accessed what data), Admin Activity audit logs (who changed what configuration). Know which are enabled by default (Admin Activity) and which require explicit enabling (Data Access).
- VPC Service Controls: organization-level boundaries around GCP services to prevent data exfiltration
- Cloud Armor: WAF and DDoS protection, attached to Cloud Load Balancing

## The concepts that differ from AWS/Azure

**Global VPCs**: GCP VPCs span all regions globally. A single VPC can have subnets in us-central1 and europe-west2 without any peering or transit configuration. Internal traffic between regions within a VPC stays on Google's private backbone. This is architecturally different from AWS (regional VPCs) and Azure (regional VNets).

**Firewall rules**: GCP firewall rules are applied at the VPC level, not the subnet level. Rules use tags — a VM tagged `web-server` can be targeted by a rule that allows TCP 443 from anywhere to VMs with that tag. This is more flexible than security groups applied per instance.

**Evaluate effective IAM permissions**: allow policies can inherit through the resource hierarchy, while deny policies and other controls also affect access. At/above the resource level, permissions accumulate from parent levels. A user with roles/viewer at the project level has viewer access to all resources in the project.

**Preemptible VMs and Spot VMs**: Spot and preemptible compute require interruption-tolerant design. Do not assume a guaranteed warning interval; review current service behavior. Stateful work needs durable state, checkpointing and recovery appropriate to its interruption risk.

## Building the hands-on foundation

Google offers free credits and a free tier. The exercises worth completing before the exam:

1. Deploy a Compute Engine VM, SSH in, install a web server, create a firewall rule to allow HTTP traffic.
2. Create a GKE cluster, deploy a containerised application from Cloud Run or with kubectl, expose it via a Load Balancer.
3. Create a Cloud SQL instance, connect from a Compute Engine VM in the same VPC using private IP.
4. Set up a service account, grant it Cloud Storage access, create a VM that uses the service account, and verify it can read from a bucket without a key file.
5. Create a Cloud Monitoring dashboard with CPU utilization and an alert policy.

These exercises develop selected operational skills; no reliable percentage of actual exam-question coverage is claimed.

## Exam format and preparation

Check the official certification page for the current standard or renewal exam format, duration, fees and candidate requirements before booking.

Resources:
- **Google Cloud Skills Boost**: Google's official training platform. The "Associate Cloud Engineer" learning path covers all exam domains.
- **Terraform + GCP**: the exam doesn't explicitly test Terraform, but knowing how infrastructure-as-code concepts map to GCP resources helps with complex scenario questions.
- **Practice exams**: Use the preparation and sample-question resources linked from Google's current certification page; evaluate any additional practice material against the official guide.

*Planning a multi-cloud certification path? [Happy to suggest an order that builds well.](/contact)*

## Build a study plan from the current official guide

Certification scope, weighting, delivery format and pricing can change. Use Google's current certification page and the standard exam guide linked from it as the authority when booking and planning study. The topic sections here organize operational learning; they should not be treated as a permanently fixed weighting table. A public practice question set is also not evidence that a short collection of labs covers a particular percentage of the actual exam.

Start with an inventory of the guide's task statements. For each, record whether you can explain the decision, execute the task with documentation and repeat it without a step-by-step tutorial. Keep those evidence levels separate. Memorizing a command flag can help with a scenario, but understanding project, identity, location and resource scope is what prevents an apparently correct command from changing the wrong environment.

Use a dedicated practice project, explicit configuration and a cleanup checklist. Understand billing before creating resources. Budget notifications are useful but should not be assumed to be a universal hard spending cap. Prefer small disposable workloads and delete resources that continue accruing charges, including disks, addresses and managed services left after a VM or application is removed.

## Work through a learning-evidence example

Consider a hypothetical study inventory of forty tasks drawn from the candidate's selected guide. Initially, sixteen can be completed independently, fourteen require documentation and ten are untested. After focused practice, twenty-eight are independent, eight require documentation and four remain untested. Independent completion rises from 40% to 70%. This is a self-assessment of the selected task set, not a predicted exam score or a validated competence scale.

The figure shows the before-and-after counts for independent tasks and the remaining untested tasks. Keep documentation-assisted work visible in the worksheet even though it is not one of the chart bars. Using documentation is normal engineering practice; the distinction helps target study rather than ranking an engineer's worth.

For each failed task, record the error, its cause and the concept that was missing. Group mistakes into identity, location, API enablement, quota, networking, data semantics or lifecycle. Repeat the task after a delay so immediate recall of a tutorial is not mistaken for retained understanding.

## Build one connected operational lab

Create a harmless application that reads a synthetic object using a workload identity with only the required access. Verify the allowed read and a denied operation against another resource. Avoid downloading a long-lived service-account key merely to simplify the exercise when an appropriate attached or federated identity path is available. Record the effective identity at runtime rather than assuming it matches the user who deployed the application.

Add a health signal and a log entry that excludes credentials and sensitive content. Break one permission intentionally in the disposable project, observe the application symptom and restore the intended grant. Distinguish authentication from authorization and application failure from deployment failure. A successful deployment can still run with the wrong runtime permissions.

Next make the dependency temporarily unavailable or point the test application at an invalid resource. Verify bounded failure behavior and useful diagnostic evidence. If the workload retries, record its deadline and avoid an uncontrolled loop that consumes resources. End by deleting the test deployment and confirming the associated billable resources are removed.

## Compare service choices using constraints

For a scenario question, extract the workload's requirements before choosing a product: statefulness, request duration, concurrency, operational ownership, location and recovery. A familiar service name is not enough. A managed container platform and a VM can both run code while giving different control and responsibility boundaries.

Understand network scope without treating it as a security guarantee. Google Cloud VPC networks are global resources with regional subnets, while firewall policies and rules determine allowed communication under their respective scopes and targets. Learn how identity permissions inherit and how deny policies and other controls affect effective access. A simple statement that IAM only adds permissions omits important behavior.

For interruptible compute, design around interruption rather than assuming a guaranteed warning period. A stateful workload may be feasible when durable state and recovery are handled appropriately, but an uncheckpointed single process can lose progress. Test checkpoint and restart behavior with synthetic work before deciding whether the cost model is suitable.

## Review mistakes as decisions

After a practice question, explain why the chosen answer satisfies the stated constraints and why another plausible answer does not. Use official documentation to resolve disagreement. Do not use leaked examination content or equate memorizing answers with operating skill.

Before booking, re-open the official guide and confirm changes since study began. Check the standard versus renewal route, current format and candidate requirements directly. The durable outcome of preparation is a set of reproducible operational exercises and a clearer model of identity, networking, deployment and recovery; the certification is a separate assessment of its published scope.

| Observation | Value (tasks) |
| --- | ---: |
| Independent before | 16 |
| Independent after | 28 |
| Untested before | 10 |
| Untested after | 4 |

**Figure method.** Synthetic forty-task self-assessment: independent 16/40=40% then 28/40=70%; documentation-assisted counts 14 then 8; untested 10 then 4. Not an exam-score predictor.

## Further reading

- [Google certification requirements](https://cloud.google.com/learn/certification/cloud-engineer)
- [Official standard exam guide](https://services.google.com/fh/files/misc/associate_cloud_engineer_exam_guide_english.pdf)
- [Google Cloud Spot VM behavior](https://cloud.google.com/compute/docs/instances/spot)
