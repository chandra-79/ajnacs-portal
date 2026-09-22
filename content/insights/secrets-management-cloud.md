---
title: "Secrets Management in Cloud Environments: Beyond Environment Variables"
description: "Environment variables are not a secrets management solution. Here's how to handle credentials, API keys, and certificates properly across cloud environments — and the specific failure modes to design around."
date: 2025-05-19
tags: ["DevSecOps", "Security", "Cloud Architecture"]
series: "DevSecOps Pipeline"
seriesOrder: 2
format: article
---

The most common secrets management approach in production is environment variables set at deployment time, pulled from a CI/CD platform's secret store. This works. It's also fragile in specific ways that become clear at exactly the wrong moments.

The variables are in process memory and readable by anything running in the same process. They appear in debug logs when frameworks dump environment state. They're often hard to rotate without a redeployment. And in containerised environments, they're visible in the container spec to anyone with describe/get permissions on the workload.

Dedicated secrets management solves these problems. The path from "we use environment variables" to a proper secrets management posture is well-understood, and the tooling is mature.

## The options and what they're actually for

**AWS Secrets Manager**: stores secrets as versioned, encrypted JSON documents. Supports automatic rotation for RDS, Redshift, and custom Lambda rotation functions. The rotation is the strongest feature — for database credentials, you can configure automatic rotation on a schedule and have the secret updated without any application deployment. Applications retrieve secrets via SDK call, not environment variable.

**Azure Key Vault**: stores secrets, certificates, and cryptographic keys. The distinction between these types matters: Key Vault isn't just a secret store, it's a certificate lifecycle manager and a key management service. Managed Identities eliminate the bootstrap problem (how do you store the secret that unlocks your secret store?) — an Azure VM or App Service has an identity that can be granted Key Vault access without any credentials needed.

**HashiCorp Vault**: the most complete secrets management solution, and the most operationally complex. Supports dynamic secrets (credentials that are generated on-demand and expire automatically), multiple authentication methods, detailed audit logging, and secrets engines for databases, AWS/Azure/GCP, SSH, PKI, and more. The dynamic secrets feature significantly changes database credential management — instead of rotating a shared password, each application instance gets a unique credential with a TTL.

**GCP Secret Manager**: similar to AWS Secrets Manager, well-integrated with GCP's IAM. Supports versioning and automatic replication.

**Kubernetes Secrets**: not a secrets management solution. Kubernetes Secrets are base64-encoded, not encrypted by default, and accessible to anything with the right RBAC permissions on the namespace. At minimum, encrypt etcd at rest and integrate with an external secrets operator (External Secrets Operator, Sealed Secrets, or CSI Secrets Store Driver) that pulls from a real secrets manager.

## The bootstrap problem

Every secrets management solution has a bootstrap problem: something needs credentials to access the secrets manager before it can retrieve the application secrets. How you solve this determines how good your security posture actually is.

The patterns that work:
- **Cloud-native identity**: AWS IAM roles for EC2/ECS/Lambda, Azure Managed Identities, GCP service accounts attached to resources. The platform proves the identity; no credentials needed to access the secrets manager.
- **Vault AppRole**: Vault's AppRole authentication stores a RoleID (not secret) in the application config and a SecretID (which is secret and short-lived) injected at deploy time. The RoleID alone can't authenticate; both pieces are needed.
- **Kubernetes workload identity**: Kubernetes service accounts mapped to cloud IAM identities via OIDC, eliminating the need for any stored credentials.

The patterns that don't work:
- Storing the secrets manager access key in another environment variable
- A shared service account credential used by all services (no per-service audit trail)
- Checking credentials into version control "just for development"

## Rotation without downtime

Credential rotation is where most secrets management implementations break down. The correct design:

- Application retrieves secrets from the secrets manager at startup, not at build time
- Application supports refreshing the credential without restart (or has a fast restart path)
- Rotation produces a new version of the secret and keeps the old version valid for a short overlap window
- After the overlap window, the old version is deactivated

The dual-credential rotation pattern for database credentials: rotate the secondary credential, update the application to use the new secondary, wait for connection drain, promote secondary to primary, rotate old primary. No downtime, no connection failures.

Applications that cache credentials indefinitely, or that bake them in at build time, cannot rotate without a redeployment. If rotation requires a redeployment, it won't happen on the schedule it should.

## A practical posture for most teams

For a cloud-native deployment:
1. AWS Secrets Manager or Azure Key Vault for application secrets
2. Cloud-native identity for access (no stored credentials)
3. External Secrets Operator if on Kubernetes, pulling into Kubernetes Secrets at runtime
4. Automatic rotation configured for database credentials
5. Audit logging enabled on the secrets manager (who accessed what, when)
6. CI/CD secrets for pipeline steps stored in the CI platform's native secret store, not in the repository

The CI/CD secrets in the repository — even in GitHub Actions encrypted secrets — are the last category that most teams never graduate from. They work, but they're a different trust boundary than your production secrets manager. Treat them as a separate category with their own review cycle.

*Migrating from environment variables to a proper secrets management setup? The migration is usually simpler than teams expect — [happy to talk through the approach.](/contact)*
