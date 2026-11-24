# Editorial depth review

The November 23 publication snapshot contained 85 Insights, 13 Notes and 32 case studies. The review covers those 130 public entries. Scheduled drafts stayed on their existing calendar.

The [coverage CSV](deep-dive-coverage.csv) is generated from the source Markdown. It records the file or case heading, source lines scanned, detected top-level prose paragraphs, possible numeric and absolute-claim cues, and the study path assigned to each article. Cue counts are a triage aid. A repeated number, code sample or illustrative statistic may need no correction. The selected inline link, when the prose contains a suitable match, includes a short source excerpt for review. Each mapped article also links to its applicable path near the end.

Each of the nine [study paths](https://ajnacs.com/deep-dives/) starts with an existing overview. Level 2 walks through a worked numerical example. Level 3 explains a measurement, model or procedure. Level 4 tests an engineering decision and identifies failure modes or limits. The charts use illustrative fixtures. Each shows the metric and units, and each lesson gives the arithmetic, references and CSV.

Specific corrections include the conditional nature of outbox delivery, the distinction between Amazon RDS Multi-AZ DB instance and cluster failover timings, the billing inputs in a serverless-versus-containers comparison, and unsupported percentage claims about compression choices and Python libraries.

The scan covers every source in the snapshot. The source-linked corrections address selected high-impact claims. Broader fact verification and editorial judgment remain separate from automated line coverage.

## Archive expansion

The [per-article word counts](article-expansion-coverage.csv) compare each revised article body with the published snapshot. The same word-token rule was applied before and after. The count includes body headings, links and code examples. It excludes article front matter and the case study's title and structured metadata. The new Level 2–4 lessons are counted separately from the archive expansion.

The new sections cover decisions, worked examples, verification, and follow-through. Technical pieces link to primary material where a standard or version matters. Case study figures are illustrative. Personal notes keep the original author's account and add practical reflection without adding autobiographical claims.

Among the legacy claims corrected in this pass are PostgreSQL backfill transaction boundaries, HTTP shared cache freshness, Oracle diagnostics entitlements, Java feature availability by release, dependency lockfile checks, and the distinction between prompt formatting and application-side access control.

Existing publication dates, article URLs and future publication slots stay intact. Editorial revisions are preserved if content is imported again from an upstream collection.
