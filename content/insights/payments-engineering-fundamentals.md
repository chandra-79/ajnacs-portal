---
title: "Payments Engineering Fundamentals: Money Movement for Software Engineers"
description: "Model authorization, capture and reconciliation, with stable operation identifiers, ledger checks and explicit handling of unknown outcomes."
date: 2027-09-24
tags: ["Payments", "Programming", "Distributed Systems", "FinTech", "Architecture"]
format: article
---

Payments is the domain where this series' abstractions acquire subpoenas: the at-least-once delivery that duplicates a log line elsewhere duplicates a *charge* here; the eventual consistency that staleness-budgets a dashboard misstates a *balance*; the unhandled edge case is a customer's rent money in limbo and a regulator's letter. Engineers arriving from general backend work bring exactly the right instincts — idempotency, reconciliation, event-time honesty — and need the domain's specific machinery, because payments punishes improvisation with the industry's least forgiving failure modes.

## The lifecycle: authorization is not money

The card payment's state machine is the foundational vocabulary: **authorization** (the issuer approves and *holds* funds — no money has moved; authorization validity and release behavior depend on the method and transaction type), **capture** (the instruction to actually move the held funds — separable from auth by design, which is what makes ship-then-charge flows possible: authorize at order, capture at fulfillment), **settlement** (the batch machinery that actually moves money between banks, on banking-day rhythms your real-time systems must model as the *pending→settled* distinction — the event-time-versus-processing-time split, with money attached), **refunds** (a new money movement referencing the original — not an undo; partial, multiple, and time-limited per scheme rules), and **disputes/chargebacks** (the issuer-initiated reversal with an evidence workflow and deadlines — the state machine's adversarial branch, where your audit trail becomes your defense). The engineering consequence: **model the full state machine explicitly** (the explicit-status discipline from saga practice — `requires_capture`, `pending_settlement`, `disputed` are states, not booleans), because every shortcut ("paid: true") is a future incident where the system can't represent what actually happened — and in payments, what actually happened is a legal question.

Underneath: the **idempotency disciplines graduate to fiduciary duty** (where the provider supports it, money-moving calls carry stable idempotency keys whose scope and retention are documented. Retries reuse the intended operation key, while reconciliation covers expired keys and uncertain outcomes — this is the chapter the idempotency article was secretly about), and **amounts use exact arithmetic and explicit currency, with API minor-unit conventions handled correctly** (the floating-point rounding error is a real reconciliation break; multi-currency means the rounding *rules* are per-currency spec knowledge, and conversion timestamps are part of the record).

## The ledger and the reconciliation loop: the books are the system

The architectural center of any serious payments system is not the gateway integration — it's the **ledger**: an append-only, double-entry record of every money movement (debits and credits balancing by construction, per accounting's oldest invariant), from which authoritative balances follow validated postings, with any stored balance projection reconciled to those entries (the event-sourcing instinct, applied where it was invented — corrections are new compensating entries, never edits, because the audit trail *is* the product). Around it, the **reconciliation loop** from integration practice becomes the daily heartbeat: your ledger versus the processor's reports versus the bank's settlement files, tied out on schedule, with every discrepancy triaged by an owner — because the gaps are where the real failure modes announce themselves (the captured-but-never-settled, the refund that bounced, the settlement file's fee line nobody modeled). The estates that skip ledger rigor run on the processor's dashboard as their source of truth, which works until the first multi-processor setup, the first migration, or the first audit — the three events that arrive at every growing payments operation.

**Failure handling** gets its domain-specific taxonomy: declines split into *hard* (stolen card, closed account — do not retry, per the issuer's explicit signal; retrying hard declines damages your fraud reputation with the networks — the sender-reputation physics from email practice, with card networks as the mailbox providers) and *soft* (codes whose retry handling follows current provider and network guidance: timing intelligence, retry budgets, and the dunning workflows of subscription practice), plus the *unknown-outcome* case (the timeout mid-capture — resolved through the provider's documented status lookup, event records and idempotent retry protocol rather than assuming that a timeout means no charge; the distributed-systems "did it happen?" question, with the answer's cost measured in dollars either direction).

## The perimeter: compliance shapes the architecture

Two structural forces every payments architecture bends around. **PCI DSS scope** — security requirements for systems storing, processing or transmitting card data, with scope determined for the actual integration — supports a common integration pattern: **tokenize at the edge** (hosted fields/SDK capture where the processor's iframe touches the PAN and your systems only ever see tokens — reducing raw-card-data exposure while leaving integration-specific compliance responsibilities; the scope-minimization instinct from every security discipline, with certification costs as the forcing function). **Payment-method and jurisdiction requirements** need a separate review. Authentication challenges, authorization validity, settlement finality, dispute handling, refund support and record-retention obligations differ by method, provider and market. Do not project a card authorization/capture model onto an account-to-account rail. Confirm the applicable integration and compliance requirements with the provider and responsible specialists, and encode the resulting states and deadlines explicitly. The build-vs-buy verdict lands decisively at the orchestration tier: many teams use established gateways and processors (the Stripe/Adyen tier — their fraud models and network relationships are decades of moat), while your *ledger, state machines, reconciliation, and orchestration* — the layer encoding your business's money semantics — is the part that's genuinely yours, and the part this article is about.

The closing calibration: payments engineering's reputation for difficulty is really a reputation for *honesty enforcement* — the domain simply refuses the shortcuts other systems absorb quietly. Explicit states, idempotent effects, append-only books, daily tie-outs, taxonomized failures, and a minimized compliance perimeter: every discipline is one this series already argued for, applied where the stakes make the argument unnecessary. Money is the best teacher of distributed systems — tuition due only from those who skip the reading.

## Separate provider state from the business ledger

A payment provider's object state, an order's fulfillment state and an accounting entry answer different questions. An order can be fulfilled before settlement, a payment can be captured but later disputed, and a refund can remain pending. Store stable references between these records rather than compressing them into one `paid` boolean. The application should explain which state it knows and which it is still reconciling.

Authorization windows and capture capabilities vary by payment method, network and transaction type. Use the provider's documented expiration metadata where available and model what happens if fulfillment occurs too late. A cancellation request may not release the customer's visible hold immediately. Do not promise a universal hold duration or instant reversal in customer-facing copy.

### A hypothetical settlement reconciliation

Suppose a batch contains gross captured payments of 10,000 currency units, refunds of 500 and processor fees of 300, with no other adjustments. The expected net settlement is 10,000−500−300=9,200. The chart displays the gross amount, refunds, fees and expected net as distinct quantities. The bars are not additive because the net is calculated from the other three.

These invented amounts illustrate reconciliation, not an accounting policy or real processor fee schedule. A production batch may include reserves, disputes, currency conversion, prior-period adjustments and timing differences. Reconcile using provider transaction and balance references, not only an aggregate total. Two errors of equal and opposite value can cancel in the total while leaving individual customers wrong.

Store money in an exact representation with explicit currency and the provider's required amount convention. Many APIs use integer minor units, but currencies and operations have special rules. Internal ledgers can use a suitable fixed-precision decimal representation when the accounting model requires it. Avoid binary floating-point arithmetic for amounts, and define rounding at each conversion or allocation boundary.

## Idempotency covers a logical operation

Generate an operation identifier before making a money-moving request and persist it with the intended parameters. Retries of the same logical request must reuse that identifier. A new refund is a different operation from retrying the previous refund, even if the amounts happen to match. Document the provider's key scope, retention and parameter-mismatch behavior.

A timeout means the outcome is uncertain, not necessarily failed. Retrieve the provider object or reconcile through its supported mechanism before creating another logical operation. If the original request eventually succeeds, the application must converge on that state. Keep the user informed with a pending status rather than presenting a definitive failure that encourages repeated checkout attempts.

The local database transaction and the provider API call are not one atomic transaction. A durable intent record and a worker/outbox pattern can make the workflow recoverable, but the worker still needs idempotent external requests and reconciliation. Do not hold a long database transaction open across a remote payment call and assume that rollback can undo the provider's action.

## Webhooks are notifications that require validation

Verify webhook signatures using the documented raw-body procedure and keep signing secrets separate from public identifiers. Deduplicate events and make handling safe under repeated delivery. Do not assume webhook order matches business event order or that every delivery succeeds on the first attempt. Fetch authoritative object state when needed and use version/state-transition rules that avoid reverting a newer state.

Acknowledge only according to a durable processing design. One option is to validate and persist the event quickly, then process it asynchronously with retries and a visible dead-letter path. The correct choice depends on the provider's timing requirements and the application's guarantees. A successful HTTP response that precedes any durable record can lose work during a process crash.

Keep webhook delivery health separate from reconciliation. A scheduled reconciliation can discover events missed because of a configuration error, expired endpoint or code defect. It should compare expected local state with provider records and produce actionable exceptions with owners. The ledger must not depend solely on every notification arriving perfectly.

## Ledger invariants and corrections

A double-entry ledger can represent balanced movements, but the account structure, posting rules and recognition policy need accounting expertise appropriate to the product. Enforce balanced postings within each currency and prevent duplicate operation posting. Materialized balances can be useful for performance if they are derived and reconciled against the authoritative entries; mutable caches are not inherently forbidden, but they must not silently replace the audit trail.

Corrections should retain provenance. Reverse or adjust an erroneous posting according to the ledger design rather than editing history without evidence. Record the reason, authorizing workflow and links to the original event. Restrict manual repair permissions and make the repair itself auditable. A powerful administrative interface can create more financial risk than a rare API failure if it bypasses invariants.

### A failure-oriented integration lab

Use the provider's test environment and documented test fixtures. Exercise a successful authorization/capture, an expired authorization, a partial refund, a duplicate request, a delayed webhook and a timeout after a possible commit. Verify that each logical operation appears once in the local records and that uncertain states eventually reconcile. Do not run invented live charges as a test of resilience.

Add a batch with a missing fee line and another with two offsetting transaction errors. The reconciliation should detect both the aggregate mismatch and the item-level mismatch. Test that operational alerts identify the affected payment reference without exposing card details or unnecessary personal data. Record the recovery procedure and expected operator decision for each scenario.

## Scope, access and customer communication

Hosted payment collection and tokenization can reduce exposure to raw card data, but they do not automatically remove all PCI DSS responsibilities. Follow the chosen integration's current requirements and obtain the appropriate assessment of scope. Keep secrets, webhook bodies and logs under controlled access, and avoid storing sensitive authentication data merely because a debugging tool makes it convenient.

Payment-method and jurisdiction requirements vary. Treat authentication, dispute deadlines, retry restrictions and residency obligations as current product-specific inputs rather than universal rules in a generic article. Decline codes also need the provider's documented handling; a label such as “soft” is not blanket permission to retry indefinitely.

A production handoff should include state transitions, idempotency rules, ledger invariants, reconciliation queries, exception owners and customer messages for pending outcomes. The system is ready when it can explain and recover from an uncertain transaction without duplicate effects or silent accounting drift.

### Figure methodology

Synthetic same-currency batch:10,000 captured−500 refunds−300 fees=9,200 expected net. Assumes no reserves, disputes, conversion or timing adjustments. Bars are components and a derived total, not additive observations or a provider fee quote.

| Worked observation | currency units |
| --- | ---: |
| Gross captures | 10000 |
| Refunds | 500 |
| Fees | 300 |
| Expected net | 9200 |

## Primary references and further study

- [Stripe authorization and capture](https://docs.stripe.com/payments/place-a-hold-on-a-payment-method)
- [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests)
- [Stripe webhook verification and delivery](https://docs.stripe.com/webhooks)
- [Stripe integration security and PCI responsibilities](https://docs.stripe.com/security/guide)
