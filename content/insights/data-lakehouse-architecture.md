---
title: "The Data Lakehouse: Why It Won, and How to Architect One That Works"
description: "Data warehouses couldn't handle unstructured data at scale. Data lakes couldn't enforce schemas or serve BI queries efficiently. The lakehouse combines both — here's the architecture, the open table formats that make it work, and the practical design decisions."
date: 2026-10-05
tags: ["Data Engineering", "Cloud Architecture", "AI & MLOps"]
format: article
---

The data landscape spent a decade in a pendulum swing. First the data warehouse (structured, governed, expensive, inflexible). Then the data lake (cheap, flexible, unstructured, ungovernable at scale). Then the simultaneous recognition that most organizations needed both: governed, structured data for BI and reporting, and scalable, flexible storage for ML and data science.

The data lakehouse is the current consensus architecture: object storage as the foundation (cheap, scalable), open table formats that add ACID transactions, schema enforcement, and query performance on top of that storage, and a separation of storage from compute.

## What to measure

**Scan bytes, freshness and compute cost.** A query scanning 40 GB after partition pruning instead of 800 GB reads 95% fewer bytes. Compare compute cost and runtime at the same concurrency, with warm cache documented. Freshness still needs its own objective measured from ingest to query visibility.

*Illustrative measurement. Any numbers in this example are hypothetical.*

## The three open table formats

The technical foundation of the lakehouse is an open table format — a metadata layer on top of Parquet files in object storage that provides ACID transactions, schema evolution, partitioning, and time travel.

**Delta Lake**: created by Databricks, open-sourced under the Linux Foundation. Mature ecosystem, tight Databricks integration, strong adoption in Azure environments. Delta tables are Parquet files with a `_delta_log` transaction log directory that records all changes. Time travel uses the transaction log: `SELECT * FROM table VERSION AS OF 5` or `TIMESTAMP AS OF '2026-01-01'`.

**Apache Iceberg**: created at Netflix, broadly adopted across cloud providers. AWS Glue, AWS Athena, Snowflake, Trino, Spark, and Flink all support Iceberg natively. The strongest option for multi-engine environments where different teams use different query engines. Iceberg's manifest files enable partition pruning and hidden partitioning (partitioning by an expression like `day(ts)` rather than materialised partition columns).

**Apache Hudi**: created at Uber, specialised for streaming upserts and incremental processing. Hudi's record-level upsert capability (using Bloom filter indices for efficient key lookup) makes it the strongest option for change data capture pipelines that need to apply database row-level changes to the lakehouse.

For new deployments: Delta Lake if your primary compute is Databricks; Iceberg if you need query engine flexibility or you're on AWS with Athena/Glue.

## Storage layer design

Object storage is a common foundation for lakehouses. Estimate costs for the actual region, storage class, stored bytes, requests, retention, retrieval, data transfer and table-maintenance compute. Compare cost per completed query or published dataset at equivalent freshness and availability.

**Partition design matters significantly for query performance.** A table partitioned by `year/month/day` on event timestamp enables Iceberg/Delta to skip irrelevant partitions and read only the files needed for a date-range query. A table that isn't partitioned (or is partitioned on a high-cardinality column) reads all files for every query.

The wrong partition granularity is a common problem:
- Too coarse (`year` only): large partitions, many files per partition scan
- Too fine (`year/month/day/hour`): small files problem — many small Parquet files, high metadata overhead
- Right granularity: depends on data volume and query patterns. For event data at 10GB/day, `year/month/day` produces daily partitions of manageable size

**Small files compaction**: streaming ingestion often produces many small files (one file per micro-batch). Small files degrade scan performance — the metadata overhead per file becomes significant at thousands of files. Schedule a compaction job (Spark or Databricks auto-optimise) that merges small files into larger ones on a regular basis.

## Compute layer separation

The lakehouse architecture separates storage from compute. Multiple compute engines can read from the same storage simultaneously:

- **Databricks or Spark**: for complex transformations, ML feature engineering, large-scale batch processing
- **Athena or BigQuery**: for SQL queries from analysts, ad-hoc exploration, BI tool integration  
- **dbt**: for transformation pipelines that run in-warehouse; supports Delta and Iceberg via Spark or BigQuery targets
- **Trino/Presto**: open-source distributed query engine, strong Iceberg support

The separation has operational implications: the compute layer scales independently of storage, different teams can use their preferred query engine, and you can switch compute engines without migrating data.

## The medallion architecture

The most widely adopted data organization pattern in lakehouses is the three-layer medallion (or multi-hop) architecture:

**Bronze layer** (raw): data landed exactly as received from source systems. No transformation, no schema enforcement beyond what the source provides. Append-only. Retained indefinitely or for regulatory retention periods. This is the system of record for raw data.

**Silver layer** (cleansed): validated, deduplicated, conformed. Type casting applied, schema enforced, joins between related sources applied, obvious errors filtered. Queryable but not yet business-ready.

**Gold layer** (aggregated): business-level aggregations optimized for BI and reporting. Denormalised for query performance — wide tables rather than normalised schemas. These are the tables that power dashboards and analytical queries.

The benefit: if a transformation in silver is found to be incorrect, you can reprocess from bronze without re-ingesting the raw data. Bronze is immutable history; silver and gold are derived views that can be rebuilt.

## Governance and cataloguing

A lakehouse without a data catalogue is a data lake — you can find the files, but you can't find the right table or understand what it contains.

**Unity Catalog** (Databricks): centralised governance for Delta tables — fine-grained access control, column masking, row filters, audit logging, and lineage tracking. The right choice if your compute is Databricks.

**AWS Glue Data Catalog**: metadata store for tables in S3, used by Athena, EMR, and Glue jobs. Supports Iceberg tables. Less feature-rich than Unity Catalog but native to the AWS ecosystem.

**Apache Atlas**: open-source data governance with lineage tracking, classification, and audit. More complex to operate than cloud-native options.

Enforce row filters and column masking on every approved query path that supports them. Restrict direct object-store access, exports and other engines separately. Test each route using the same restricted identity to confirm policy enforcement.

*Designing a lakehouse architecture or migrating from a traditional data warehouse? The table format and partition design choices compound — worth getting right early. [Happy to compare approaches.](/contact/)*

## Prove compatibility with the operations you actually use

List every writer and reader and the exact behaviours each needs. Include catalogue operations, table creation, appends, updates, deletes, schema evolution, snapshot reads and access policy. An engine that can read a current table may not be able to read it after a writer activates a new table feature. For Delta Lake, table features appear in the protocol. Engines need support for the relevant reader or writer features before those operations are available. Keep versions and credentials in the compatibility sheet, and retest after changing the runtime or catalogue. [Delta Lake feature compatibility](https://docs.delta.io/versioning/)

Create a small dataset with updates, a deletion and a schema change. Write with the intended ingestion engine and read using the actual production versions of the BI and batch engines. Reconcile row counts for each commit and compare selected records across readers. Check whether migration can fall back when only some readers support a feature. Hold the feature change until its rollout can be coordinated or isolate the newer tables behind a supported interface. A vocabulary match in two feature matrices has limited value until both engines use the same table semantics and policy.

## Track event time, ingestion time and publication time

Give each timestamp a clear definition. Event time represents business ordering. Ingestion time identifies when data reached a recoverable source. Publication time tells when it was visible to a query against a committed table. Combining these timestamps into one measure can make a late source look like a slow lakehouse or hide a backlog in the transformation step. Record publication delay separately for arrivals during normal operation and replays.

In a hypothetical order table, a source emits an update at 10:00, ingestion confirms it at 10:02 and the silver table exposes the change at 10:06. Event-to-query visibility is six minutes, including two minutes to ingest and four minutes to transform and publish. If an update dated 09:00 arrives at 10:05, its ingest-to-query budget can still pass even as the business snapshot changes for a past hour. Define a correction window, show whether dashboards use the latest snapshot or the original reporting cutoff, and alert on both delayed arrivals and slow publication.

Where change streams can replay messages, reconcile source sequence or transaction position in addition to the business ID. An older retry may otherwise overwrite a newer value. Decide how to handle deletes and whether a full rebuild uses the latest state or reproduces a dated result. In tests, submit the same update twice, deliver two changes out of order and replay events around a deleted record. A successful job status does not establish the correctness of those outputs.

## Size file maintenance against the reader workload

Measure file counts, partition sizes and scanned bytes separately. Suppose an illustrative streaming job writes six 12 MiB data files every ten minutes. That creates 864 files and about 10.1 GiB per day. If a rewrite achieved roughly 256 MiB per file while preserving the same partition boundaries and data layout, the average volume would fit in about 41 files before allowing for imperfect packing. This is a model of file count, not a prediction of read speed. The query engine may skip files through statistics and other metadata, and a rewrite can affect locality or vary by partition.

Compare recurring dashboard filters, broad batch transformations and BI concurrency before and after a compaction. Record query latency, requests to storage, scan volume and compute charged for both reads and maintenance. Keep queueing and cache state comparable. If a query finishes faster but daily compaction becomes expensive, schedule compaction for partitions with measurable reader cost. Review writer behaviour first if the system continuously rebuilds the same active partition. Apache Iceberg documents data-file rewriting, snapshot expiration and orphan cleanup as separate operations, each with a different effect. [Apache Iceberg table maintenance](https://iceberg.apache.org/docs/latest/maintenance/)

## Exercise recovery and policy at the data boundary

A snapshot is useful for rollback only while the required metadata and files are retained. Write down the longest audit, ingestion and reader windows before expiring snapshots. Keep retention decisions consistent with downstream obligations and separate backups. Test a rebuild from raw inputs and a rollback to a known table state in isolation. Reconcile business totals for a sample period and verify publication age after the switch. Object lifecycle rules and orphan cleanup should respect active writers and preserved snapshots. Independently deleting objects based only on age can break valid references.

Verify permissions in the table service and in the underlying storage. A catalogue policy protects a reader only when access goes through the enforcement path. In a representative test, use separate service identities for ingestion and analytics and verify that analysts cannot directly read restricted raw storage. Check what exported copies and materialised tables inherit. Repeat against every approved engine and the relevant backup or restore roles. Centralising grants can simplify administration, but these checks establish whether each actual path enforces them.

## Publish evidence a reader can repeat

Record the table revision, dataset size, representative queries, concurrency, engine version, file and snapshot counts, cache conditions and cost units with the report. Keep maintenance cost and query cost on separate lines. Publish results for current data and a corrected historical window. Pair charts with a description of source events and stages so a freshness chart can be interpreted when a source is delayed. Add a sample reconciliation query and a dated results table. These artefacts let another team reproduce the comparison or explain why a different workload could produce a different result.

Keep the cost ledger aligned with the data comparison. Storage tiers, request pricing, compute contracts and transfer can change independently of file volume. Show the observed units and price assumptions before publishing currency totals. If replay writes are a significant expense, track the share attributable to normal workload, reprocessing and compaction. A small platform may get more benefit from accepting a few larger ingestion batches than from optimising its query engine. Compare the change in publication delay alongside the avoided work so the recommendation carries a clear operating trade-off.

An owner should be able to name the table and source revision behind every reported value. Run a restore after an application update as well as before deployment, because restore dependencies and access roles can evolve independently of the data path.
