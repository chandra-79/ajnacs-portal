---
title: "Reserved Instance Rationalisation: How to Commit to the Right Resources"
description: "Committed use discounts (Reserved Instances, Savings Plans, CUDs) are one of the highest-return FinOps actions — but committing to the wrong shape or term locks in waste. Here's the analysis process for getting it right."
date: 2025-11-20
tags: ["FinOps", "Cost Optimisation", "Cloud Architecture"]
series: "FinOps from Zero to Production"
seriesOrder: 2
format: article
---

Committed use discounts go by different names across cloud providers — Reserved Instances (AWS), Reserved VM Instances and Committed Use Discounts (GCP), Reserved VM Instances (Azure) — but they all work on the same principle: commit to a minimum spend level or specific resource configuration for 1 or 3 years, receive a discount compared to on-demand pricing.

On most instance types, the 1-year no-upfront Reserved Instance discount runs somewhere in the 35-40% range compared to on-demand. The 3-year equivalent often runs 55-65%. These are significant discounts for the right workloads.

The risk: commit to an EC2 instance type that you end up not using (because you migrated to containers, or the workload scaled differently than expected, or a newer instance type became available), and you're paying for something you've moved away from.

The analysis that makes the difference is identifying what's genuinely stable — and being honest about what isn't.

## What to measure

**Commitment savings after waste.** Suppose equivalent on-demand usage costs $10,000. If the combination of commitments (used and unused) plus uncovered usage costs $8,700, realised savings are $1,300, or 13%. Track hourly utilisation as well as monthly totals to expose persistent surplus.

*Illustrative measurement. Any numbers in this example are hypothetical.*

Further reading: [FinOps Foundation, State of FinOps 2026](https://data.finops.org/).

## The baseline analysis: what's actually steady-state?

Before committing to anything, run three months of historical usage data through your cloud cost management tool (AWS Cost Explorer, Azure Cost Management, GCP Cost Recommender) and answer three questions:

**1. Which instance families have been consistently running for the full 90 days?**

Not "we have a t3.large running", but "this t3.large has been running at > 80% of hours for the last 90 days". An instance that runs continuously is a commitment candidate. An instance that runs a few days a month is not.

**2. What's the minimum stable footprint?**

If you run between 5 and 12 m5.xlarge instances depending on load, the minimum stable footprint is 5 — commit to 5 Reserved Instances and run the variable portion on-demand or Spot. Never commit to the peak.

**3. Is this workload likely to change in the commitment period?**

Active migrations (from VMs to containers, from one instance family to another), planned growth that would require different instance sizes, and workloads being evaluated for decommissioning are all poor candidates for 3-year commitments. 1-year may still make sense; 3-year probably doesn't.

## Savings Plans vs Reserved Instances (AWS-specific)

AWS offers both Reserved Instances (tied to a specific instance type, region, OS, and tenancy) and Savings Plans (a commitment to hourly spend, flexible across instance types and services).

**Compute Savings Plans** apply to EC2, Lambda, and Fargate. They're the most flexible — a $5/hour commitment applies automatically to whatever compute you're running. This flexibility has value when you're migrating from EC2 to containers or when your instance type mix is likely to shift.

**EC2 Instance Savings Plans** apply to a specific instance family in a region (e.g., all m5 instances in us-east-1, any size, any OS). Less flexible than Compute Savings Plans, but deeper discounts.

**Reserved Instances** require specifying the exact instance type, region, OS, and tenancy. The deepest discount, the least flexibility. Right for stable workloads where you know exactly what you'll be running.

For most organizations that aren't in a static, fully-committed state, a mix works well: Compute Savings Plans for the baseline EC2/Lambda/Fargate spend, Reserved Instances for known stable configurations.

## The coverage vs utilization trade-off

There are two metrics that matter for committed use discount programs:

**Coverage**: what percentage of your on-demand spend is covered by commitments? Higher is better, but not at the cost of committing to things you won't use.

**Utilisation**: what percentage of your commitments are actually being used? An unutilised Reserved Instance is wasted money. 100% utilization means you're using everything you committed to.

The goal: high coverage on stable workloads, high utilization by not over-committing. These are in tension — pushing for higher coverage increases the risk of under-utilization.

Set your coverage target from the stable portion of hourly demand. Model utilisation after a downsizing or migration, then buy incrementally once you know the commitment survives those changes.

## The right cadence for reviewing commitments

Commitments should be reviewed quarterly:
- Are any 1-year commitments expiring in the next 90 days? Decide whether to renew.
- Has utilization dropped below 80% on any commitment? Investigate — workload may have migrated.
- Are there significant on-demand costs that have now stabilised enough to commit?
- Has the cloud provider released new instance types in the family that would suggest the current shape is being phased out?

The cloud providers' own tools (AWS Cost Explorer's RI recommendations, Azure Advisor's reservation recommendations) generate recommendations based on usage data. These are useful starting points, but review them with the context of your roadmap — the tools don't know you're planning to move the workload off EC2 next quarter.

## The AWS Marketplace for unwanted RIs

If you have Reserved Instances you're not using, AWS's Reserved Instance Marketplace allows you to sell them to other AWS customers. The discount from the original purchase may be partially recovered. This is worth knowing about before you commit to a 3-year Reserved Instance for a workload you're not fully confident about — an exit exists, but it's not guaranteed (demand in the marketplace varies by instance type and region).

*Building a commitment strategy for your cloud spend? The right cadence and analytical approach matter more than any individual tool. [Happy to think through your specific situation.](/contact/)*

## Build a portfolio replay before buying another commitment

Build the replay from an hourly usage window and dated purchase inventory. For each commitment, record scope, effective and expiry dates, eligible resource configuration, term, payment option, current rates, and any sharing policy. For each hour, price the same workload under the On-Demand reference, the current portfolio, and each proposed portfolio. Compare exactly the same usage with and without the purchase. The system must know when one benefit has already applied so another cannot be credited for covering it.

Keep the purchase view separate from the usage quantity view. A resource commitment may need an eligible family, platform, scope, and normalized units. A spend commitment is consumed at the applicable discounted rate in an hour. Translate carefully and use the provider's current matching rules instead of assuming every product follows the same policy. AWS publishes [EC2 Reserved Instance application rules](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/apply_ri.html) and [Savings Plans coverage calculations](https://docs.aws.amazon.com/savingsplans/latest/userguide/ce-sp-cr-metrics.html). Operational flexibility, discount matching, and access to capacity deserve distinct columns.

Test an expiry by running the same hour just before and after the end date. Test a sharing change, one missing account, an hour of zero usage, and a burst larger than your proposed commitment. Look for impossible outcomes such as negative uncovered usage, coverage above the eligible amount, or savings assigned to usage that was already covered. Reconcile a few past hours to realized discounts before trusting the forecast about future hours.

## Run a demand loss scenario with actual arithmetic

Take an illustrative estate with 100 eligible compute units each hour and a hypothetical On-Demand rate of $0.10 per unit-hour. A 75-unit resource commitment costs $0.065 per unit-hour and is paid for whether used or not. At 100 units, the committed portion costs $4.875, the uncovered portion costs $2.50, and the total is $7.375 instead of $10. Coverage is 75% by comparable On-Demand cost in this homogeneous example, and utilization is 100%.

Now assume a migration takes away 40 units. The estate runs 60 each hour. All 60 find coverage, but fifteen committed units remain idle and utilization falls to 80%. The estate still pays $4.875 per hour, versus $6 On-Demand. The deal still saves money. As demand falls below about 49 units, the purchase costs more than On-Demand at these assumed prices. Keep that break-even alongside the utilization target so a change in utilization does not automatically get described as a loss of economic value.

Repeat the same scenario for alternatives. A 50-unit commitment would pay $3.25 and leave ten On-Demand units in the 60-unit case, for $4.25 total. It gives up some savings if demand stays at 100, but protects against a larger migration. If new work is ineligible, include its On-Demand cost independently. Show the size of both the upside given up and the loss avoided rather than relying on a single coverage score.

## Use the workload roadmap like another data source

Ask service owners for dated plans that could change eligibility. The items that matter are architecture milestones, region moves, changes to operating system or tenancy, a platform migration, and major retirement dates. Record confidence and an owner for each assumption. A spreadsheet note saying that the estate is stable is hard to use after an acquisition or an engineering decision changes the plan.

Hold out one past interval and see whether candidate portfolios still work. A low period that represents a genuine recurring pattern belongs in the model. An outage, closed account, or missing export also appears low, but represents something else. Label those intervals before deciding whether to include or exclude them. Test growth and contraction separately. A commitment that survives high growth through uncovered On-Demand charges can still lose if baseline demand vanishes.

Use a small approval record with a decision deadline, unused-spend limit, latest buy date, and next checkpoint. Identify which future decision could reduce the unused commitment. If the answer is a resale or exchange, price the downside scenario as if no transaction happens. The [EC2 Reserved Instance Marketplace documentation](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ri-market-general.html) restricts resale to qualifying Standard EC2 reservations and specifies other conditions. A possible listing is not evidence of a buyer, a price, or a timely exit.

## Compare cash, economic cost, and usage separately

A prepaid commitment can make one invoice spike even though its consumption economics improve over its term. Track the payment on the cash timeline and attribute the recognized cost over the usage periods appropriate to the report. Keep the current reference rates in the forecast and write down their source. For scenario comparison, use the same quote dates and the same amount of service delivered. A discount percentage is not meaningful if two scenarios use different instance shapes and deliver different capacity.

After a purchase, measure the portfolio against the model when the first close is ready. Review saved spend after unused commitments and compare the underlying service outcome to the baseline. Lower spend from a service that stopped running is a usage change, not evidence that the selected reservation was a good one. In a renewal review, keep the existing portfolio distinct from the next commitment. The fact that a contract expires next month says nothing about whether its original workload still qualifies.

Set an explicit counterfactual for proposed reservations that also simplify disaster recovery planning. Test whether placement succeeds in the intended zone when the workload restarts, and price the capacity guarantee separately from the billing benefit. If the placement requirement disappears after a redesign, a technically successful purchase can still become the wrong choice at renewal. Keep those observations in the same approval record as the costs.
