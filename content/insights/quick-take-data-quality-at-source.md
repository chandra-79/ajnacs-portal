---
title: "Data Quality Problems Are Upstream Problems. Fixing Them Downstream Is Expensive."
description: "Every hour spent cleaning data downstream represents a failure to fix the source system that produced bad data. The cost compounds. Here is why upstream fixes are always the correct investment."
date: 2028-10-13
tags: ["Data Engineering", "Engineering Leadership"]
format: article
---

The data engineering team has a cleaning layer in the pipeline. It strips malformed values, coerces types, fills in missing fields with defaults, and normalises inconsistent spellings. The layer is large, carefully maintained, and constantly growing.

This is not data quality. This is data repair. The distinction matters because repair solves the symptom and leaves the cause in place.

## Why downstream fixes compound

Every downstream system that consumes the data has to either trust the cleaning layer completely or implement its own defensive logic. When the cleaning layer misses a new pattern — and it always eventually misses something — the bad data propagates to every consumer simultaneously.

The cleaning layer grows because the source system continues to produce bad data. Each new pattern requires a new cleaning rule. Each cleaning rule is a maintenance burden. Each consumer that relies on the cleaning layer is betting that the cleaning layer is complete and correct.

The total cost of downstream cleaning — engineering time to build and maintain the cleaning layer, consumer-side defensive logic, debugging time when the cleaning layer fails to catch a new pattern, downstream impact when bad data reaches consumers — almost always exceeds the cost of fixing the source.

## Why source fixes are harder but correct

The source system usually belongs to a different team. Fixing it requires coordination, agreement on what correct data looks like, testing of the fix in the source system's context, and often changes to the source system's UI or business logic.

This is why the downstream cleaning layer exists in the first place. It was faster to clean the data than to negotiate a fix with the upstream team. That trade-off was correct in the short term. Maintained indefinitely, it becomes progressively more expensive.

## The conversation that needs to happen

The data engineering team and the source system team need a shared definition of what correct data looks like. This is usually expressed as a data contract: field types, nullability constraints, value ranges, enumeration values.

Once the contract exists, the source system team can validate against it before writing data. Data that fails validation fails loudly at the source, rather than silently becoming a cleaning rule downstream.

This conversation is harder than writing another cleaning rule. It is also the only thing that reduces the size of the cleaning layer over time rather than increasing it.

Every cleaning rule you write is a debt payment on a problem you have not fixed.
