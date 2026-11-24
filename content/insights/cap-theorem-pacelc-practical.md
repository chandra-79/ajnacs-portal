---
title: "CAP and PACELC, Practically: What the Theorem Actually Constrains (and What It Doesn't)"
description: "Define consistency and availability per operation, work through a three-replica partition, and document normal-operation latency tradeoffs."
date: 2027-01-22
tags: ["Distributed Systems", "Data Engineering", "Architecture", "Reliability", "Programming"]
format: article
---

The CAP theorem achieved something rare for a formal result: wide discussion and frequent oversimplification. The folklore version — "consistency, availability, partition tolerance: pick two" — suggests a menu where you might sensibly decline partition tolerance, and it has justified a decade of hand-waving in both directions: NoSQL marketing waving away consistency ("CAP says we can't have it!") and skeptics waving away the theorem ("partitions are rare, ignore it"). The actual result is narrower, sharper, and more useful — and its daily-driver extension, PACELC, is a useful additional prompt for normal-operation tradeoffs.

## What the theorem actually says

The formal claim: in the presence of a **network partition** — nodes that cannot communicate — a distributed system cannot provide both **linearizable consistency** (operations behave like one copy and respect the real-time order of non-overlapping operations) and **availability** (every operation at a non-failed node eventually completes according to the object contract; the formal definition does not impose a fixed response-time bound). The intuition is almost embarrassingly direct: if the network splits and a client writes on one side, a read on the other side must either wait/refuse (sacrificing availability) or answer from stale state (sacrificing linearizability) — there's no third option, because the information physically hasn't crossed the partition.

The corrections to folklore follow immediately. **Partition tolerance isn't optional** — partitions are a property of networks, not a feature you decline (switches fail, AZ links degrade, GC pauses and overload mimic partitions indistinguishably — the gray failures from failover practice); a CA claim must state its no-partition assumption and what the implementation does when that assumption fails. So the real choice is *what happens during a partition*: **CP systems** (the consensus tier — Raft-backed stores, etcd, the quorum databases) refuse or delay minority-side operations, preserving correctness at availability's expense (the loss of quorum prevents some operations; whether stale reads remain possible depends on the protocol — the algorithm keeping its promise); **AP systems** (Dynamo-lineage stores, multi-master replication, CRDT-based systems) keep answering everywhere, accepting divergence to be reconciled later (the conflict-resolution obligations from multi-writer practice — which is why "AP" is a commitment to *engineering* eventual consistency, not a free lunch). And the binary is really a **spectrum per operation**: real systems offer consistency *levels* (quorum vs local reads, linearizable vs stale options — the read-consistency dials in every serious database), letting each query choose its position; "is this database CP or AP?" is usually the wrong granularity.

Equally important is what CAP *doesn't* say: nothing about behavior when the network is healthy, nothing about latency, and nothing about the weaker-but-useful consistency models (causal, read-your-writes, session guarantees) that occupy the space between linearizable and eventual — the models that solve most actual product problems ("users must see their own updates" is a session guarantee, not linearizability, and its implementation cost depends on routing, replication and session state).

## PACELC: include normal-operation tradeoffs

The refinement that earns daily use: **if Partition, trade Availability vs Consistency; Else — during normal operation — trade Latency vs Consistency.** The "else" clause is where systems actually live, and it names the trade CAP is silent on: strong consistency constrains coordination and replica placement — quorum round-trips, and across regions, the geographic write tax from multi-region physics (consensus commit latency is quorum distance, per the Raft operational math). Synchronous writes may pay remote coordination latency in fair weather; safe leader-local or lease-based reads need not contact a quorum for every operation — which is the actual reason most estates run relaxed consistency most places: not partition heroics, but the everyday economics of round trips.

Historical PACELC classifications are design summaries, not permanent product guarantees; configuration and operation matter. For example: Dynamo-style stores are PA/EL (available during partitions, latency-favoring normally — the shopping-cart posture); Spanner-class systems are PC/EC (consistent in both modes, using a transaction protocol with bounded-time uncertainty — the bounded-uncertainty machinery from clock practice buying external consistency); quorum databases require inspection of their actual read, write and repair protocols; and the classic primary-with-async-replicas topology is the honest mixed case — writes consistent at the primary, replica reads trading staleness for latency and locality (the replication-lag conversation from every read-scaling discussion, now with its theoretical citation).

## Using it in design reviews

The framework's practical yield is a set of questions that replace the slogan: **Classify per data class and operation, not per system** — the account balance and the recommendation cache deserve different placements, and mature architectures mix them deliberately (the polyglot-persistence logic, grounded); **name the invariant before choosing the model** — "no double-booking" needs coordination somewhere (transactions that actually enforce the invariant at a sufficient isolation level, or a single-writer design per the partitioned-ownership patterns); "profile updates eventually visible" doesn't — and paying coordination costs for invariants you don't have is the EL-side waste, while assuming eventual consistency where invariants exist is the write-skew genre of incident; **design the partition behavior explicitly** — for CP components, what does the minority side *do* (fail fast with clean errors, per the error-contract disciplines — not hang)? for AP components, what's the *reconciliation* story (merge functions, tombstones, the conflict surfaces documented — not "last write wins" by default, which is the silent-data-loss setting per the clock-skew truths)?; and **write the staleness budget down** — replica reads and caches are consistency decisions wearing performance costumes; "search results may lag writes by 30 seconds" is a fine contract *when stated* (the derived-store lag SLOs from CDC practice), and an incident-report sentence when discovered.

The closing calibration: CAP's cultural damage was making consistency sound like a boolean you toggle at database-selection time; the working reality is a *budget you spend per operation* — coordination where invariants demand it, relaxation where latency and availability pay better, partitions handled by explicit design rather than by surprise. The theorem tells you the extreme corners are unreachable; PACELC tells you what the middle costs; and the engineering, as ever, is knowing which of your operations lives where — written down, per data class, where the next architect can find it.

## A partition exercise with an explicit service contract

Consider a hypothetical reservation service backed by three voting replicas, A, B, and C. The business rule is that a seat can have at most one confirmed owner. The API distinguishes a confirmed reservation from an unconfirmed request. That distinction matters: accepting a request into a local queue is not the same operation as confirming ownership. Returning a successful HTTP response does not automatically satisfy the availability property of a linearizable reservation object if the requested operation has not succeeded according to its contract.

Suppose the replication protocol requires two votes to commit an update. With all three replicas connected, a suitable leader can obtain a majority. Now isolate C from A and B while allowing clients to reach both components. The majority component has two reachable voters and can potentially continue after any required election. C has only one. It cannot safely confirm a conflicting reservation under the same linearizable contract. A timeout or explicit temporary refusal is an availability loss for that operation, even if the health endpoint and locally cached catalogue remain available.

These counts do not prove that the majority is operational. A and B might have exhausted disks, no elected leader, or an authentication failure. Quorum is a necessary ingredient for this illustrative protocol, not a complete service health model. Nor does a failed write imply that nothing committed: a response can disappear after the commit. The client must retry using the same reservation identifier or query the existing operation, rather than create a second business request.

Now change the contract to a wish list. Each component can accept additions with globally unique operation identifiers, retaining enough history to reconcile them. This can make local operations available during the partition, but the merge rules become part of the product. If one user removes an item while another adds it, the selected add-wins or remove-wins rule determines the outcome. A timestamp-based overwrite is a different rule and may discard an accepted update. An availability-oriented design needs a specified convergence mechanism; the CAP theorem does not supply one.

## Separate consistency, isolation, and durability

Linearizability describes operations on an object as if they occurred instantaneously in an order that respects real-time precedence. If one write completes before a read begins, a linearizable register cannot return a superseded value. Concurrent operations may have more than one permissible ordering. This is stronger and more precise than saying that all servers always contain identical bytes.

Serializable transaction isolation means that committed transactions are equivalent to some serial execution. It does not, on its own, require that serialization order respect external real-time order. Strict serializability combines those ideas for transactions. An application can still violate its business rule under serializable isolation if it never checks the rule, checks a different resource, or sends an external side effect outside the transaction. State the invariant, the transaction boundary, and the acknowledged result together.

Durability is another axis. A system can return consistent results while using a storage policy that loses acknowledged updates after a specified combination of failures. Conversely, several durable copies can preserve mutually conflicting values. Record the failure assumptions behind an acknowledgement: memory, local disk, replicated disk, or another documented persistence boundary. Do not infer a durability promise from the letters CP or AP.

## A worksheet for normal-operation latency

PACELC is useful as a design prompt because network distance matters even without a partition. For each operation, record its locality, required consistency, acceptable staleness, read and write path, and expected failure response. A profile page may permit a cached biography while requiring a fresh access-control decision. Combining both into one database label hides the important distinction.

Measure a baseline with the actual deployment topology. Report response-time percentiles, successful operations, rejected operations, timeout counts, and the configured deadline. Include replication backlog and the age of the value returned when stale reads are permitted. A fast stale read and a slower fresh read are different products unless their consistency contract is disclosed. A timeout is not a long successful request and should not silently disappear from the chart.

For an exercise, write down the maximum age of a search document and the behavior when that bound cannot be established. A fixed refresh interval alone does not enforce a maximum age if ingestion is stalled. Attach a source version or processing watermark and decide whether to show a freshness notice, route to an authoritative store, or refuse the freshness-sensitive action. This turns an abstract consistency preference into observable behavior.

## Run and interpret the failure drill

Use an isolated test environment and a documented cluster recovery procedure. Create a client history containing unique operation identifiers, invocation and completion times, returned values, and explicit errors. Start with a known seat state. Introduce a controlled network split, issue conflicting requests through both components, then heal the split and inspect the final state and acknowledgements. Include a second trial in which only the response path is interrupted, since that produces an ambiguous outcome without necessarily preventing a commit.

Check the history against the declared invariant instead of merely counting successful requests. Two distinct confirmed owners for one seat violate the example contract. One confirmed owner plus a timeout may be correct, although it consumes the availability budget. Two locally accepted pending requests can also be correct under a different API, provided the UI never presents them as two confirmed reservations. Record that distinction in the test assertions.

Repeat with an explicitly stale read option and verify that its output is labelled or constrained according to the product contract. After recovery, verify convergence and backlog drainage before declaring the drill complete. Document who can disable the exercise, where network rules are restored, and how clients resolve unknown outcomes. The useful output is a per-operation decision record with evidence, not a permanent four-letter classification of an entire vendor's database.

### Figure methodology

Synthetic topology: three voting replicas split into components of two and one. The example requires two votes to commit. Bars count reachable voters, not successful requests or an uptime forecast. Elections, storage health and client routing are outside this count.

| Worked observation | reachable voters |
| --- | ---: |
| Connected cluster | 3 |
| Majority component | 2 |
| Minority component | 1 |

## Primary references and further study

- [Gilbert and Lynch: formal CAP result](https://www.comp.nus.edu.sg/~gilbert/pubs/BrewersConjecture-SigAct.pdf)
- [Abadi: PACELC and consistency tradeoffs](https://www.cs.umd.edu/~abadi/papers/abadi-pacelc.pdf)
- [PostgreSQL: transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
