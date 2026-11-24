---
title: "The Gap Between Local Development and Cloud Deployment (and How to Close It)"
description: "Docker makes local development feel cloud-like. The gap between a Docker Compose environment and a production Kubernetes cluster is wider than most teams discover before their first production incident."
date: 2028-01-26
tags: ["Developer Tools", "Infrastructure", "Cloud Architecture"]
format: article
---

Docker Compose starts four services, a database, and a cache. Everything runs locally. The developer pushes to staging. Something breaks that worked perfectly on their machine.

This is not the famous "works on my machine" problem. This is the gap between what Docker Compose provides and what production actually requires.

## What the gap actually is

Local development environments are optimized for iteration speed. Production environments are optimized for reliability, security, and observability. These goals are not incompatible, but they require different configurations.

**Resource limits.** Local development runs without resource limits. Production runs with CPU and memory limits enforced by Kubernetes. A service that uses 3GB of RAM locally fails in production because the deployment spec allocates 512MB. The failure does not appear locally because there is no limit.

**Network policy.** Local services can reach each other freely by container name. Production services may be restricted by Kubernetes NetworkPolicies or cloud security groups. A service that makes an unexpected call to another service locally will find that call blocked in production.

**Secret management.** Local development often uses `.env` files with plaintext secrets. Production uses Vault, AWS Secrets Manager, or Kubernetes secrets. The path to the secret differs. The format may differ. Applications that retrieve secrets differently in development than in production have environmental dependencies that are invisible until deployment.

**Service discovery.** Local Compose uses simple DNS resolution between containers. Kubernetes uses its own DNS, service objects, and endpoint resolution. An application that assumes a specific hostname format may fail when the format changes.

**Volume and storage.** Local development uses host-mounted volumes for data persistence. Production uses persistent volume claims with specific storage classes. Performance and failure behaviour can differ with the driver, backend, network and deployment. Test the production storage contract explicitly; a local mount does not establish durability or availability for the production path.

## Closing the gap

**Use namespace-scoped Kubernetes locally.** Tools like minikube, kind, and k3s run a local Kubernetes cluster. A local deployment using the same manifests as production catches configuration gaps before they reach staging.

**Enforce resource limits in local development.** Adding CPU and memory limits to local Compose files or Kubernetes manifests makes resource constraint failures visible locally, where they are cheap to debug.

**Use the same secret retrieval path.** If production uses a secret service, test the same retrieval interface with isolated test credentials where practical, and document any local adapter.

The goal is not identical environments — that is impractical. The goal is environments that fail in the same ways. Finding a representative failure locally usually reduces investigation risk, although local environments still cost time and resources to maintain.

## Choose the failure you want to reproduce

A local environment is useful when it answers a bounded question. A VM can reproduce a Linux service manager, permissions, and a constrained memory budget. A local Kubernetes cluster can exercise manifests and some control-plane behaviour. Neither reproduces a cloud identity service, a multi-zone network, or a managed database merely because the application starts successfully.

Write the parity contract down. For one service, it might include the same application build, startup command, database major version, schema migration, and declared resource limit. List deliberate differences separately: one local node, synthetic data, test credentials, and a local queue. The list helps reviewers understand what a passing test establishes and what still requires a staging or production-safe test.

Consider a hypothetical worker that needs 350 MiB while idle and adds approximately 80 MiB for each concurrently decoded document. Two simultaneous documents imply about 510 MiB; four imply about 670 MiB. Under a 600 MiB process budget, four documents exceed the planning envelope. These numbers are assumptions for a test design, not measured Multipass performance. The exercise should verify actual peak resident memory, including library allocations and buffers, instead of trusting this linear model.

## A repeatable local rehearsal

Create a disposable VM from a versioned bootstrap description. Set a named CPU and memory allocation rather than inheriting the developer laptop's available capacity. Start the application as a non-root user using the same service command intended for deployment. Use a synthetic document with a known checksum, process it, and compare the expected output before introducing failure.

Next, run two and then four concurrent jobs. Record throughput, peak memory, queue wait, and the exit status when a process is terminated. Restart the worker and determine whether a partially completed job is duplicated, lost, or safely resumed. The valuable result is the recovery behaviour, not a screenshot showing four green containers.

Test the credential interface with a dedicated development account or an explicit test adapter. Production secrets do not belong in the VM image or bootstrap file. Access to a real secret store can be valuable in an isolated test account, but local tests should not depend on permission to read production data.

Destroy and recreate the VM when the exercise is complete, then rerun the bootstrap without manual repair. Any undocumented command needed to make the second run work becomes part of the setup defect list. Keep cloud-specific identity, load-balancer behaviour, and storage durability in a separate validation plan. Local parity reduces uncertainty; it does not eliminate it.

## Further reading and source boundaries

- [Canonical Multipass documentation](https://canonical.com/multipass/docs/latest/)
- [PostgreSQL: Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)
