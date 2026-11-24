---
title: "Recommendation Systems in Production: The Architecture Behind 'You Might Also Like'"
description: "Design recommendation retrieval, ranking and policy stages around feature freshness, cold-start behavior, online evaluation and measurable failure modes."
date: 2027-09-27
tags: ["AI & MLOps", "Architecture", "Data Engineering", "Product Engineering"]
format: article
---

Recommendation is one established application of machine learning at scale — not the flashy generative tier but the quiet systems deciding which products, articles, videos, or accounts appear in which order, millions of times daily, with revenue moving on single-digit relevance improvements. The field converged years ago on a production architecture whose shape is worth knowing even if you buy rather than build, because the shape explains the operational questions — freshness, cold starts, feedback corruption — that arrive regardless of whose models run inside.

## The two-stage shape: retrieve cheap, rank expensive

The defining constraint: scoring every item can exceed the latency or cost budget for very large catalogs (millions of items × a model of any sophistication × the latency budget), so production recommenders decompose into a funnel: **candidate retrieval** (from millions to hundreds, in milliseconds — multiple cheap sources fanned out and unioned: embedding-similarity lookup via the vector-index machinery, collaborative signals — users-like-you engaged with these, popularity and recency pools, and the business-rule feeds like "new from brands you follow"), then **ranking** (hundreds to dozens: the heavyweight model — gradient-boosted trees historically, increasingly neural — scoring each candidate against the full feature context: user history, item attributes, session signals, context like time and device), then **re-ranking/policy** (the final ordering pass where product reality lives: diversity injection so the feed isn't ten variants of one thing, exploration slots per the bandit logic below, freshness boosts, and the business constraints — sponsored placement, category quotas, the compliance filters). The layering mirrors every performance funnel in this series: cheap-and-recall-oriented early, expensive-and-precision-oriented late — and its operational corollary is that *retrieval and ranking fail differently* (a retrieval gap means the right item never got considered; a ranking miss means it was considered and mis-scored — the diagnosis fork that directs all model debugging, and the reason offline evaluation must measure the stages separately).

## The data layer: features, freshness, and the two clocks

Models are one part of a recommender; feature machinery creates substantial engineering responsibilities — and it runs on two clocks. **Batch features** (user's 90-day category affinities, item quality scores — computed on the warehouse rhythm via the pipeline disciplines) and **real-time features** (this session's clicks, the item's last-hour engagement velocity — the stream-processing tier, with session windows doing exactly what they were built for), converging in the **feature store** whose defining contract is *train/serve consistency*: the feature computed one way in the training pipeline and subtly differently in the serving path is the field's signature silent bug (the skew that makes offline gains evaporate online), and the store can help manage consistent definitions and point-in-time retrieval, but does not guarantee consistency automatically. Freshness is a product property here, not just a data-quality metric: the recommender that doesn't know what you did thirty seconds ago feels broken to users in interactive contexts ("I just bought a lawnmower; stop showing lawnmowers" is the canonical complaint, and its fix is the real-time feature path plus re-ranking rules — the staleness-budget honesty from every derived-store discussion, with UX stakes).

**Cold starts** are the permanent boundary condition, in both directions: new *users* (no history — the fallbacks: contextual signals and explicitly supplied preferences, popularity tiers, and the onboarding flows that buy signal explicitly) and new *items* (no engagement — content-based features carry them: embeddings from descriptions/images via the modern encoder tier, which is where LLM-era representation quietly upgraded a classic weakness; plus deliberate exploration traffic to gather the engagement the ranker needs). Exploration deserves its explicit budget — the bandit framing (a small percentage of slots serving uncertainty-reduction rather than exploitation) is the recommender's version of the error-budget trade, and skipping it produces the rich-get-richer stagnation where yesterday's winners are the only things with enough data to win today.

## The feedback loops: where recommenders corrupt themselves

The recommender's distinguishing operational hazard: **it trains on data it generated**. Position bias (items shown first get clicked more, which trains the model that they deserve first — the self-fulfilling ordering; mitigations: position-aware modeling, logged propensities, randomization budgets), popularity spirals (the exploration-starved variant above), and the metric traps — optimizing click-through discovers clickbait; optimizing watch time discovers autoplay abuse; the honest objective is a *balanced scorecard* (engagement plus longer-horizon signals — retention cohorts, satisfaction proxies, diversity health metrics) with the online experimentation machinery as the arbiter (offline gains need confirmation against the intended online outcome — the recommender is the system that made interleaving and holdout discipline mandatory). The governance layer arrives with scale: recommendation is increasingly regulated surface (transparency obligations, the filter-bubble critiques, per-market rules on amplification), and the audit-trail question — *why was this recommended?* — needs an answer at the logging layer (the decision record with retrieved-from-which-source, ranked-with-which-features — the explainability plumbing built before the regulator or the PR crisis asks).

The build-vs-buy calibration follows the core-context line: retrieval infrastructure and feature stores are commodity (the vector-database and streaming tiers — buy or adopt); the ranking objective and the re-ranking policy — where your business's definition of "good recommendation" lives — are the differentiating core that stays yours. And the honest starting point for teams entering the space: the two-stage architecture with a boring gradient-boosted ranker over well-engineered features, shipped with proper experimentation and freshness plumbing, provides a useful baseline against more complex models and feature pipelines — the recurring lesson of every applied-ML chapter, at the layer where it was learned first: the pipeline is the product; the model is a tenant.

## Define relevance before choosing the model

A knowledge portal should recommend articles that help a reader complete a learning task, not merely articles whose headlines attract clicks. A commerce site may need to recommend available, suitable products with acceptable return rates. The same retrieval-and-ranking architecture can optimize very different objectives. State which outcomes count as useful and which constraints must hold regardless of predicted engagement.

For an editorial portal, a candidate can be relevant but inappropriate because the reader has already completed it, lacks a prerequisite or cannot access it. Some exclusions belong before retrieval, especially authorization and availability. Others belong in final policy, such as avoiding four nearly identical articles in adjacent positions. Keep the reason for exclusion so poor coverage can be diagnosed rather than blamed vaguely on the model.

A simple content-based or popularity baseline is valuable. It reveals whether personalized ranking adds enough benefit to justify new data collection, serving complexity and evaluation cost. Small catalogs may be scored directly without a separate approximate retrieval tier. Architecture should follow the scale and latency requirement rather than copying the largest published system by default.

## Worked example: locate the missing relevant items

Suppose a synthetic evaluation has 100 reader sessions, each with one independently labelled relevant next article. Candidate retrieval includes that article in 82 sessions. Ranking places it in the first five positions in 65 sessions. The final eligibility and diversity pass retains it in 60 sessions. The chart shows 100 labelled opportunities, 82 retrieved, 65 ranked in the top five and 60 displayed.

Candidate recall is 82/100, or 82%. End-to-end top-five coverage is 60/100, or 60%. Conditional ranking success among retrieved cases is 65/82, approximately 79.3%. The policy stage removes five of those 65, about 7.7%. Some removals may be correct, such as when an article is no longer available; the label set then needs to reflect eligibility at the time of the decision.

These counts are hypothetical and do not estimate reader satisfaction. They demonstrate why a ranking improvement cannot recover an item that retrieval never supplied. Inspect the eighteen retrieval misses separately from the seventeen cases retrieved but not ranked in the top five. A more powerful ranker is the wrong first intervention if most failures arise from missing or stale candidates.

The label construction also matters. If the "relevant" item is simply the one historically clicked, it reflects what the old system exposed and where it placed it. Independent judgments, controlled exploration or carefully designed experiments can provide additional evidence. Treat historical engagement as a biased observation rather than a complete list of what each reader would have preferred.

## Freshness and feature consistency

Separate event time from processing time. A click that arrives late should not be treated as a new preference solely because it entered the pipeline recently. Store timestamps and deduplication identifiers so retries do not inflate engagement. Define how long the serving system can use stale features and what fallback applies when updates lag.

Feature consistency means more than using the same column name in training and serving. Window boundaries, missing-value defaults, time zones and entity joins can differ. Build a test that reconstructs historical feature values as they would have been known at the recommendation time. Using a future purchase or later popularity count in training leaks information unavailable during serving.

For new readers, ask whether personalization is needed at all before requesting demographic data. Context such as the current article, declared topic interest and language may support a useful first recommendation. For new content, descriptive features and a bounded exploration policy can create exposure without pretending that a fresh item has a reliable engagement estimate.

## A practical ranking lab

Create a synthetic catalog of thirty articles with topic, level, prerequisite, publication status and estimated reading time. Define ten reader sessions with current topic and completed articles. Write relevance labels before implementing ranking. Include a reader who needs an introductory explanation and another who needs a runnable lab on the same topic.

Implement a simple candidate pool using topic overlap, then apply a scoring rule and eligibility filters. Record the candidate set at each stage. Change one feature, such as prerequisite completion, and verify that the ordering changes for the intended reason. This small deterministic exercise teaches the contract before introducing a learned model whose failures are harder to interpret.

The worksheet should include session identifier, eligible catalog, retrieved items, scores, policy exclusions and displayed positions. Add a test in which an article becomes unavailable between retrieval and display. The final response should remove it and fill the slot appropriately, rather than exposing a dead link. This is an operational correctness requirement independent of predictive quality.

For a learned extension, split data by time and keep users or related sessions together where necessary to avoid leakage. Compare against the simple rule using the same eligible candidates. Do not report a gain from a model that receives richer future information than the baseline. Publish dataset limitations and the precise definition of a successful recommendation.

## Online experiments and failure handling

An online test needs a stable assignment unit, such as reader account or browser session, and a predeclared duration. Switching a reader between variants during one task can contaminate the comparison. Monitor content availability, latency, explicit negative feedback and downstream completion alongside clicks. A short-term click increase can coexist with lower satisfaction or less useful learning.

Exploration should be bounded by product constraints. A learning portal can show a new article within the reader's chosen subject without randomly recommending irrelevant content. Log selection probabilities only when the serving policy actually provides them accurately; fabricated propensities invalidate later counterfactual calculations.

When personalization fails, serve a useful fallback with clear topic continuity. Cache public recommendations where appropriate, but invalidate unavailable content and avoid mixing private reader state across users. The operational goal is a service that remains navigable when the model or feature pipeline is unavailable. A recommendation system earns trust through relevant paths that work, not through the sophistication of its ranking model alone.

## Sources and further study

- [Covington et al. — Deep Neural Networks for YouTube Recommendations](https://research.google/pubs/deep-neural-networks-for-youtube-recommendations/)
- [TensorFlow Recommenders — Retrieval tutorial](https://www.tensorflow.org/recommenders/examples/basic_retrieval)
- [Breck et al. — The ML Test Score](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/)
