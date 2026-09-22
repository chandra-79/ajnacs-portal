---
title: "The Quantum Computing Race: What's Actually Happening in 2025"
description: "From Google Sycamore's first supremacy claim in 2019 to Microsoft's Majorana-1 topological chip in 2025 — a plain-language guide to what each milestone actually means and where the field is heading."
date: 2026-07-03
tags: ["Quantum Computing", "Enterprise AI", "Emerging Technology"]
format: article
---

Quantum computing gets announced every few months as "a breakthrough" — and each announcement gets treated like the one that finally makes it real. The reality is more nuanced and, frankly, more interesting.

Here's what's actually happened in the past six years and what to make of it.

![Quantum computing chips timeline](/images/qc-race.png)

---

## The milestones, in plain language

### Google Sycamore — October 2019

![Google Sycamore chip](/images/google-sycamore.jpg)

The chip that started the modern conversation. Google claimed Sycamore completed a specific computation in 200 seconds that would take a classical supercomputer 10,000 years.

IBM disputed the claim (they argued a classical system could do it in 2.5 days with different optimization). Both sides were right in their own framing — which tells you something important: **quantum supremacy claims are task-specific**. Sycamore wasn't universally faster than classical systems. It was faster at one very specific, carefully chosen problem.

What it actually proved: you can build a 53-qubit system where quantum effects are stable enough to compute something, and the results hold up under measurement.

---

### D-Wave Advantage2 — June 2022

![D-Wave Advantage2](/images/dwave-advantage2.jpg)

D-Wave takes a different approach: quantum annealing rather than gate-based quantum computing. The Advantage2 has over 7,000 qubits — far more than any gate-based system — but they're a different type of qubit, optimized for optimization problems (scheduling, logistics, molecular simulation) rather than general computation.

The nuance most coverage misses: **more qubits doesn't automatically mean more powerful**. D-Wave's annealing qubits and IBM's transmon qubits are solving fundamentally different classes of problems.

D-Wave's approach is actually closer to commercial application for specific domains than the headline qubit counts suggest.

---

### IBM Heron — December 2023

![IBM Heron chip](/images/ibm-heron.jpg)

IBM's Heron processor (133 qubits) was notable less for qubit count and more for architecture improvements — specifically, reduced cross-talk between qubits and improved gate fidelity. In quantum computing, **error rates matter more than qubit counts**.

A 100-qubit system with 99.9% gate fidelity is vastly more useful than a 1000-qubit system with 99% gate fidelity. IBM's sustained focus on error reduction is one of the reasons they remain relevant despite not having the splashiest announcements.

---

### Google Willow — December 2024

![Google Willow chip](/images/google-willow.png)

This one was genuinely significant. Google's Willow chip demonstrated something the field has been working toward for years: **below-threshold error correction**. As they added more qubits to form larger logical qubits, the error rate went *down* — not up.

Previous systems saw errors compound as you scaled up. Willow showed that with the right physical qubit count per logical qubit, quantum error correction actually works as theorised. This is a prerequisite for fault-tolerant quantum computing.

Willow also ran a benchmark that Google claimed would take a classical supercomputer 10 septillion years. The usual caveats about benchmark selectivity apply — but the error correction result is the more meaningful milestone.

---

### Amazon Ocelot — February 2025

![Amazon Ocelot chip](/images/amazon-ocelot.jpg)

Amazon's Ocelot takes a different physical approach: **cat qubits**. The name comes from Schrödinger's cat — these qubits are designed to suppress one type of error (bit flips) naturally, which means error correction resources can focus on the remaining error type (phase flips).

The claim: 90% reduction in resources needed for error correction compared to conventional approaches. AWS's bet is that the overhead of quantum error correction is one of the biggest practical barriers to useful quantum computing, and cat qubits reduce it fundamentally.

---

### PsiQuantum Omega — February 2025

![PsiQuantum Omega](/images/psiquantum-omega.png)

PsiQuantum's approach is photonic — using photons rather than superconducting circuits or trapped ions as the physical qubit substrate. The advantage: photons don't require the extreme cooling (near absolute zero) that most other approaches need.

Omega is a manufacturing milestone as much as a science one — PsiQuantum is fabricating chips using standard semiconductor foundry processes, which has significant implications for scale. The constraint has historically been that quantum chips needed custom fabrication. If you can use existing chip fabs, the path to large-scale production changes.

---

### Microsoft Majorana-1 — February 2025

![Microsoft Majorana-1](/images/ms-majorana-1.jpg)

The most talked-about of the 2025 announcements, and the most technically distinctive. Majorana-1 uses **topological qubits** — a fundamentally different physical implementation based on Majorana fermions (a type of particle that is its own antiparticle).

The theoretical advantage: topological qubits are inherently more stable because quantum information is encoded in the topology of the system rather than in a specific physical state. Errors that would flip a conventional qubit don't necessarily affect a topological qubit.

Microsoft has been working on this approach for over a decade. The February 2025 announcement was that they'd demonstrated the underlying physics works — the chip can create and measure Majorana zero modes reliably. Commercial-grade topological qubits still require more development, but the physics no longer blocks the path.

---

## What this means for enterprise technology leaders

A few things worth keeping in mind as you follow this space:

**Timeline reality check.** Cryptographically relevant quantum computers — the kind that could break RSA encryption — are still estimated 10-15 years away by most credible researchers. "Q-Day" is a planning horizon, not an imminent event.

**Post-quantum cryptography matters now.** NIST finalised its post-quantum cryptography standards in 2024. Start evaluating your cryptographic infrastructure. The migration timeline for large enterprises is long enough that planning needs to start before the threat is imminent.

**Near-term quantum advantage.** The more realistic near-term applications are in molecular simulation (drug discovery, materials science), optimization (logistics, portfolio management), and certain machine learning kernels. These don't require fault-tolerant quantum computers — just quantum systems that outperform classical approaches on specific problems.

**Cloud access is already here.** IBM Quantum Network, AWS Braket, Azure Quantum, and Google's Quantum AI programme all offer cloud access to real quantum hardware. If you're curious about where quantum might apply to your domain, experimental access exists today.

---

The quantum computing race is genuinely interesting — not because it's about to change everything next year, but because multiple fundamentally different physical approaches are converging on the same goal from completely different directions. That's unusual in technology, and it means we don't yet know which approach will dominate. That uncertainty is part of what makes it worth watching.

*Following quantum computing developments for your organization? [Start a conversation.](/about)*
