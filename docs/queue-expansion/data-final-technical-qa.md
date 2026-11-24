# DATA 81 final technical QA

All 81 assigned drafts are ready for snapshot. 30 article bodies received focused accuracy corrections; normalized frontmatter is unchanged.

- Body words: 119,813; minimum expansion 2.0489× baseline.
- Primary reference links: 225 across 114 distinct URLs.
- Figure schemas, methods, table values, synthetic labels, SVG rendering, accessible details and CSV rendering pass for all 81.
- No service, build, manifest, scheduling or CSS edits.

Corrections include experiment assignment versus exposure analysis; bounded-load hashing versus request hot spots; SQL Server locking versus snapshots and PostgreSQL Serializable participation; DynamoDB physical versus logical partitions; PostgreSQL HOT, vacuum thresholds and tail truncation; JSONB byte preservation; SQL window peer/frame semantics; CDC bootstrap and recovery boundaries; cloud route pricing; Snowflake monitor and sizing claims; precise MongoDB bucket labels; safe malformed-input handling in the Python worksheet; and unsupported speed/latency claims.

One figure label needs regenerated assets: reserved-instances-are-commitments, third point changed from “60% utilization unused” to “60% utilization added cost”. The value remains 0.1 and the published table matches.

The 81 worked numerical scenarios were checked against their formulas. No full site build or external database execution was performed during this isolated content audit; the publication agent should run the cumulative build and verification.

Final invariant failures: 0. The JSON report includes all article/figure SHA-256 hashes and per-article word counts.
