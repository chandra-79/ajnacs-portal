---
title: "Your Data Pipeline Has Schema Assumptions Nobody Documented"
description: "Every data pipeline has implicit contracts about field names, types, nullability, and value ranges. When upstream systems change and those contracts break, the failure is silent and the debugging is painful."
date: 2028-10-16
tags: ["Data Engineering", "Infrastructure"]
format: article
---

Data pipelines fail in a distinctive way. The pipeline itself keeps running. No errors are thrown. The data flows. But somewhere downstream, a dashboard shows impossible numbers, a model produces nonsense predictions, or a report is missing a dimension that should be there.

The pipeline did not break. The implicit schema contract broke.

## What schema assumptions look like in practice

Every pipeline that reads a data source makes assumptions:

- This field called `status` contains values: active, inactive, pending
- This `user_id` field is never null
- This `amount` field is always in USD, not local currency
- This `timestamp` field is in UTC
- This `event_type` field uses underscores, not hyphens

None of these are enforced. None of them are documented. They exist as assumptions in the code that processes the data, in the transformations that rely on specific value ranges, in the dashboard filters that expect specific string values.

When the upstream system adds a new status value — `suspended` — the pipeline continues running. The transformation that maps status to a binary active/inactive column silently puts `suspended` customers into the inactive bucket. The churn analysis is wrong. Nobody knows why.

## Where the problem lives

The problem is not that upstream systems change. They change constantly, appropriately, for their own valid reasons. The problem is that the dependency between the pipeline and the upstream system's schema is implicit.

An implicit dependency breaks silently. An explicit dependency fails loudly.

## Making it explicit

**Schema validation at ingestion.** Validate incoming data against an explicit schema before it enters the pipeline. Use tools like Great Expectations, dbt tests, or Pandera to assert that fields are present, types match, values fall within expected ranges, and nullability constraints hold. When the upstream changes, the pipeline fails at the ingestion step with a clear error, rather than producing wrong results silently.

**Documented data contracts.** A data contract is a formal agreement between the producer and consumer of data: here is the schema, here are the field semantics, here is the expected value distribution, here is the notification process when changes are planned. Contracts exist between teams, not just in code.

**Consumer notification in the change process.** When a team changes a shared data source, they should know who depends on it and notify them. This requires a data catalog that records lineage — which datasets read from which sources, which pipelines depend on which tables.

The debugging session that traces a wrong dashboard number upstream through three transformations to a new status value in a source system that changed six weeks ago is preventable. The prevention is not hard. It requires making the implicit explicit.
