---
title: "Post-Quantum Cryptography Migration: What Enterprises Should Be Doing Now"
description: "Harvest-now-decrypt-later is already happening, the NIST standards are final, and the deadlines are set. A practical enterprise roadmap for post-quantum migration — inventory, crypto-agility, hybrid TLS, and the sequencing that separates prepared from panicked."
date: 2027-05-10
tags: ["Quantum Computing", "Security", "Cryptography", "Architecture", "Compliance"]
format: article
---

Post-quantum cryptography is the rare technology risk with an unusual property: you can be harmed *today* by a machine that doesn't exist yet. An adversary recording your encrypted traffic now can decrypt it the day a cryptographically relevant quantum computer arrives — "harvest now, decrypt later." For data whose confidentiality must last decades (health records, national-security-adjacent IP, financial and legal archives), the exposure clock started years ago.

The good news: this is now a *migration problem*, not a research problem. The standards are final, the deadlines are published, and the playbook is knowable. Here's the enterprise version.

## The threat, without the hype

A sufficiently large fault-tolerant quantum computer running Shor's algorithm breaks the public-key cryptography underneath essentially everything: RSA, Diffie-Hellman, and elliptic-curve schemes — which means TLS key exchange, code signing, document signing, PKI, VPNs, and blockchain signatures. Symmetric cryptography (AES) and hashing survive with margin to spare (Grover's algorithm halves effective key strength at best — AES-256 remains comfortable).

Nobody can responsibly tell you the year such a machine arrives; estimates cluster in the 2030s with wide error bars. But the decision math doesn't need the date. **Mosca's inequality:** if (years your data must stay secret) + (years your migration takes) exceeds (years until a quantum machine), you're already late. Enterprise crypto migrations historically take 5–10 years — SHA-1's deprecation took most of a decade *after* it was broken in practice. Add a 25-year secrecy requirement, and the arithmetic says start now regardless of your quantum-timeline opinions.

Regulators did that math too: NIST has formalized the sunset of classical public-key algorithms — deprecation targeted around **2030** and disallowance by **2035** — and US federal directives (NSA's CNSA 2.0, OMB mandates) put national-security systems on even earlier clocks. If you sell to governments, those dates are contract terms, not suggestions.

## The standards are done: what you're migrating to

NIST finalized the core suite in 2024, with additions since. **ML-KEM** (Kyber — FIPS 203) is the workhorse for key exchange, replacing what RSA/ECDH do in TLS. **ML-DSA** (Dilithium — FIPS 204) is the general-purpose signature. **SLH-DSA** (SPHINCS+ — FIPS 205) is the conservative, hash-based signature backstop — slower and bigger, but resting on minimal assumptions. **HQC** was selected in 2025 as a backup KEM on different mathematical foundations, insurance against a lattice cryptanalysis surprise; **FN-DSA (Falcon)** rounds out signatures for size-sensitive niches.

Two practical characteristics shape deployments. First, **sizes**: PQC keys and signatures are bigger — kilobytes where ECC used dozens of bytes — which stresses certificate chains, constrained devices, UDP-based protocols, and anything with hardcoded buffer assumptions. Second, **hybrid mode**: current practice pairs a classical and post-quantum algorithm together (X25519+ML-KEM in TLS), so security holds if *either* survives. Hybrid key exchange is already live at scale — major browsers, CDNs, and cloud providers ship it by default — which means your public TLS edges may be partially migrated already without you deciding anything. The signature/PKI side (certificates signed with PQC algorithms) is the slower half: standards bodies and CAs are mid-transition, and this is where enterprise timelines are actually set.

## The playbook: inventory, agility, sequence

**Step 1 — Cryptographic inventory (the real work).** You cannot migrate what you can't find, and no enterprise knows where its cryptography is. Build a **cryptographic bill of materials**: every TLS endpoint and its negotiated suites, every certificate and CA chain, code-signing infrastructure, VPN/SSH configurations, encrypted-at-rest schemes and their key wrapping, HSMs and their firmware capabilities, and — the long tail that dominates the timeline — cryptography *embedded* in vendor products, appliances, mainframe subsystems, and IoT/OT devices with 15-year lifecycles. Discovery tooling (network scanning for TLS parameters, code scanning for crypto API calls, CBOM generators) has matured into a real product category; use it, but expect the vendor-questionnaire grind to be half the effort. Prioritize by data lifetime: anything protecting secrets that must hold past ~2033 goes to the top.

**Step 2 — Crypto-agility as the architectural deliverable.** The systems that migrate cheaply are the ones where algorithm choice is *configuration*, not code. Centralize TLS termination and policy (service mesh, load balancers, API gateways — a few control points instead of ten thousand services); route key management through a KMS/HSM layer you can upgrade; ban hardcoded algorithm identifiers, key sizes, and buffer lengths in code review; and make "swap the algorithm" a tested operation, not a theory. Crypto-agility is the lasting asset here — the *next* algorithm transition (there will be one) should cost a quarter, not a decade.

**Step 3 — Sequence the actual migration.** The order that works: **(1) external TLS first** — enable hybrid key exchange at edges and load balancers; it's software-only, browser-supported, and immediately closes the harvest-now window for data in transit. **(2) Internal transport** — mesh mTLS, VPNs, SSH — as vendor support lands. **(3) Long-lived signatures** — code signing, firmware signing, document sealing — where a signature made today must verify in 2040; this is also where SLH-DSA's conservatism earns its cost. **(4) PKI rotation** — new roots and intermediates with PQC or composite certificates as CA ecosystems finalize; plan for fatter chains and test the middleboxes that choke on them. **(5) Data at rest** — re-wrap keys under PQC KEMs where the wrapping crosses untrusted boundaries; symmetric bulk encryption itself mostly stays put. Throughout: prefer hybrid modes, and let the CBOM drive vendor procurement language — "FIPS 203/204 support with dates" belongs in every RFP starting immediately.

## What to tell the executive committee

Three sentences that fit on a slide. *The cryptography protecting all long-lived secrets has a published end-of-life (2030–2035), and adversaries can bank our traffic today against that date.* *The replacement standards are final, supported by our major vendors, and already deployed by browsers and clouds — this is execution, not research.* *We are funding a cryptographic inventory this quarter, hybrid TLS at our edges this year, and a multi-year migration sequenced by data lifetime — the same program our regulators and largest customers are beginning to ask about in audits.*

The organizations that will find PQC painful are not the ones facing hard cryptographic problems — the cryptographers solved those. They're the ones that never knew where their cryptography was, and are discovering that the inventory *is* the migration. Start with the map; the rest is a schedule.
