# Count bad events before spending the error budget
@lesson error-budget-accounting | Define eligible requests and compute an error budget from the counts users actually experienced.
@chart The cost of averaging window rates | % bad
@value Busy window | 0
@value Quiet window | 10
@value Wrong unweighted mean | 5
@value Aggregate bad rate | 0.1
@match error budget | service level objective | successful requests | valid events | availability | sli
@source Google SRE Workbook · Implementing SLOs | https://sre.google/workbook/implementing-slos/

## Define the population

Suppose a service promises that 99.9% of eligible requests succeed over 30 days. Write down the event that supplies the denominator. An eligible event is an external user request observed at the serving boundary. Decide how to handle deliberate rate limits, internal probes, client cancellation, and client retries. Make the rules consistent between the numerator and denominator. A service that cannot see client-side timeouts may need a synthetic probe or client instrumentation to avoid claiming higher reliability than users experience.

## Work the numbers

The busy window has 9,900 good events out of 9,900. The quiet window has 90 good events out of 100. Divide total bad events by total eligible events: 10 ÷ 10,000 = 0.1%. Averaging the two window bad rates would report 5%, a 50-fold overstatement. Over the combined sample a 99.9% objective allows 10 bad events, so this example uses the entire budget.

Count events in the window before computing rates. In a dashboard, sum numerator counters and denominator counters independently. At zero eligible traffic the ratio is unknown. Expose that condition separately so a missing scrape or an empty service does not present a green SLO.

## Limits of the example

These are example requests, not traffic measurements. A request-weighted SLI can hide a low-volume tenant's failure. Check regional or tenant cohorts when the promise applies to them individually. Copy the denominator contract into the alert and incident review.

# Turn a burn rate into an alert you can rehearse
@lesson burn-rate-alerts | Calculate time to budget exhaustion and test the long and short alert windows against a traffic trace.
@chart Time to consume a 30-day budget | hours
@value 1× burn | 720
@value 6× burn | 120
@value 14.4× burn | 50
@value 30× burn | 24
@match burn rate | short window | alert fatigue | paging | alert threshold | error budget
@source Google SRE Workbook · Alerting on SLOs | https://sre.google/workbook/alerting-on-slos/

## Derive the threshold

For a 99.9% request SLO, the allowable bad fraction is 0.001. A 1.44% observed bad fraction burns at 14.4×. With constant traffic and failure fraction, a full 720-hour budget then lasts 50 hours. To page for roughly 2% of the budget spent in an hour under those same assumptions, solve B = 0.02 × 720 ÷ 1 = 14.4.

## Build a replay

Suppose the one-hour window has 1,600 bad requests out of 100,000. The observed burn is 16×. If only three of the last 5,000 requests failed, the short window burns at 0.6×. A page that requires the 14.4× threshold in both windows remains quiet, because the historical incident has stopped. If 100 of those 5,000 fail, the short window rises to 20× and the same rule pages.

Run the same trace through a slower pair, such as six hours and 30 minutes at 6×. Test both beginning and end of each incident, no data, and unusually low traffic. Scope alerts by the same service labels as the SLI and avoid dividing by scraped zeros.

## Limits of the example

Assumptions about traffic shape matter. A 14.4× hour during peak traffic need not consume exactly 2% of the real 30-day request budget. Measure cumulative bad events against the actual budget in addition to watching burn. Start with these thresholds and calibrate paging cost and incident coverage during replay.

# Decide when a retry is worth the added load
@lesson retry-load-budget | Put a ceiling on retry traffic and test it against dependency saturation before deploying it.
@chart Dependency attempts for 1,000 requests | attempts
@value One attempt | 1000
@value 5% retried once | 1050
@value Three nested layers | 27000
@match retry | retries | idempotency | retry storm | backoff | timeouts
@source AWS Builders’ Library · Timeouts, retries and backoff with jitter | https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/

## Establish the threat to availability

Retries add work to a dependency precisely when it may have the least spare capacity. In this example, 1,000 original requests each have one dependency call and 5% get exactly one retry. That is 1,050 attempts, before measuring whether the additional 50 requests actually recovered anything. If an application instead permits three attempts at each of three nested layers, the worst-case amplification is 3³ = 27 attempts per original request. This is a ceiling for the chosen topology, not an expected load.

## Test one authority for retries

Put retries at one layer with enough context to decide whether the operation can be repeated. For a write that might have committed before a timeout, require a stable idempotency key and define what a duplicate receives. A successful response can be recovered from a deduplication record. A duplicate with a conflicting payload should fail instead of silently changing the original result.

In a replay, increase dependency latency while keeping the deadline fixed. Give retries an attempt cap and a shared budget. Track completed original transactions, dependency attempts, queued time, duplicate effects, and time spent waiting after the last useful retry. Compare against no retries at the same arrival rate. Keep the policy only if successful transactions rise at acceptable tail latency and dependency load.

## Limits of the example

The example counts exclude hedges and background work. Correlated failures make repeated attempts much less useful than a model that assumes each attempt is independent. Capacity tests must include the longest retry-after interval and mixed workloads sharing the dependency.
