# Ajna's 90-day editorial plan

The [Field Guides](https://ajnacs.com/field-guides/) group the work around SRE toil, platform onboarding, and cloud cost per unit. Readers can find each guide, calculation worksheet, example inputs and measurement method on a single stable URL. Review changes to the guides in place and use the public RSS feed for recurring updates.

## Days 1–30 · Publish the tools and establish a baseline

- Confirm that Search Console reports the preferred HTTPS canonical for each guide. Export the last 28 complete days of Web results for each canonical page. Record clicks, impressions, the reporting interval, export date, filters and indexing state in the [scoreboard](search-console-scoreboard.csv). Keep zero observed traffic distinct from unavailable property data.
- Check mobile navigation, guide discovery, heading links and accessible charts. Verify the example calculations against their CSVs. Link relevant Insights, Series and case-study pages to the closest guide.
- Pick one delivery question per topic. Confirm rights to publish derived observations and agree on time windows, measures, aggregation rules and limitations before analysing the results.

## Days 31–60 · Collect and review measurements

- Toil: log hands-on person-minutes across comparable on-call windows. Check task volume, unplanned upkeep, exceptions, SLOs and effort transferred to adjacent teams.
- Onboarding: define the eligible cohort, common mandatory controls, start and stop events and a fixed observation window. Report completion counts and median time among completed attempts with opt-outs and support effort.
- Cost: reconcile allocated and unallocated costs to billing and tie deduplicated completed units to stable service and time scope. Test a second allocation driver and record how much the rate changes.
- Have a second person reproduce the calculations from publishable inputs. If approval or data is unavailable, retain the clearly labelled synthetic example. Keep the observation scope and sample size visible wherever a finding is shown.

## Days 61–90 · Publish results and review search performance

- Publish a dated update to each guide that has approved, reproducible data. Include sources, collection dates, filters and exclusions, units, denominators, and known limitations. Update RSS with meaningful changes and link the current guide from matching series and older articles.
- Capture a second 28-day window using the same canonical and filters. Search Console assigns most clicks and impressions to canonical URLs. In the scoreboard report clicks and impressions first, calculate CTR as clicks divided by impressions for each period, and report CTR change in percentage points. Leave rates blank when impressions are zero and mark missing exports explicitly.
- Choose the next editorial change from the evidence. Check indexing and discovery before interpreting low impressions. For visible pages, review query intent and snippets before changing titles. Use week-over-week or year-over-year context where available and account for seasonality. Search Console totals measure search exposure and clicks, so keep reader feedback and RSS engagement separate.

## Publication references

- [Cloudflare Radar](https://radar.cloudflare.com/) publishes measurements alongside definitions and scope. Pair each Ajna chart with its source inputs and method.
- [Martin Fowler's architecture archive](https://martinfowler.com/architecture/) organises durable material by topic. Keep canonical paths stable and update the guide when its evidence changes.
- [The Pragmatic Engineer newsletter](https://blog.pragmaticengineer.com/newsletter/) gives readers an ongoing reason to return. Use Ajna's RSS feed for guide updates and review audience demand before introducing an email edition.
- [Google Search Console performance documentation](https://support.google.com/webmasters/answer/7576553) defines impressions, clicks, CTR, filtering and canonical attribution.
