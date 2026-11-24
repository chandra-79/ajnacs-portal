---
title: "Post-Quantum Cryptography Migration: What Enterprises Should Be Doing Now"
description: "Harvest-now-decrypt-later creates a planning risk, core NIST standards are published, and migration requirements depend on system and jurisdiction. A practical enterprise roadmap for post-quantum migration — inventory, crypto-agility, hybrid TLS, and the sequencing that separates prepared from panicked."
date: 2027-05-10
tags: ["Quantum Computing", "Security", "Cryptography", "Architecture", "Compliance"]
format: article
---

Post-quantum cryptography is the rare technology risk with an unusual property: you can be harmed *today* by a machine that doesn't exist yet. An adversary may record traffic protected by quantum-vulnerable public-key mechanisms and attempt to recover its secrets if a sufficiently capable quantum computer becomes available — "harvest now, decrypt later." For data whose confidentiality must last decades (health records, national-security-adjacent IP, financial and legal archives), the exposure clock started years ago.

The good news: this is now a *migration problem*, not a research problem. Core standards are published, while protocol integration and organizational transition plans still require engineering. Here's the enterprise version.

## The threat, without the hype

A sufficiently large fault-tolerant quantum computer running Shor's algorithm breaks widely used public-key schemes: RSA, Diffie-Hellman, and elliptic-curve schemes — which means TLS key exchange, code signing, document signing, PKI, VPNs, and blockchain signatures. Symmetric encryption and hashing face different quantum considerations from factoring and discrete-log schemes. Grover's algorithm provides a quadratic query-speedup model for unstructured search; practical security depends on parameters and attack costs. Review the relevant standards rather than treating all cryptography as equally affected.

No reliable arrival date can be assigned to a cryptanalytically relevant quantum computer. But the decision math doesn't need the date. **Mosca's inequality:** if (years your data must stay secret) + (years your migration takes) exceeds (years until a quantum machine), you're already late. Large migrations can take years because of embedded systems, vendor dependencies and interoperability testing. Add a 25-year secrecy requirement, and the arithmetic says start now regardless of your quantum-timeline opinions.

NIST publishes transition guidance and US federal systems have specific migration requirements. Determine the applicable publication, contract and system category before assigning a deadline; a general roadmap is not a universal private-sector mandate.

## Core standards and integration work

NIST finalized the core suite in 2024, with additions since. **ML-KEM** (Kyber — FIPS 203) is the workhorse for key exchange, replacing what RSA/ECDH do in TLS. **ML-DSA** (Dilithium — FIPS 204) is the general-purpose signature. **SLH-DSA** (SPHINCS+ — FIPS 205) is the conservative, hash-based signature backstop — slower and bigger, but resting on minimal assumptions. **HQC** was selected in 2025 as a backup KEM on different mathematical foundations, insurance against a lattice cryptanalysis surprise; Falcon and HQC were selected for additional standardization; check their current publication status before procurement.

Two practical characteristics shape deployments. First, **sizes**: PQC keys and signatures are bigger — kilobytes where ECC used dozens of bytes — which stresses certificate chains, constrained devices, UDP-based protocols, and anything with hardcoded buffer assumptions. Second, **hybrid mode**: current practice pairs a classical and post-quantum algorithm together (X25519+ML-KEM in TLS), with security properties determined by the specified hybrid construction and implementation. Hybrid key exchange is already live at scale — major browsers, CDNs, and cloud providers ship it by default — which means your public TLS edges may be partially migrated already without you deciding anything. The signature/PKI side (certificates signed with PQC algorithms) is the slower half: standards bodies and CAs are mid-transition, and this is where enterprise timelines are actually set.

## The playbook: inventory, agility, sequence

**Step 1 — Cryptographic inventory (the real work).** You cannot migrate what you can't find, and many inventories need reconciliation across applications and infrastructure. Build a **cryptographic bill of materials**: every TLS endpoint and its negotiated suites, every certificate and CA chain, code-signing infrastructure, VPN/SSH configurations, encrypted-at-rest schemes and their key wrapping, HSMs and their firmware capabilities, and — the long tail that dominates the timeline — cryptography *embedded* in vendor products, appliances, mainframe subsystems, and IoT/OT devices with 15-year lifecycles. Discovery tooling (network scanning for TLS parameters, code scanning for crypto API calls, CBOM generators) has matured into a real product category; use it, but budget separately for vendor evidence and dependencies that automated discovery cannot inspect. Prioritize by data lifetime: long confidentiality requirements and long replacement lead times increase priority.

**Step 2 — Crypto-agility as the architectural deliverable.** The systems that migrate cheaply are the ones where algorithm choice is *configuration*, not code. Centralize TLS termination and policy (service mesh, load balancers, API gateways — a few control points instead of ten thousand services); route key management through a KMS/HSM layer you can upgrade; ban hardcoded algorithm identifiers, key sizes, and buffer lengths in code review; and make "swap the algorithm" a tested operation, not a theory. Crypto-agility is the lasting asset here — future algorithm transitions should have known owners, testable interfaces and recovery procedures rather than depend on an unsupported calendar estimate.

**Step 3 — Sequence the actual migration.** One possible sequence, subject to dependency and risk review, is **(1) external TLS** — evaluate supported hybrid key exchange at edges and load balancers. Client, server, protocol, appliance and termination-path compatibility must be tested; this is not necessarily a software-only change. **(2) Internal transport** — mesh mTLS, VPNs, SSH — as vendor support lands. **(3) Long-lived signatures** — code signing, firmware signing, document sealing — where a signature made today must verify in 2040; this is also where SLH-DSA's conservatism earns its cost. **(4) PKI rotation** — new roots and intermediates with PQC or composite certificates as CA ecosystems finalize; plan for fatter chains and test the middleboxes that choke on them. **(5) Data at rest** — identify vulnerable public-key protection of stored keys and use an approved, interoperable key-establishment and key-wrapping design where migration is needed. A KEM establishes shared secret material; it is not itself a direct replacement for bulk encryption or a key-wrapping protocol. Select hybrid modes where the supported protocol, threat model and applicable policy justify them, and let the CBOM drive vendor procurement language — relevant procurement should specify the required cryptographic function, applicable standards, supported integrations and evidence-backed delivery dates.

## What to tell the executive committee

An illustrative planning statement, to adapt only after the organization approves its own scope and dates: *Some widely used public-key algorithms require migration, and long-lived confidential data creates a reason to plan before a cryptographically relevant quantum computer exists.* *Core replacement standards exist; implementation support and protocol compatibility must be verified for our actual dependencies.* *We are funding a cryptographic inventory this quarter, hybrid TLS at our edges this year, and a multi-year migration sequenced by data lifetime — with timing justified by our applicable requirements, dependency evidence and confidentiality needs.*

The organizations that will find PQC painful are not the ones facing hard cryptographic problems — standards provide a foundation, while secure implementation and integration still require specialist review. They're the ones that never knew where their cryptography was, and are discovering that the inventory *is* the migration. Start with the map; the rest is a schedule.

## Separate the algorithm from the deployed protocol

An algorithm standard specifies a cryptographic building block. A usable enterprise migration also requires protocol integration, interoperable implementations, key lifecycle procedures, operational monitoring and support from the systems that consume the result. ML-KEM establishes shared secret material; it is not a drop-in bulk encryption function or a complete replacement for every use of RSA. ML-DSA supplies signatures and addresses a different function.

This distinction matters when reviewing vendor claims. A library may implement an algorithm while the appliance's production TLS path cannot negotiate it. A product may support a hybrid exchange but still use classical signatures for authentication. A successful handshake is evidence about the negotiated connection, not proof that the entire application and its stored archives are quantum-resistant.

Record the exact function being migrated: key establishment, digital signature, key wrapping, certificate validation or symmetric data encryption. Then record the protocol, library, parameter set and supported peer combinations. Avoid a single checkbox called "PQC supported" because it collapses several independent requirements into an answer that procurement cannot test.

## Worked example: turn discovery into an actionable queue

Imagine an invented inventory of 80 cryptographic dependencies. Thirty are fully mapped with named owners, twenty have owners but lack protocol details, eighteen depend on vendor roadmaps and twelve have no confirmed owner. The chart shows these four exclusive categories, which sum to 80. Only 30/80, or 37.5%, are currently ready for a detailed migration decision; this does not mean those thirty are already migrated.

If the next discovery sprint resolves twelve incomplete records and assigns owners to eight unknown records, the fully mapped count can rise to 42 only if those twelve records actually meet the full evidence requirement. Assigning an owner to eight records improves accountability but does not by itself complete their technical inventory. Keeping these transitions separate prevents progress reports from confusing administrative activity with verified readiness.

Now suppose twelve of the eighty dependencies protect information requiring fifteen years of confidentiality and have an estimated four-year migration path. The planning horizon is nineteen years from the point of assessment. That arithmetic motivates early prioritization without predicting when a cryptanalytically relevant quantum computer will exist. It is a sensitivity calculation about secrecy and lead time, not a forecast of a breach date.

This example intentionally uses dependencies rather than applications. One application can depend on browser TLS, service-to-service authentication, a signing service and a backup key-wrapping system. Counting applications alone can hide a critical unmigrated dependency. Publish the unit of inventory and keep parent-child relationships so completion means something concrete.

## Build the inventory without collecting secrets

A cryptographic inventory should contain identifiers and metadata, not private key material. Record key purpose, owner, algorithm, creation and expiry dates, storage location and validation requirements. Restrict access where topology or vendor details are sensitive. Discovery tools need an agreed scope because active scanning can disrupt fragile devices or misinterpret endpoints behind proxies.

Combine network observation, source analysis, configuration review and vendor evidence. Network scans reveal negotiated behavior on visible paths; they do not discover every offline signing process or embedded library. Source scanning finds potential cryptographic usage but can include dead code. Reconcile findings with service owners and retain the evidence that explains each inventory entry.

The inventory must be refreshed when a service changes. A one-time spreadsheet can become stale as new libraries, certificates and integrations appear. Add cryptographic metadata to existing asset and dependency processes where practical. The objective is a maintained map that supports multiple algorithm transitions, not a parallel catalog nobody owns after the first audit.

## Test compatibility and fallback deliberately

A lab should include representative clients, load balancers, inspection devices, certificate paths and network conditions. Larger handshake messages can interact with fragmentation, constrained buffers or middleboxes. Measure completion rate and latency under the actual deployment path rather than assuming a successful direct connection represents the full estate.

Fallback deserves explicit policy. A connection that silently negotiates a classical-only mode may preserve availability while defeating the intended migration objective. Conversely, disabling fallback before every critical peer is compatible can cause an outage. Decide which populations require the new mode, which temporary exceptions are allowed, and how telemetry distinguishes the two.

A hybrid construction needs a reviewed protocol and implementation. Combining two cryptographic outputs ad hoc is not a safe way to obtain the security properties of both. Use standardized or appropriately reviewed mechanisms, with compatibility and validation status checked for the deployment's requirements. Keep the classical and post-quantum components visible in the connection record where tooling supports it.

## A practical migration worksheet

Choose one non-production service carrying synthetic data. Fill in its data lifetime, authentication method, key-establishment method, library version, client populations, owner and rollback plan. Identify which changes are configuration-only and which require a product upgrade or replacement. Document a baseline handshake success rate before changing anything.

Run the candidate configuration against a fixed client matrix. For each pair, record negotiated mode, handshake bytes, success or failure, latency distribution and error category. Include an older client that is expected to fail or use a controlled fallback, so the exception handling is exercised rather than assumed. Repeat through the same proxy and inspection path used in the intended environment.

Then rehearse rollback. Confirm that a failed upgrade can be reversed without restoring obsolete credentials or violating the approved minimum policy. For signing systems, test verification of historical artifacts as well as new signatures. Long-lived validation can depend on timestamps, certificate history and archival evidence, so changing the signing algorithm alone does not solve the entire retention problem.

The worksheet's final decision should be specific: proceed for the tested client cohort, hold pending a vendor release, or replace a dependency that cannot support the required lifecycle. Include evidence and an owner for each exception. A calendar deadline without an executable dependency plan does not reduce migration risk.

## Keep the program honest over time

Standards and implementation guidance continue to evolve. Review current NIST publications, protocol specifications and relevant sector requirements at each significant migration decision. A general transition roadmap does not automatically establish a legal deadline for every private organization or every algorithm. Contractual and regulatory applicability needs its own review.

Report separately on discovery completeness, tested compatibility, deployed coverage and retired vulnerable paths. These measures answer different questions. A system can have a complete inventory but no migrated traffic; another can negotiate a new key exchange while its software-signing chain remains unchanged. The board-level summary should preserve those distinctions without drowning readers in algorithm names.

The durable outcome is an organization that knows where cryptography operates and can change it through tested procedures. That capability remains valuable even if hardware timelines shift or a preferred algorithm needs replacement. It is a practical engineering investment whose progress can be verified today.

## Sources and further study

- [NIST FIPS 203 — ML-KEM](https://csrc.nist.gov/pubs/fips/203/final)
- [NIST FIPS 204 — ML-DSA](https://csrc.nist.gov/pubs/fips/204/final)
- [NIST — Post-quantum cryptography standards and transition](https://csrc.nist.gov/projects/post-quantum-cryptography)
- [NIST NCCoE — Migration discovery and inventory](https://pages.nist.gov/nccoe-migration-post-quantum-cryptography/)
