---
title: "Quantum Computing Milestones, 2019–2025: What the Evidence Shows"
description: "Distinguish demonstrations in random circuit sampling, quantum error correction, annealing, and experimental qubit architectures."
date: 2027-07-21
tags: ["Quantum Computing", "Enterprise AI", "Emerging Technology"]
format: article
---

A 53-qubit sampling experiment, a quantum memory, and an annealer with thousands of qubits answer different questions. This retrospective covers published milestones through 2025. The useful comparison starts with the workload and the evidence each team reported.

## What to measure

For a quantum memory experiment, compare logical error per cycle at stated code distances, the physical-qubit overhead, and the number of cycles observed. For a workload benchmark, ask how the answer is validated, what classical baseline was used and what the timings include. Native gate fidelity, logical error per cycle and end-to-end time each measure a different thing.

**Illustrative measurement.** If two experiments under comparable conditions report 0.1% and 0.05% logical errors per cycle, the second rate is half the first. Check the uncertainty and compare multiple code distances before claiming below-threshold operation.

## What the milestones established

**Google Sycamore, 2019.** Google reported running a random circuit sampling experiment on a 53-qubit processor in about 200 seconds. Its paper compared that run with a pre-publication estimate for classical simulation. The result concerns the stated sampling task and the classical comparison depends on the algorithms and hardware used. A subsequent [classical simulation study](https://pubmed.ncbi.nlm.nih.gov/36083655/) produced samples and distinguished its actual run from a projection for a larger system.

**IBM Heron, 2023.** IBM introduced a 133-qubit superconducting processor with tunable couplers. Couplers affect how qubits interact and are one piece of a system’s error budget. Compare error rates on the same operation and under a stated protocol before using those rates to compare processors.

**Google Willow, reported December 2024 in a 2025 Nature issue.** Google reported that increasing surface-code distance reduced logical error per cycle in its quantum memory experiment, evidence of operation below threshold for that experiment. The measured object was an encoded memory. An application also requires a sequence of sufficiently reliable logical operations and a full accounting of overhead.

**Microsoft’s parity readout, 2025.** The Nature paper reported single-shot interferometric measurement of fermion parity in indium arsenide–aluminium devices. The reported measurements do not distinguish Majorana zero modes uniquely, so the paper establishes a readout result and leaves the topological qubit claim open.

**Photonic components, 2025.** PsiQuantum reported integrated photonic components, including sources, optical circuits, and superconducting detectors. Photonic encoding and cryogenic detectors can be part of the same architecture. System-scale losses, feed-forward operations, and error correction determine whether a collection of components can execute a useful program.

**D-Wave Advantage2, 2025.** D-Wave announced general availability in May 2025 with more than 4,400 annealing qubits. Its qubit count describes an annealer for a particular class of problems. For a proposed workload, account for embedding overhead, problem encoding, the quality of solutions, and the strongest available classical solver.

## What to do with this evidence

Set a pilot acceptance criterion in terms of your workload’s solution quality, end-to-end runtime and cost. Run a classical baseline with the same criterion and preserve the exact instance and configuration so the comparison can be repeated.

Treat post-quantum cryptography as a separate programme. NIST finalised its first three post-quantum cryptography standards in August 2024. Inventory public-key dependencies and long-lived sensitive data so teams can plan migrations around supplier support and the time required to upgrade protocols and certificates.

## Match the metric to the milestone

Random circuit sampling asks a processor to draw bit strings from a distribution set by a chosen circuit. Cross-entropy benchmarking compares sampled strings with probabilities from an ideal simulation where that comparison is tractable. This tests how well hardware can track a particular distribution as circuit size and depth grow. It says little about how many reliable logical gates an application can execute. When a report estimates a classical runtime, check which numerical precision and fidelity it requires, what classical hardware and algorithm it assumes, and whether it reports a run or extrapolates one. Simulators and their implementation can improve after a hardware paper appears. [Google Sycamore experiment](https://www.nature.com/articles/s41586-019-1666-5).

The Willow result answers a different engineering question. A surface code protects quantum information across data qubits, and repeated rounds of syndrome measurements supply evidence to a decoder. A comparison across code distances can show whether increasing the size of the encoded memory suppresses measured logical error in that implementation. Check the sequence length, timing, decoder assumptions, and treatment of rare correlated failures before using those rates in a resource estimate. Storing a state and operating on it have different costs. A workload may need movement or interactions between encoded patches, logical gates, state preparation, extra space for operations, and classical feedback. [Google Willow error correction experiment](https://www.nature.com/articles/s41586-024-08449-y).

| Claim in a paper | Evidence to look for | Decision it can support |
| --- | --- | --- |
| Hardware follows the expected statistics | Circuit family, depth, sample counts, fidelity estimate, and verification method | Whether the device can reproduce a particular benchmark distribution |
| Encoding suppresses memory errors | Error per cycle across code distances, cycle duration, wall-clock run time, and decoder configuration | Whether investing in a larger instance of the same memory is plausible |
| A logical circuit completes reliably | Logical primitive mix, number of operations, target confidence, calibration, and discarded runs | Which subroutine merits a larger demonstration |
| A workload benefits end to end | Fixed input, acceptance criterion, operational cost, wall-clock timing, and tuned classical comparison | Whether the technique warrants using on a specific problem |

## Freeze a workload before comparing vendors

Pick a small instance a classical solver can verify and a larger family that varies in one way at a time. For a manufacturing schedule, write down feasibility rules, the acceptable optimality gap, and how you will score an infeasible or missing result. Publish a fixed set of instances and a separate held-out collection for the final comparison. A team that tunes a quantum parameter circuit on the test cases can make the same evaluation mistake as a classical team that tunes solver parameters after inspecting held-out outcomes. Include model construction, transfers, compilation, calibration time attributable to the run, repeat shots, and final verification. Record queue time separately if it varies by provider.

Here is an illustrative repeat-run calculation. Suppose a run has an independently measured 10% chance of returning a verified answer of the specified quality. Under an independent, stable trial assumption, 29 attempts are needed for at least a 95% chance of one success because the chance of 29 failures is about 4.7%. At 250 milliseconds per attempt, serial attempts alone take 7.25 seconds. An additional fixed four seconds of setup would raise that estimate to 11.25 seconds. A service may batch shots, and repeated attempts under one calibration may share failure modes. Measure the actual duration and repeat the experiment across calibration windows before reporting an observed reliability or wall-clock advantage.

Read the results alongside their raw denominators. Publish the number of feasible instances and the quality distribution for all attempts, and show how missing entries affect aggregate time to solution. A chart can put success rate against elapsed time by instance size while marking censored runs at the declared time limit. Evidence on a small instance may justify studying a larger one. A purchasing decision needs comparable throughput, reliability, and constraints on the workload that will actually run.

## References

- [Google · Sycamore random-circuit sampling](https://www.nature.com/articles/s41586-019-1666-5)
- [IBM Research · Heron announcement and architecture](https://research.ibm.com/blog/research-annual-letter-2023)
- [Google · Quantum error correction below the surface-code threshold](https://www.nature.com/articles/s41586-024-08449-y)
- [Microsoft and collaborators · Single-shot parity readout](https://www.nature.com/articles/s41586-024-08445-2)
- [APS Physics · Context for the readout results](https://physics.aps.org/articles/v18/57/)
- [PsiQuantum and collaborators · A manufacturable platform for photonic quantum computing](https://www.nature.com/articles/s41586-025-08820-7)
- [D-Wave · Advantage2 availability](https://support.dwavesys.com/hc/en-us/articles/32105885880087-D-Wave-s-Advantage2-Quantum-Computer-Now-Generally-Available)
- [NIST · First three finalised post-quantum standards](https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards)
