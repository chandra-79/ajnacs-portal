---
title: "Database Migration Strategies: Moving Production Data Without Downtime"
description: "Zero-downtime database migrations are possible but require discipline — dual-write patterns, schema compatibility phases, and a rollback plan that you've actually tested. Here's what works at production scale."
date: 2025-07-01
tags: ["Data Engineering", "Cloud Architecture", "Engineering Leadership"]
format: article
---

The migration that causes an outage is usually not the one that failed — it's the one that succeeded but not in the way anyone expected. A column renamed. A constraint applied. A backfill that took six hours instead of forty minutes.

Zero-downtime database migrations are achievable, but they require treating schema changes and data movement as distinct operations with distinct risk profiles.

## The core principle: schema changes must be backward compatible

The fundamental constraint: at any point during a deployment, both the old version of the application and the new version must be able to read and write the database correctly. This rules out a large category of apparently simple changes:

- Renaming a column breaks the old version immediately
- Adding a NOT NULL column without a default breaks any insert from the old version
- Dropping a column that the old version still reads causes errors
- Changing a column type without a compatibility guarantee breaks queries

The solution is to decompose "rename a column" into a sequence of backward-compatible steps:

1. Add the new column (nullable, old version ignores it)
2. Deploy code that writes to both old and new columns
3. Backfill the new column from the old column
4. Deploy code that reads from the new column, writes to both
5. Verify the new column is complete and correct
6. Deploy code that only uses the new column
7. Drop the old column (now unreferenced)

This takes longer. It requires multiple deployments. It's the only approach that doesn't carry downtime risk.

## The expand/contract pattern

The formalization of this approach is called expand/contract (also called parallel change):

**Expand phase**: add new structure alongside old structure. New columns, new tables, new relationships. Old code continues to work. New code can optionally use the new structure.

**Migrate phase**: backfill data, run dual-writes, verify correctness. The database contains both old and new representations simultaneously.

**Contract phase**: remove old structure once all code has migrated to the new representation and old structure is confirmed unused.

The contract phase is where most teams skip steps. Dropping a column that "nobody is using anymore" without confirming via query analysis or feature flags is how you get 3am incidents.

## Backfill strategy for large tables

Backfilling a column on a 50-million-row table with a single UPDATE statement will:
- Lock rows for the duration
- Generate a large amount of WAL/redo log
- Potentially cause replication lag
- Potentially trigger autovacuum contention on PostgreSQL

The correct approach is batched backfill:

```sql
-- PostgreSQL batch backfill with row-level targeting
DO $$
DECLARE
  batch_size INT := 10000;
  last_id BIGINT := 0;
  max_id BIGINT;
BEGIN
  SELECT MAX(id) INTO max_id FROM orders;
  WHILE last_id < max_id LOOP
    UPDATE orders
    SET new_column = derive_value(old_column)
    WHERE id > last_id AND id <= last_id + batch_size
      AND new_column IS NULL;
    last_id := last_id + batch_size;
    PERFORM pg_sleep(0.1); -- brief pause to reduce contention
  END LOOP;
END $$;
```

Key parameters to tune:
- **Batch size**: 1,000–50,000 rows depending on row width and index contention
- **Sleep interval**: 50–200ms to let replication catch up and reduce lock contention
- **Idempotency**: the `AND new_column IS NULL` guard means the script can be rerun safely if interrupted

Track progress with a dedicated monitoring query:

```sql
SELECT
  COUNT(*) FILTER (WHERE new_column IS NOT NULL) AS migrated,
  COUNT(*) AS total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE new_column IS NOT NULL) / COUNT(*), 1) AS pct
FROM orders;
```

## Online schema change tools

For MySQL, Percona's `pt-online-schema-change` or GitHub's `gh-ost` handle the shadow table pattern automatically:

- Create a shadow table with the new schema
- Set up triggers to replicate ongoing changes
- Copy existing rows in batches
- Perform a near-instant table swap when caught up

`gh-ost` is generally preferred for production use because it uses binary log streaming rather than triggers, which avoids the write amplification problem with trigger-based approaches on high-write tables.

For PostgreSQL, `pglogical` replication or manual expand/contract is the standard approach. The `pg_repack` extension handles CLUSTER and VACUUM FULL equivalents online, but schema changes still require the manual pattern.

## Cross-database migrations

Moving data between database engines (Oracle to PostgreSQL, SQL Server to Aurora) adds complexity:

**Data type mapping**: Oracle's VARCHAR2, DATE, and NUMBER types don't map cleanly. NUMBER(10) might be INTEGER, BIGINT, or DECIMAL depending on context. DATE in Oracle includes time; in PostgreSQL it doesn't.

**Procedural code**: PL/SQL doesn't port directly to PL/pgSQL. Function signatures, exception handling, cursor patterns, and built-in functions all differ. This code requires manual rewrite and testing, not automated conversion.

**Sequence behavior**: Oracle sequences and PostgreSQL sequences behave differently around caching and session-level allocation. Applications that depend on sequence monotonicity need explicit attention.

The migration phases for cross-database moves:

1. **Schema conversion**: automated tools (AWS Schema Conversion Tool, ora2pg) handle the mechanical parts. Manual review handles the edge cases, which are numerous.
2. **Initial load**: bulk transfer of historical data, typically via CSV export/import or a dedicated ETL tool.
3. **CDC (Change Data Capture)**: ongoing replication of changes during cutover preparation. AWS DMS, Debezium, or Striim are common options.
4. **Cutover**: stop writes to source, verify CDC has caught up, redirect application connections to target, verify, open writes to target.

The cutover window is the exposure period. For most production systems, a 15–30 minute cutover window (stop writes, verify, redirect, verify again) is achievable with proper preparation.

## Testing the rollback

The rollback plan that hasn't been tested is not a rollback plan. Before any significant migration, verify:

- The rollback procedure takes less than the defined RTO
- The rollback leaves data in a consistent state (dual-write helps here — the old table is still current)
- Someone has executed the rollback in a staging environment recently enough that it reflects the current schema state

The most common rollback failure mode: the rollback assumes the old schema still exists, but the contract phase already removed it.

*Working through a database migration with a tight cutover constraint? The sequencing of expand/contract phases is where most of the risk sits. [Happy to think through the specific trade-offs.](/contact)*
