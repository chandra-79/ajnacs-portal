# Build a unit-cost denominator that survives an audit
@lesson cost-per-successful-order | Tie costs to completed business outcomes and show how retries can distort the denominator.
@chart Reported cost under three counting rules | USD per event
@value All attempts | 0.025
@value Unique orders attempted | 0.0273
@value Successfully fulfilled | 0.03
@match cost per | unit cost | denominator | chargeback | completed orders | unit economics
@source FinOps Foundation · Unit Economics | https://www.finops.org/framework/capabilities/unit-economics/

## Choose an economically useful event

The worked period costs $3,000. It contains 120,000 system attempts, 110,000 unique order IDs attempted, and 100,000 orders successfully fulfilled. Cost per attempt is $0.025. Cost per distinct order attempted is approximately $0.0273. Cost per successful outcome is $0.03. The attempt metric is useful for infrastructure efficiency. Using it to report unit economics would lower the number as retries grew, even if revenue-generating outputs did not improve.

## Reconcile the numerator and denominator

Decide how to handle refunds, cancellations, reprocessing, and late completions. A warehouse that aggregates attempts by request ID may accidentally include partial retries as new orders. Build the denominator from the authoritative business event. Check a sample of orders from the finance period against event timestamps and the ingestion cutoff.

Include retry and failed-work costs in the numerator where they support the product. Normalize currencies before adding them. Document how direct cloud spend, shared services, commitments, credits, and tax enter the numerator. If outcomes are seasonal, show the number of successful outcomes beside unit cost so the reader can see the volume effect.

## Limits of the example

The values are illustrative and do not establish an industry target. For months with zero qualifying outcomes, show total spend and mark unit cost undefined. Different products may need different denominators. Keep their rates separate unless there is a defensible conversion.

# Reconcile BilledCost and EffectiveCost by period
@lesson effective-cost-reconciliation | Separate invoice timing from recognized usage cost and validate an allocation total against the source export.
@chart Recognition from a simplified commitment | USD
@value Purchase month billed | 1200
@value Month 1 effective | 100
@value Month 2 effective | 100
@value All 12 months effective | 1200
@match effectivecost | effective cost | billedcost | commitment | amortization | reserved instance | savings plan
@source FOCUS 1.4 · Effective Cost | https://focus.finops.org/docs/specification/v1-4/columns/cost-and-usage/effective-cost/

## Keep two views

A simplified $1,200 purchase is paid at the beginning of a year. Suppose the provider's export identifies $100 recognized per month over 12 months. The invoice cash view shows $1,200 in the purchase month. The accrual view recognizes $100 each month. For the whole term those totals reconcile in this simplified example. Actual exports may include partial periods, recurring charges, adjustments, unused commitment, and reseller timing.

## Reconcile each measure on its own

Use invoice IDs, billing currency, and billing period when matching BilledCost to a statement. Use charge periods and resource or product keys when building EffectiveCost views. FOCUS defines EffectiveCost for covered usage and corresponding purchase charges so the recognized amount is not counted twice. Read the provider's mapping and schema version before replacing contract logic with an assumed straight-line formula.

Take a time-bounded export snapshot. Sum by period, currency, and charge category before grouping by service. Preserve an explicit unallocated bucket. When attribution changes over time, preserve the version of the allocation rule and the effective dates for joins. A reconciliation difference often points to dimensions or duplicate rows introduced by joins, not incorrect provider totals.

## Limits of the example

The example represents a single one-year commitment with complete usage. It omits taxes, credits, and unused portions. A single month need not reconcile between BilledCost and EffectiveCost. Validate the invoice and economic views against the relevant source populations.

# Explain a unit-cost change with a volume and rate bridge
@lesson unit-cost-variance-bridge | Separate volume from unit-rate changes and test whether allocation choices change the decision.
@chart Spend bridge with 20% more outcomes | USD
@value Old spend | 3000
@value Old rate at new volume | 3600
@value New spend | 3300
@match allocation | anomaly | volume | marginal cost | sensitivity | showback
@source FinOps Foundation · Unit Economics | https://www.finops.org/framework/capabilities/unit-economics/

## Write the bridge

The baseline costs $3,000 for 100,000 successful orders, or $0.0300 each. This month costs $3,300 for 120,000 successful orders, or $0.0275 each. At the old rate, the new volume would cost $3,600. The volume effect is +$600. The difference between actual spend and that counterfactual is −$300. Together they explain the +$300 change. The rate improved by $0.0025 per order, about 8.3%, even though total spend rose 10%.

## Test whether the recommendation is robust

If $240 of shared costs moved out of this product because of a new allocation key, add that $240 back to build a sensitivity case. At $3,540 the new unit rate is $0.0295. It still improves on baseline, but much less. Decompose further only when you can identify the same service in both periods and distinguish idle commitments, service rates, and workload mix.

Keep the volume bridge and sensitivity assumptions in a versioned worksheet. Use completed orders under the same definition in each period. If the new product mix includes costlier orders, break down outcome volume and unit rates by product class before attributing the overall change to engineering productivity.

## Limits of the example

Changing the order of a variance decomposition can move interaction effects between buckets. Declare the chosen baseline first. A bridge explains an arithmetic difference. It does not establish causality or predict the marginal cost of the next order.
