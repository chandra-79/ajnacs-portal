---
title: "MongoDB Aggregation Pipeline: Practical Patterns for Enterprise Data Processing"
description: "The MongoDB aggregation pipeline is more powerful than most teams use it. Here are the patterns for real data processing tasks — multi-stage transformations, lookup joins, group-and-project pipelines, and the performance considerations that matter at scale."
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

The key performance rule: `$match` and `$sort` at the beginning of a pipeline, before any transformation stages, can use indexes. `$match` after `$project` or `$unwind` cannot use indexes — it's filtering the intermediate result set. Always filter first.

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

**The performance caveat**: `$lookup` creates an index scan on the joined collection for each document in the pipeline. Ensure the `foreignField` is indexed. Without an index on `customers._id` (which is indexed by default on `_id`, but not on arbitrary fields), the lookup is a full collection scan for each document.

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

`$unwind` multiplies documents — a 1000-document collection where each document has an average of 10 array elements becomes 10,000 intermediate documents after `$unwind`. Be aware of memory usage with `allowDiskUse: true` for pipelines that exceed the 100MB memory limit.

## $group patterns beyond count-and-sum

**Bucketing**: group numeric values into ranges

```javascript
{
  $bucket: {
    groupBy: "$orderTotal",
    boundaries: [0, 50, 100, 250, 500, 1000],
    default: "1000+",
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
          default: "250+"
        }}
      ],
      totalCount: [
        { $count: "count" }
      ],
      page: [
        { $sort: { createdAt: -1 } },
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
db.orders.aggregate([...]).explain("executionStats")
```

Look for `IXSCAN` (index scan) rather than `COLLSCAN` (collection scan) in the query planner output.

For very large datasets, materialised views — maintained collections updated by scheduled aggregation pipelines — are more efficient than running complex aggregations on demand.

*Optimising a slow aggregation pipeline or designing a new data processing workflow in MongoDB? [Happy to look at the specifics.](/contact)*
