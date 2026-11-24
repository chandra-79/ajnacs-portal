---
title: "Secrets Management in Cloud Environments: Beyond Environment Variables"
description: "Environment variables are not a secrets management solution. Here's how to handle credentials, API keys, and certificates properly across cloud environments — and the specific failure modes to design around."
date: 2027-08-06
tags: ["DevSecOps", "Security", "Cloud Architecture"]
series: "DevSecOps Pipeline"
seriesOrder: 2
format: article
---

The most common secrets management approach in production is environment variables set at deployment time, pulled from a CI/CD platform's secret store. This works. It's also fragile in specific ways that become clear at exactly the wrong moments.

The variables are in process memory and readable by anything running in the same process. They can appear in debug logs if application or framework diagnostics expose environment state. They're often hard to rotate without a redeployment. In Kubernetes, literal environment values appear in the workload specification. A Secret reference exposes the Secret name and key rather than the secret value in that specification; permission to read the Secret, execute within the container or inspect the process is a separate concern.

Dedicated secrets management improves access, audit and rotation controls, while applications must still protect retrieved values and handle refresh safely. The path from "we use environment variables" to a proper secrets management posture is well-understood, and the tooling is mature.

## The options and what they're actually for

**AWS Secrets Manager**: stores versioned encrypted secret values, which may be strings or binary data; some integration conventions use JSON. Supported rotation paths update both the stored credential and its target service. Applications can retrieve values through an SDK or an integration, but must refresh their consumed value safely; automatic rotation alone does not guarantee deployment-free recovery.

**Azure Key Vault**: stores secrets, certificates, and cryptographic keys. The distinction between these types matters: Key Vault isn't just a secret store, it's a certificate lifecycle manager and a key management service. Managed Identities eliminate the bootstrap problem (how do you store the secret that unlocks your secret store?) — an Azure VM or App Service has an identity that can be granted Key Vault access without any credentials needed.

**HashiCorp Vault**: a secrets-management platform with a broad feature set and its own operating responsibilities. Supports dynamic secrets (credentials that are generated on-demand and expire automatically), multiple authentication methods, detailed audit logging, and secrets engines for databases, AWS/Azure/GCP, SSH, PKI, and more. The dynamic secrets feature significantly changes database credential management — instead of rotating a shared password, each application instance gets a unique credential with a TTL.

**GCP Secret Manager**: similar to AWS Secrets Manager, well-integrated with GCP's IAM. Supports versioning and automatic replication.

**Kubernetes Secrets**: an API mechanism for sensitive configuration. Base64 representation is not encryption; at-rest protection depends on cluster configuration and provider behavior. Effective access includes RBAC and rights to create or execute workloads that consume the values. At minimum, encrypt etcd at rest and integrate with an external secrets operator (External Secrets Operator or a suitable CSI integration) where appropriate. Sealed Secrets instead provides an encrypted configuration workflow and is not the same external-fetch mechanism.

## The bootstrap problem

Every secrets management solution has a bootstrap problem: something needs credentials to access the secrets manager before it can retrieve the application secrets. How you solve this determines how good your security posture actually is.

The patterns that work:
- **Cloud-native identity**: AWS IAM roles for EC2/ECS/Lambda, Azure Managed Identities, GCP service accounts attached to resources. The platform proves the identity; no separately stored long-lived application credential is required for that supported identity path; short-lived tokens and access policies still apply.
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

The dual-credential rotation pattern for database credentials: rotate the secondary credential, update the application to use the new secondary, wait for connection drain, promote secondary to primary, rotate old primary. This can reduce disruption when the target and consumers support the sequence, but the actual failover and refresh behavior must be tested.

Applications that cache credentials indefinitely, or that bake them in at build time, cannot rotate without a redeployment. If rotation requires a redeployment, it won't happen on the schedule it should.

## A practical posture for most teams

For a cloud-native deployment:
1. AWS Secrets Manager or Azure Key Vault for application secrets
2. Cloud-native identity for access (no stored credentials)
3. External Secrets Operator if on Kubernetes, pulling into Kubernetes Secrets at runtime
4. Automatic rotation configured for database credentials
5. Audit logging enabled on the secrets manager (who accessed what, when)
6. CI/CD secrets for pipeline steps stored in the CI platform's native secret store, not in the repository

CI-platform encrypted secret storage is different from committing plaintext secrets to repository history. It remains a separate trust boundary with scoped access and lifecycle responsibilities. They work, but they're a different trust boundary than your production secrets manager. Treat them as a separate category with their own review cycle.

*Migrating from environment variables to a proper secrets management setup? The migration is usually simpler than teams expect — [happy to talk through the approach.](/contact)*

## Model the whole credential lifecycle

A secret store protects and distributes a value under an access policy. The consuming process still needs to keep that value out of logs, refresh it safely and stop using it when authorization ends. Moving a password from an environment variable to an SDK response does not remove the password from process memory or make a compromised application trustworthy.

Start with an inventory of credentials, their consumers and the authority that accepts them. For each, record the owner, purpose, scope, issuance path, expiry, rotation method, revocation method and recovery procedure. Prefer short-lived workload identity where the platform and target service support it, while recognizing that tokens and credentials still exist; the benefit is avoiding unmanaged long-lived secrets and reducing their lifetime and distribution.

Distinguish an application runtime identity from deployment identity. A CI job that can configure a service need not have permission to read every production secret. Similarly, a person who can view a deployment template should not automatically be able to retrieve runtime credentials. Review the effective permission paths, including debug access and execution inside containers.

## Calculate refresh coverage during rotation

Consider a hypothetical application with twenty instances. During a controlled rotation, fifteen refresh to the new credential within one minute, four refresh by five minutes and one remains on the old credential beyond the planned overlap. At five minutes, nineteen of twenty have refreshed, or 95%. That sounds high, but revoking the old credential may still disrupt the remaining instance. The chart uses mutually exclusive completion groups, not cumulative counts.

The right response depends on the credential's risk and the urgency of revocation. A planned maintenance rotation may permit a brief repair; an exposed credential may need immediate revocation even if it causes interruption. Define that decision in advance and retain evidence of which consumers still use the old version. These values are synthetic and not a claim that five minutes is an appropriate overlap for every system.

For a lab, use a disposable credential against a harmless test database or API. Rotate it, observe each consumer's refresh and verify successful new connections. Then revoke the old value and confirm that a deliberately stale test client fails as expected. Existing authenticated sessions may behave differently from new connections, so test the relevant session boundary too.

## Treat overlap and rollback as service-specific mechanisms

Some services support alternating users or overlapping keys; others expose a single active credential. Do not assume every store can keep two credentials valid merely by retaining two secret versions. Rotation must update both the stored value and the system that validates it. A successful secret-store write can coexist with a broken application if the target was not updated correctly.

The worksheet should record the rotation phases, validation checks, cache lifetime, connection-drain behavior and failure action. If a new value fails validation, determine whether the old value is still safe and valid before rolling back. During suspected compromise, restoring an old credential may restore the exposure as well as service.

Avoid unlimited retries when secret retrieval fails. Cache according to the risk and availability requirements, bound refresh attempts and surface stale-credential status. A secret manager can become a startup or refresh dependency; test what happens when it is unavailable and whether existing instances can continue within the permitted lifetime.

## Understand Kubernetes delivery paths

A Kubernetes Secret is an API object whose data is commonly represented using base64 encoding; encoding is not encryption. At-rest protection depends on the cluster configuration and managed-service behavior. RBAC, workload creation rights and execution access affect who can obtain values. A person able to create a pod that mounts a secret may gain access even without a direct read workflow.

An external synchronization operator can copy values from a secret manager into Kubernetes Secrets, while a CSI integration can expose them through a different delivery path. Sealed Secrets is an encrypted configuration workflow, not the same mechanism as an operator fetching from an external manager. Choose the path based on rotation, audit and access requirements instead of treating the tools as interchangeable.

Environment variables populated when a container starts generally do not become live-updated merely because the source Secret changes. Mounted values and application reload behavior have different semantics. Test the actual application path, including whether it rereads a file, refreshes an SDK cache or requires a controlled restart.

## Audit use without leaking the value

Record secret identifiers, versions where appropriate, caller identity and outcomes, but avoid logging the secret itself. Inspect debug output, exception handlers, crash dumps and support tooling. A secret store's access log establishes retrieval activity, not necessarily every use of a cached credential at the target service.

Rehearse emergency revocation and recovery with the current on-call team. Verify that authorized responders can identify consumers, issue replacement access and confirm denial of the old credential without sharing values in chat. Keep CI credentials under a separate reviewed trust boundary. Platform-managed encrypted secret storage is not equivalent to committing plaintext into source history, but it still needs scoped access and lifecycle controls.

The final result should be a tested lifecycle for each credential class, with explicit failure behavior and accountable owners. Automatic rotation is useful when the application and target participate correctly; the label alone does not establish rotation without downtime or complete protection from credential misuse.

| Observation | Value (instances) |
| --- | ---: |
| Within one minute | 15 |
| By five minutes | 4 |
| Still stale | 1 |

**Figure method.** Synthetic twenty-instance rotation: 15+4+1=20; refreshed by five minutes=19/20=95%. Groups are mutually exclusive. Overlap duration and revocation urgency are service-specific.

## Further reading

- [AWS secret rotation](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html)
- [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
- [OWASP session lifecycle](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
