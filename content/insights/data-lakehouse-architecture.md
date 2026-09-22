---
title: "The Data Lakehouse: Why It Won, and How to Architect One That Works"
description: "Data warehouses couldn't handle unstructured data at scale. Data lakes couldn't enforce schemas or serve BI queries efficiently. The lakehouse combines both — here's the architecture, the open table formats that make it work, and the practical design decisions."
date: 2026-06-30
tags: ["Data Engineering", "Cloud Architecture", "AI & MLOps"]
format: article
---

The data landscape spent a decade in a pendulum swing. First the data warehouse (structured, governed, expensive, inflexible). Then the data lake (cheap, flexible, unstructured, ungovernable at scale). Then the simultaneous recognition that most organizations needed both: governed, structured data for BI and reporting, and scalable, flexible storage for ML and data science.

The data lakehouse is the current consensus architecture: object storage as the foundation (cheap, scalable), open table formats that add ACID transactions, schema enforcement, and query performance on top of that storage, and a separation of storage from compute.

## The three open table formats

The technical foundation of the lakehouse is an open table format — a metadata layer on top of Parquet files in object storage that provides ACID transactions, schema evolution, partitioning, and time travel.

**Delta Lake**: created by Databricks, open-sourced under the Linux Foundation. Mature ecosystem, tight Databricks integration, strong adoption in Azure environments. Delta tables are Parquet files with a `_delta_log` transaction log directory that records all changes. Time travel uses the transaction log: `SELECT * FROM table VERSION AS OF 5` or `TIMESTAMP AS OF '2026-01-01'`.

**Apache Iceberg**: created at Netflix, broadly adopted across cloud providers. AWS Glue, AWS Athena, Snowflake, Trino, Spark, and Flink all support Iceberg natively. The strongest option for multi-engine environments where different teams use different query engines. Iceberg's manifest files enable partition pruning and hidden partitioning (partitioning by an expression like `day(ts)` rather than materialised partition columns).

**Apache Hudi**: created at Uber, specialised for streaming upserts and incremental processing. Hudi's record-level upsert capability (using Bloom filter indices for efficient key lookup) makes it the strongest option for change data capture pipelines that need to apply database row-level changes to the lakehouse.

For new deployments: Delta Lake if your primary compute is Databricks; Iceberg if you need query engine flexibility or you're on AWS with Athena/Glue.

## Storage layer design

Object storage is the foundation: S3, ADLS Gen2, or GCS. The cost advantage over traditional storage is significant — object storage at $0.02-0.023/GB/month vs block storage at $0.08-0.10/GB/month.

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

Access control: row-level and column-level security should be enforced at the catalogue/governance layer, not in downstream query tools. A customer PII column masked at the governance layer is masked everywhere; a column masked by a BI tool setting is only masked in that tool.

*Designing a lakehouse architecture or migrating from a traditional data warehouse? The table format and partition design choices compound — worth getting right early. [Happy to compare approaches.](/contact)*
