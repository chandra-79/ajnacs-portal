---
title: "Raft, Actually Understood: Consensus for Engineers Who Operate It"
description: "Calculate majority tolerance, understand current-term commitment, and rehearse elections, membership changes and state recovery."
date: 2027-01-04
tags: ["Distributed Systems", "Consensus", "Containers", "Reliability", "Architecture"]
format: article
---

Consensus algorithms used to be something engineers could politely ignore — Paxos was famously impenetrable, and the systems using it hid it well. Raft changed both halves: designed explicitly for understandability, it became the consensus engine of the modern stack — etcd (used by conventional Kubernetes control planes), Consul, Kafka's KRaft metadata quorum, and replicated ranges or regions in systems such as CockroachDB and TiDB. Implementations and protocol variants differ. Majority membership, partitions and leader changes nevertheless recur across these products, so understanding Raft helps explain their documented write and recovery behavior.

## The problem, and the shape of the solution

Consensus is the problem of getting a cluster of unreliable machines to agree on a sequence of decisions — a *replicated log* — such that the log stays consistent even as nodes crash, restart, and partition. Every "the cluster remembers X" system reduces to this: agree on log entry 1, then 2, then N, and apply them in order to a state machine (the key-value store, the configuration, the partition assignments). Raft's design bet was that consensus should be decomposed into pieces humans can hold: **leader election** (one node coordinates at a time), **log replication** (the leader sequences all writes), and **safety rules** (safety guarantees under the stated crash-failure and durable-storage model, rather than arbitrary Byzantine behavior) — with everything hinging on one mechanism: **the majority quorum.**

**Terms and election:** time divides into numbered terms; each term has at most one leader. Followers expect heartbeats; a follower that hears silence past its (randomized) election timeout declares candidacy, increments the term, and solicits votes — winning leadership on a **majority**. Randomized timeouts reduce repeated split votes under suitable communication and timing conditions; they do not guarantee election progress through an indefinitely hostile network schedule; the majority requirement is the safety core: two leaders can't coexist in one term because two majorities must overlap. **Replication:** clients write through the leader, which appends to its log and replicates to followers; a current-term entry can be **committed** once replicated on a majority under the algorithm's persistence rules; earlier-term entries have an additional commitment restriction, and only then applied and acknowledged. **The safety rule that ties it together:** a voter grants its vote only to a candidate whose log is at least as up-to-date as its own; a candidate must obtain a majority — so a new leader *provably contains* every committed entry, and committed means committed, across any sequence of crashes and elections.

## Why odd numbers, and what quorums really cost

The quorum arithmetic every operator should be able to recite: a cluster of N tolerates ⌊(N-1)/2⌋ failures — 3 nodes tolerate 1, 5 tolerate 2, and **4 nodes tolerate exactly what 3 do** (a majority of 4 is 3, so two failures kill both) — which is the entire reason for odd-numbered clusters: an additional even-numbered voter does not increase the count of unavailable voters tolerated by the simple majority model. The deeper operational readings: **quorum loss means unavailability, by design** — a Raft system that can't assemble a majority *stops accepting writes* rather than risk divergence (this is CP behavior in CAP terms: the minority side of a partition goes read-only-or-worse, and that's the algorithm keeping its promise, not failing); **committing a new entry requires majority replication** — commit latency depends on the required fastest follower acknowledgements, persistence and protocol overhead, which is why stretching a quorum across distant regions taxes every write with geography (the multi-region write-latency physics, here as the consensus floor), and why the practical deployment shape is quorums *within* a region or metro, with async replication across (or per-partition quorums placed by data homing); and **quorum members are precious** — five-node clusters where two nodes share a rack/zone/hypervisor have quietly reduced their real tolerance; anti-affinity for consensus nodes is table stakes.

## The failure modes that actually page you

**Leader failover pause:** between a leader's death and a successor's election sits the election timeout plus voting — typically sub-second to seconds — during which writes stall. Well-tuned systems make this a blip; mis-tuned ones (timeouts too long, or too short causing spurious elections under GC pauses — the paused-process problem from locking practice, now electing your infrastructure) make it a recurring mystery incident. **Leadership flapping** — repeated elections under load, network jitter, or slow disks (Raft's log must fsync; a consensus node on throttled storage drags every commit and destabilizes heartbeats — the classic "etcd is slow" root cause is disk latency, not etcd) — watch election counts and fsync percentiles as first-class vitals. **The stale-read subtlety:** followers hold slightly-old state, and even a deposed leader may briefly *think* it leads — so linearizable reads require a safe authority-and-state check, such as a read-index protocol or a lease mechanism with its stated assumptions, which systems expose as a consistency option; knowing when your client is choosing fast-possibly-stale versus confirmed-current reads is knowing which anomaly you've accepted (the isolation-level lesson, one layer down). **Membership changes are their own protocol:** adding/removing consensus members mid-flight is where naive implementations historically corrupted themselves; modern Raft does joint-consensus or single-node-at-a-time changes — operationally, respect the one-at-a-time discipline and never "fix" a struggling cluster by bulk-swapping members. **And backup the state machine anyway** — consensus protects against minority failure, not against operator error, corruption bugs, or majority loss; the etcd snapshot schedule is the Kubernetes control plane's actual disaster-recovery story (recovery after majority loss depends on surviving durable state and the product's supported recovery procedure — the disaster-recovery rehearsal disciplines apply to the coordination tier doubly).

## The architect's takeaways

Three placement rules fall out. **Scale consensus by the workload and group design** — the pattern that scales is small Raft groups governing *metadata* (who owns what, configuration, membership) while data flows through partitioned, replicated planes governed *by* that metadata (KRaft coordinating Kafka's partitions; etcd coordinating Kubernetes' state; per-range Raft groups in CockroachDB sharding the consensus itself — the consistent-hashing marriage). **Don't hand-roll it** — the delta between textbook Raft and production Raft (snapshotting, log compaction, membership edge cases, disk-corruption handling) is a decade of bug reports; embed a hardened library or operate a proven system, per the build-vs-buy verdict on anything with correctness cliffs. **And design around the pauses** — clients of consensus systems need the retry-with-backoff reflexes for election windows, and architectures targeting high write availability across regions must assess quorum placement, correlated failures and client recovery. Partitioning data into more quorum groups can distribute load but does not remove each group's majority requirement (the coordination-avoidance instinct from every earlier discipline: the best consensus round remains the one you didn't need).

The satisfying part, as with the ring: this is a *small* algorithm — terms, majorities, log-completeness voting — carrying a staggering fraction of modern infrastructure. Studying its invariants makes vendor documentation easier to interpret, and your next control-plane incident from mystery to diagnosis. That conversion rate is what the fundamentals always offer.

## Worked quorum budget with failure domains

Consider a hypothetical three-voter cluster. A majority is floor of three divided by two, plus one, which equals two. It can continue with one voter unavailable if the remaining pair can communicate and the protocol can elect a suitable leader. A four-voter cluster needs three votes and still tolerates only one unavailable voter. A five-voter cluster needs three votes and can tolerate two. The figure plots these maximum unavailable-voter counts under the simple majority model: one, one and two respectively.

This arithmetic assumes stable membership and does not count learners as voters. It also assumes that surviving voters have valid durable state and can exchange messages. It is not a probability of availability. If three voters share one power supply, a single physical failure can remove the entire quorum. If five voters are placed as three in one zone and two in another, losing the larger zone removes the majority. Write the failure-domain layout beside the node count before claiming zone resilience.

Placement also changes write latency. With one leader and two followers, the leader needs acknowledgement from at least one follower after the required persistence work. In a five-voter group it needs at least two followers. The relevant delay is the required acknowledgement order statistic plus local and protocol overhead, not the median network distance of all followers in every topology. Disk persistence, batching, scheduling and flow control can dominate the network round trip. Measure the deployed implementation rather than deriving a percentile from geography alone.

## Understand the current-term commitment rule

A common simplification says that any entry present on a majority is committed. Raft's leader cannot generally commit an entry from an earlier term solely by counting replicas. It directly advances commitment by majority replication of an entry from its current term; earlier entries become committed as part of the resulting prefix. This restriction and the election rule work together to preserve committed history across leadership changes.

The election rule compares the candidate's last log term and then its last log index, rather than simply checking that it has the largest count of entries. Each voter grants at most one vote per term under the algorithm's persistence requirements. A candidate needs a majority of eligible votes, not agreement from every server. Some followers can have uncommitted divergent suffixes that are later replaced. Losing an unacknowledged suffix is not the same as losing an acknowledged committed command.

For a paper exercise, draw a short log for three replicas with index and term on every entry. Mark the last committed index and then introduce an uncommitted entry on the old leader. Stop that leader, elect a candidate whose log satisfies the voting rule, and trace which suffix survives. Repeat after a current-term entry is committed on the majority. Write down exactly when a client acknowledgement is permitted. This exercise is more useful than memorizing that a majority is good because it exposes the distinction between replication, commitment and application.

## Application semantics remain outside the log algorithm

A client can send a command, have it committed, and lose the response. After reconnecting it cannot infer failure from the timeout. If it sends a new command to transfer the same money, the replicated state machine may faithfully execute both. Consensus agreed on two commands; it did not know they represented one intended business operation. The application needs stable request identifiers and a deduplication/result protocol if retries must preserve a single logical effect.

State-machine execution also needs deterministic behavior, or an equivalent design that records decisions in the log. Calling the local wall clock or an external random source independently on each replica can produce different results from the same command. External effects such as email or payments need their own delivery and reconciliation design. Committing a command to send an email is not an atomic commit with the recipient's mail system.

Read semantics deserve equal attention. A follower may be behind, and a former leader may not yet know it has lost authority. A linearizable read path must establish the necessary authority and committed-state conditions using the implementation's protocol. Read-index and lease-based techniques make different assumptions; a lease approach can rely on timing bounds. A fast local read option may intentionally provide weaker freshness. Document which option the application uses and test it during elections.

## A safe operational lab

Use a disposable cluster and the product's documented administration interface. Record member identifiers, voting status, leader, term, commit and applied positions, storage latency and client outcomes. Generate a small stream of uniquely identified writes. Stop one follower and verify that the service continues according to its contract, then restore it and observe catch-up. Next stop the leader and capture the election interval and ambiguous client requests rather than reporting only successful retries.

Do not turn a learning exercise into an improvised membership repair. Adding a voting member can raise the quorum threshold before that member is useful if the implementation does not stage the change appropriately. Follow its learner or reconfiguration workflow and verify completion before the next change. The original Raft paper describes joint consensus; production implementations may use constrained membership protocols. Operational commands must match the chosen implementation, not a generic diagram.

Test storage pressure independently from network loss. A member can answer health probes while taking too long to persist log entries. Record persistence latency, queue depth and leader changes together. Increasing timeouts may reduce election churn but does not repair overloaded storage. Conversely, making timeouts very short can turn ordinary scheduling jitter into frequent elections. The useful setting is justified against measured conditions and documented failure-detection expectations.

## Recovery worksheet and exit criteria

Consensus replication is not a substitute for backup. An authorized destructive command can be replicated perfectly. A snapshot must include the state and metadata needed by the product's supported restore process; copying arbitrary live files is not automatically valid. Rehearse restoration into an isolated environment, verify the application state, and record how clients discover the restored cluster. A successful snapshot command without a restore test establishes only that a file was produced.

Before ending the lab, reconcile every acknowledged request against recovered state and account for each timeout as committed, rejected or unresolved. Confirm that restored members have caught up and that no temporary network rules remain. Keep the figure's simple fault-tolerance arithmetic separate from the measured service recovery time. The first explains quorum capacity; the second includes elections, storage, client retries and the application's own recovery behavior.

### Figure methodology

Synthetic majority arithmetic for stable membership: quorum = floor(N/2)+1 and tolerated unavailable voters = N-quorum. Three and four voters tolerate one unavailable voter; five tolerate two. Surviving voters must communicate and retain valid state; this is not an availability forecast.

| Worked observation | unavailable voters tolerated |
| --- | ---: |
| 3 voters | 1 |
| 4 voters | 1 |
| 5 voters | 2 |

## Primary references and further study

- [Ongaro and Ousterhout: extended Raft paper](https://raft.github.io/raft.pdf)
- [etcd: disaster recovery](https://etcd.io/docs/v3.6/op-guide/recovery/)
- [etcd: runtime reconfiguration](https://etcd.io/docs/v3.6/op-guide/runtime-configuration/)
