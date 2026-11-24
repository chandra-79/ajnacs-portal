---
title: "MongoDB Aggregation Pipeline: Practical Patterns for Enterprise Data Processing"
description: "Build MongoDB aggregations with selective predicates, controlled joins and bounded results, then inspect explain output and memory limits."
date: 2027-10-08
tags: ["Data Engineering", "MongoDB"]
format: article
---

Most teams use MongoDB's aggregation pipeline for simple count-and-group operations and reach for application-level code for anything more complex. The pipeline supports more than this — windowed aggregations, multi-collection joins, complex transformations, and conditional logic — and doing this in the database rather than application code is often faster and simpler.

Here's a practical walk through the stages and patterns that solve real problems.

## The pipeline model

An aggregation pipeline is a sequence of stages, each transforming the documents from the previous stage:

```
db.orders.aggregate([
  { $match: { status: "confirmed", createdAt: { $gte: cutoff } } },
  { $group: { _id: "$customerId", total: { $sum: "$amount" }, count: { $sum: 1 } } },
  { $sort: { total: -1 } },
  { $limit: 100 }
])
```

The key performance rule: `$match` and `$sort` at the beginning of a pipeline, before any transformation stages, can use indexes. The optimizer may move eligible filters ahead of projections; predicates depending on transformed values remain later. Inspect the optimized plan and filter early when semantics permit.

## $lookup: joining collections

`$lookup` performs a left outer join between the current collection and another:

```javascript
db.orders.aggregate([
  {
    $lookup: {
      from: "customers",
      localField: "customerId",
      foreignField: "_id",
      as: "customer"
    }
  },
  { $unwind: "$customer" }  // flatten the array to a single embedded document
])
```

**The performance caveat**: `$lookup` execution and index use depend on the join form, predicates and server version. Ensure the `foreignField` is indexed. An absent suitable foreign index can make a lookup expensive; verify the actual algorithm and examined-document counts.

For complex join conditions (multiple fields, or joining on computed values), use the pipeline form of `$lookup`:

```javascript
{
  $lookup: {
    from: "products",
    let: { sku: "$sku", tier: "$customerTier" },
    pipeline: [
      { $match: { $expr: { $and: [
        { $eq: ["$sku", "$$sku"] },
        { $in: ["$$tier", "$eligibleTiers"] }
      ]}}}
    ],
    as: "matchedProducts"
  }
}
```

## $unwind and array operations

`$unwind` deconstructs an array field, producing one output document per array element. Useful before aggregating over array contents:

```javascript
// Count total quantity by product across all orders
db.orders.aggregate([
  { $unwind: "$lineItems" },
  { $group: {
    _id: "$lineItems.productId",
    totalQuantity: { $sum: "$lineItems.quantity" },
    orderCount: { $addToSet: "$_id" }  // unique orders containing this product
  }},
  { $project: {
    totalQuantity: 1,
    uniqueOrderCount: { $size: "$orderCount" }
  }}
])
```

`$unwind` multiplies documents — a 1000-document collection where each document has an average of 10 array elements becomes 10,000 intermediate documents after `$unwind`. Inspect stage-specific memory, spill support and output limits; `allowDiskUse` does not relax every limit.

## $group patterns beyond count-and-sum

**Bucketing**: group numeric values into ranges

```javascript
{
  $bucket: {
    groupBy: "$orderTotal",
    boundaries: [0, 50, 100, 250, 500, 1000],
    default: "outside-defined-ranges",
    output: {
      count: { $sum: 1 },
      avgOrderValue: { $avg: "$orderTotal" }
    }
  }
}
```

**Accumulating arrays**: collect matching documents into an array per group

```javascript
{
  $group: {
    _id: "$customerId",
    orders: { $push: { id: "$_id", amount: "$amount", date: "$createdAt" } },
    totalSpend: { $sum: "$amount" }
  }
}
```

**Conditional aggregation**: aggregate only documents meeting a condition within a group

```javascript
{
  $group: {
    _id: "$region",
    totalRevenue: { $sum: "$amount" },
    premiumRevenue: {
      $sum: {
        $cond: [{ $eq: ["$customerTier", "premium"] }, "$amount", 0]
      }
    }
  }
}
```

## $facet: multiple aggregations in a single pass

`$facet` runs multiple independent aggregation pipelines on the same input documents and returns combined results — useful for summary statistics, count-by-category, and paginated results with total count:

```javascript
db.products.aggregate([
  { $match: { inStock: true } },
  {
    $facet: {
      categoryBreakdown: [
        { $group: { _id: "$category", count: { $sum: 1 } } }
      ],
      priceDistribution: [
        { $bucket: {
          groupBy: "$price",
          boundaries: [0, 25, 50, 100, 250],
          default: "outside-defined-ranges"
        }}
      ],
      totalCount: [
        { $count: "count" }
      ],
      page: [
        { $sort: { createdAt: -1, _id: -1 } },
        { $skip: 0 },
        { $limit: 20 }
      ]
    }
  }
])
```

A single query produces category counts, price distribution, total count, and the first page of results — no multiple round-trips required.

## $setWindowFields: sequential and ranking operations

Added in MongoDB 5.0, `$setWindowFields` enables SQL window functions — running totals, rankings, moving averages:

```javascript
{
  $setWindowFields: {
    partitionBy: "$customerId",
    sortBy: { createdAt: 1 },
    output: {
      runningTotal: {
        $sum: "$amount",
        window: { documents: ["unbounded", "current"] }
      },
      orderRank: {
        $rank: {}
      },
      movingAvg: {
        $avg: "$amount",
        window: { documents: [-2, 0] }  // current + 2 preceding
      }
    }
  }
}
```

This eliminates the need to sort and accumulate in application code for time-series and ranking operations.

## Indexing for aggregation pipelines

The stages that benefit from indexes: `$match`, `$sort`, `$group` (on the grouping field), `$lookup` (the foreign collection's join field).

The pattern for a frequently-run pipeline: create an index that matches the `$match` fields first, then the `$sort` field. Use `explain("executionStats")` to verify the pipeline is using the index:

```javascript
db.orders.explain("executionStats").aggregate(pipeline)
```

Look for `IXSCAN` (index scan) rather than `COLLSCAN` (collection scan) in the query planner output.

For repeated expensive queries, compare materialized collections against on-demand aggregation, including freshness and maintenance costs.

*Optimising a slow aggregation pipeline or designing a new data processing workflow in MongoDB? [Happy to look at the specifics.](/contact/)*

## Trace cardinality through the pipeline

A pipeline is easier to reason about when each stage has an explicit input population and expected output shape. Suppose a synthetic collection contains 1,000 orders, 100 of which are confirmed within the reporting interval. Each qualifying order contains exactly four line items, giving 400 rows after unwinding. Those items belong to twenty distinct products, so grouping by product yields twenty result documents. The figure displays 1,000, 100, 400 and 20 at those boundaries.

These are constructed counts, not performance measurements. The example explains why filtering before an expansion can reduce downstream work while still allowing the expansion to produce more documents than its immediate input. A group that returns twenty rows may nevertheless process hundreds of thousands of intermediate rows in a real workload. Measure documents examined and intermediate cardinality rather than judging cost from the final response size.

Create a fixture with the stated counts and run the aggregation through `db.orders.explain("executionStats").aggregate(pipeline)`. Keep the server version and exact pipeline with the output. Inspect the optimized plan: MongoDB can move eligible predicates ahead of projections, so source-code stage position alone does not prove which filters use an index. Predicates depending on computed values cannot simply be moved before the computation without changing their meaning.

## Preserve the intended population when joining

A lookup produces an array of matches, including an empty array when there is no matching foreign document. A subsequent default `$unwind` removes documents with missing, null or empty arrays. That means the shown lookup-plus-unwind sequence no longer retains every unmatched source order. If the report must preserve those orders, use `preserveNullAndEmptyArrays: true` and define how the missing customer is represented.

Test one matching customer, no matching customer and multiple matching foreign records where the join key is not unique. A many-to-many expansion can inflate revenue if the same order amount is summed once for each joined row. Reconcile a known total before and after the join, and separately count unmatched and multiply matched source records. A fast plan that duplicates money is still incorrect.

Foreign indexes can help a lookup, but the actual algorithm and index eligibility depend on the lookup form, predicates and server version. Examine the plan and execution statistics rather than assuming every lookup is a per-document indexed scan. Computed comparisons and array predicates need particular attention. If the relationship is consistently needed, compare a materialized reference or snapshot with the join, including the cost of keeping it correct.

## Memory and result limits are different constraints

Disk spilling is not a universal escape hatch. Stages have different limits and support for spill; `$facet` has a documented limit that `allowDiskUse` does not remove. The final output also must fit the BSON document size limit. An aggregation that pushes every order into one customer array can fail even when the server has abundant RAM. Bound arrays or produce multiple documents instead of assuming a larger machine solves every shape problem.

The example product-count pipeline uses `$addToSet` to collect unique order identifiers before counting them. That can grow with the number of orders per product. For very large populations, compare an explicit two-stage grouping by product and order, then by product, while checking the selected engine's execution and spill behavior. Both approaches require resource budgeting; neither should be called free.

The bucket examples use the neutral default label `"outside-defined-ranges"` because the default receives values outside the configured numeric ranges, potentially including negative or unexpected values. Do not rename it to `"1000+"` unless an earlier validation step establishes that all other out-of-range values are impossible. Filter or classify invalid input explicitly; a convenient label does not enforce its own meaning.

## Stable pagination and changing data

Sorting only by creation time can leave equal timestamps in an unspecified order. Add a stable unique tie-breaker for pagination. Large skips can require processing many preceding results; keyset pagination can be more appropriate when the product only needs the next page. Define how new inserts or updates between requests affect continuity rather than promising a static snapshot across unrelated requests.

Combining a count and page in a facet can provide a useful response shape, but it also couples an expensive full count to every page request. Ask whether the UI needs an exact fresh count or can display a cached count with a timestamp. Measure both alternatives against the required user experience. Avoid recomputing a costly global summary merely because it fits into one query.

### Review worksheet

For each stage, write the semantic purpose, expected cardinality, maximum document size and index assumptions. Include fixtures for empty arrays, absent join targets, duplicate join keys, null amounts and unusually large groups. Reconcile totals before and after expansion. Record execution time, examined documents, spill behavior and final response size under ordinary and skewed data.

If materializing results, define the refresh interval, source position, idempotency rule and correction process for late changes. Readers should know the result's freshness. Rebuilding a summary must not expose a half-written collection; use a supported publication mechanism and verify the transition. The pipeline becomes a maintainable data product when its correctness contract and operating envelope are documented together.

### Figure methodology

Synthetic fixture has 1,000 orders,100 qualifying orders, exactly 4 line items per qualifying order, and 20 distinct product identifiers. Stage counts are 1,000→100→400→20. This illustrates cardinality, not latency or resource consumption.

| Worked observation | documents |
| --- | ---: |
| Source orders | 1000 |
| Matched orders | 100 |
| Unwound items | 400 |
| Product groups | 20 |

## Primary references and further study

- [MongoDB aggregation optimization](https://www.mongodb.com/docs/manual/core/aggregation-pipeline-optimization/)
- [MongoDB facet limits](https://www.mongodb.com/docs/manual/reference/operator/aggregation/facet/)
- [MongoDB aggregation overview](https://www.mongodb.com/docs/manual/core/aggregation-pipeline/)
