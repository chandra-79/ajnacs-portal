---
title: "Read quantum milestones carefully; inventory cryptography now"
description: "Distinguish experimental quantum milestones from the practical work of documenting cryptographic dependencies."
date: 2026-11-27
tags: ["Quantum Computing", "Emerging Technology"]
format: note
derived: true
---

Quantum-computing announcements describe different things: a physical device, a component result, a logical-qubit experiment, an error-correction method, or a projected architecture. Those are not interchangeable milestones. An enterprise decision should identify what was demonstrated, under which conditions, and how far the result is from the intended workload.

## Separate two planning questions

The first question is whether a quantum approach could improve a specific computation. Compare it with the best practical classical method and include data preparation, error correction, repeated measurements, and result verification. A hardware announcement alone does not answer that question.

The second question is how the organization will migrate cryptography that may be vulnerable to a sufficiently capable future quantum computer. This work can proceed without choosing a quantum-computing vendor. NIST published ML-KEM for key establishment and ML-DSA for digital signatures in 2024. Their functions are different; neither is a drop-in label for every use of encryption.

## Start with an inventory exercise

A fictional inventory contains 30 applications: 12 have documented cryptographic dependencies, 10 require vendor clarification, and eight have no identified owner. The chart shows those counts. It measures inventory completeness, not quantum readiness or security strength.

For each application, record the protocol, library, certificate dependencies, data confidentiality lifetime, and upgrade owner. Identify external dependencies and test whether components can change algorithms without replacing the entire service. Review the standards' current errata and implementation guidance before selecting a migration path. A useful first deliverable is a verified dependency map and a compatibility test plan, not a prediction of the year a particular quantum machine will arrive.

## Sources and further study

- [NIST FIPS 203 — ML-KEM](https://csrc.nist.gov/pubs/fips/203/final)
- [NIST FIPS 204 — ML-DSA](https://csrc.nist.gov/pubs/fips/204/final)
