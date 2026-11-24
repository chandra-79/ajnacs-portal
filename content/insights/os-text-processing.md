---
title: "Text Processing on Linux: grep, sed, awk, cut, sort, and the Pipeline Approach"
description: "The core Linux text processing tools — what each does, when to use each, and how to chain them in pipelines that turn raw logs and data files into exactly the answer you need."
date: 2027-02-05
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 7
format: article
---

Many Linux tools expose text interfaces for logs, configuration, and diagnostics. Small command-line tools can make repeatable extraction and transformation easier, provided the record format and error handling are explicit.

## The Philosophy: Small Tools, Chained Together

The Unix design principle: each tool does one thing well and produces text output that the next tool can consume. `grep` finds lines. `awk` extracts fields. `sort` orders them. `uniq` deduplicates. `head` and `tail` limit results. Chained with pipes (`|`), they compose into powerful one-liners.

## grep — Find Lines That Match

```bash
## Basic usage
grep "pattern" file.txt
grep "error" /var/log/syslog

## Flags you will use constantly
grep -i "error" file             # case-insensitive
grep -v "DEBUG" file             # invert: lines NOT matching
grep -n "failed" file            # show line numbers
grep -c "GET" access.log         # count of matching lines
grep -l "api_key" /etc/**        # list files that match (not lines)
grep -r "password" /etc/         # recursive search through directory
grep -A 3 "error" file           # show 3 lines After match
grep -B 2 "error" file           # show 2 lines Before match
grep -C 2 "error" file           # show 2 lines of Context (before and after)

## Extended regex (use -E for | alternation, + quantifier)
grep -E "error|warning|critical" app.log
grep -E "^[0-9]{4}-[0-9]{2}" app.log   # lines starting with a date

## Fixed string (faster for literals, no regex interpretation)
grep -F "192.168.1.1" access.log

## Practical: find all failed SSH login attempts
grep "Failed password" /var/log/auth.log | grep -oE "[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+" | sort | uniq -c | sort -rn | head -20
```

## cut — Extract Fields from Delimited Text

`cut` extracts specific columns from each line. Simple, fast, and right for the job when the delimiter is consistent.

```bash
## -d specifies delimiter, -f specifies field numbers
cut -d: -f1 /etc/passwd                  # first field (usernames)
cut -d: -f1,3 /etc/passwd                # fields 1 and 3
cut -d: -f1-3 /etc/passwd                # fields 1 through 3
cut -d',' -f2 simple-delimited.txt       # only when fields cannot contain commas

## Extract characters by position (not delimiter)
cut -c1-10 file.txt                      # characters 1 through 10

## Practical: get just the IP addresses from nginx access log
## 192.168.1.100 - - [27/May/2026:10:30:45 +0000] "GET /api/v1/data HTTP/1.1" 200 1234
cut -d' ' -f1 /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10
```

## sort and uniq — Order and Deduplicate

```bash
sort file.txt                    # alphabetical sort
sort -r file.txt                 # reverse
sort -n file.txt                 # numeric sort
sort -rn file.txt                # reverse numeric (largest first)
sort -k2 file.txt                # sort using the key starting at field 2 through line end
sort -k2,2n -k1,1 file.txt      # sort by field 2 numerically, then field 1
sort -t: -k3,3n /etc/passwd      # sort by UID (field 3, : delimiter)
sort -u file.txt                 # sort and remove duplicates

## uniq — collapse adjacent duplicate lines (must sort first for global dedup)
sort file.txt | uniq             # remove duplicates
sort file.txt | uniq -c          # prefix with count
sort file.txt | uniq -d          # show only lines that appear more than once
sort file.txt | uniq -u          # show only unique lines (appearing once)

## Practical: top 10 HTTP status codes in nginx log
awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10
```

## awk — The Field Processor

`awk` is a mini programming language for processing structured text. Each line is split into fields (`$1`, `$2`, ...), with `$0` being the whole line.

```bash
## Basic: print specific fields
awk '{print $1}' file            # first field (space-delimited)
awk '{print $1, $3}' file        # fields 1 and 3
awk -F: '{print $1, $3}' /etc/passwd   # colon delimiter

## Conditions
awk -F: '$3 > 1000' /etc/passwd      # lines where field 3 > 1000 (users with high UID)
awk '/error/ {print $0}' file    # lines matching a pattern (like grep)
awk 'NR==10,NR==20' file         # lines 10 through 20 (NR = row number)
awk 'NF > 5' file                # lines with more than 5 fields

## Arithmetic
awk '{sum += $5} END {print sum}' file          # sum of field 5
awk '{sum += $5} END {if (NR) print sum/NR; else exit 1}' file  # nonempty numeric input

## Printf for formatted output
awk '{printf "%-20s %10.2f\n", $1, $5}' data.txt

## Practical: parse nginx access log — total bytes transferred by IP
awk '{bytes[$1] += $10} END {for (ip in bytes) printf "%15s %d\n", ip, bytes[ip]}' \
    /var/log/nginx/access.log | sort -k2,2rn | head -10

## Practical: find processes consuming over 10% CPU
ps aux | awk '$3 > 10.0 {print $1, $2, $3, $11}'

## Practical: calculate disk usage by directory
du -sk /var/log/* | sort -k1,1rn | awk '{printf "%6s MiB  %s\n", int($1/1024), $2}'
```

## sed — Stream Editor

`sed` performs transformations on text streams — substitutions, deletions, insertions.

```bash
## Substitute: s/pattern/replacement/flags
sed 's/foo/bar/' file            # replace first occurrence per line
sed 's/foo/bar/g' file           # replace all occurrences (global)
sed 's/foo/bar/gi' file          # global, case-insensitive
sed 's/foo/bar/2' file           # replace second occurrence only
sed -i 's/foo/bar/g' file        # in-place edit (modifies the file)
sed -i.bak 's/foo/bar/g' file    # in-place with .bak backup

## Delete lines
sed '/pattern/d' file            # delete lines matching pattern
sed '10,20d' file                # delete lines 10 through 20
sed '/^$/d' file                 # delete empty lines
sed '/^#/d' file                 # delete comment lines

## Print specific lines
sed -n '10,20p' file             # print lines 10-20 only
sed -n '/error/p' file           # print lines matching pattern

## Insert and append
sed '5i\This line inserted before line 5' file
sed '5a\This line appended after line 5' file

## Practical: remove blank lines and comments from a config file
sed -e '/^$/d' -e '/^#/d' /etc/nginx/nginx.conf | less

## Practical: update a version string in a config file
sed -i "s/version = .*/version = \"2.1.0\"/" config.toml

## Practical: extract a section between two patterns
sed -n '/BEGIN CERTIFICATE/,/END CERTIFICATE/p' cert.pem
```

## tr — Translate Characters

```bash
tr 'a-z' 'A-Z' < file            # lowercase to uppercase
tr -d '\r' < windows.txt         # delete carriage returns (CRLF → LF)
tr -s ' ' < file                 # squeeze multiple spaces into one
tr ':' '\n' <<< "$PATH"          # replace colons with newlines (show PATH entries)
```

## Practical Pipelines

Real-world one-liners that demonstrate the composition model:

```bash
## Top 10 IPs hitting your nginx server
awk '{print $1}' /var/log/nginx/access.log \
    | sort | uniq -c | sort -rn | head -10

## All unique 4xx and 5xx responses with counts
awk '$9 ~ /^[45]/' /var/log/nginx/access.log \
    | awk '{print $9, $7}' \
    | sort | uniq -c | sort -rn | head -20

## How many GiB of allocated log blocks are reported under /var/log?
find /var/log -name "*.log" -exec du -k {} + \
    | awk '{sum+=$1} END {printf "%.1f GiB\n", sum/1024/1024}'

## Which user accounts have a login shell (not /sbin/nologin or /bin/false)?
awk -F: '$7 !~ /nologin|false/ {print $1, $7}' /etc/passwd

## Find the largest files modified in the last 24 hours
find /var -mtime -1 -type f -exec du -k {} + \
    | sort -rn | head -20 \
    | awk '{printf "%6d MiB  %s\n", int($1/1024), $2}'

## Count error occurrences by hour from an application log
grep "ERROR" app.log \
    | awk '{print substr($1,1,13)}' \
    | sort | uniq -c

## Watch a log file and highlight errors in real time
tail -F /var/log/app.log | grep --color=always -E "ERROR|WARN|$"
```

## xargs — Pass Arguments to Commands

`xargs` constructs command arguments from input. Its default parsing is whitespace-oriented, not one arbitrary line per argument; use an appropriate delimiter for the data.

```bash
## Inspect matching processes before choosing an authorised action
pgrep -af "stale-worker"

## Inspect old files in a disposable exercise directory
find ./exercise-files -type f -name "*.tmp" -mtime +7 -print

## Run a command against multiple targets
cat servers.txt | xargs -I{} ssh {} "uptime"

## Parallel execution
cat urls.txt | xargs -P 4 -I{} curl -s -o /dev/null -w "%{http_code} {}\n" {}
```

These tools — grep, cut, sort, uniq, awk, sed, tr and xargs — provide useful building blocks for line-oriented data. Use a format-aware parser for structured records and check quoting, delimiters and failure behavior before trusting a pipeline. The examples assume reviewed local fixtures and authorized target lists, not arbitrary commands supplied by untrusted input.

## Define the record format before building a pipeline

Text tools operate on bytes, lines, fields, and patterns. They do not infer the schema you intended. Before writing a command, define what constitutes one record, which delimiter separates fields, whether fields can contain that delimiter, and how missing values are represented. An access-log format with quoted request strings is different from a tab-separated export, and both differ from general CSV with quoted commas and embedded newlines.

For deliberately simple records, small tools are excellent. For structured data with escaping rules, use a parser that understands those rules. A `cut -d,` command is not a general CSV parser. A whitespace-based `awk` command cannot reliably recover fields from arbitrary JSON. Choosing the right parser prevents a pipeline from producing a convincing answer to incorrectly split data.

Keep original input immutable during the investigation. Write transformed output to a new file, compare counts and sample records, and only then decide whether it should replace an existing artifact. A failed transformation can truncate a destination if the shell opens that destination before the command reads its input. In-place editing should be a deliberate operation with an appropriate recovery path, not the default form of exploration.

## Worked example: status counts with a visible denominator

Use the following fictional tab-separated input. The columns are request ID, HTTP status, and elapsed milliseconds. Every row represents one attempt; the file contains no header and no quoted fields. These restrictions make a simple field processor appropriate.

```text
r1	200	80
r2	200	120
r3	503	250
r4	200	90
r5	404	30
r6	200	110
r7	503	270
r8	200	100
```

There are eight attempts: five with status 200, one with status 404, and two with status 503. The chart shows counts 5, 1, and 2 for those three categories. The 503 share is 2 / 8 = 25%. That is an illustrative attempt-level server-error proportion, not a customer failure rate or a production benchmark. If retries share an operation ID, a business-outcome denominator would require a separate definition and deduplication rule.

A pipeline can count the categories without guessing the log's layout:

```bash
LC_ALL=C awk -F '\t' 'NF == 3 { count[$2]++; total++ }
END {
  for (status in count) print status, count[status]
  print "TOTAL", total
}' requests.tsv
```

This first version deliberately exposes a problem: malformed rows are silently skipped. That may be suitable for exploration if the omission is reported, but it is not a trustworthy reporting contract. Count rejected rows separately, validate status and duration fields, and fail the report when the input violates its declared schema. Do not let a cleaner output conceal missing evidence.

## A runnable validation and aggregation lab

Create a temporary directory for the exercise and save the eight records as `requests.tsv` with literal tab characters. Then run the following GNU-compatible `awk` program. It accepts three-digit numeric statuses and nonnegative integer millisecond durations, counts rejected records, and refuses to publish a summary when any row is malformed.

```bash
LC_ALL=C awk -F '\t' '
NF != 3 || $1 == "" || $2 !~ /^[0-9][0-9][0-9]$/ || $2 < 100 || $2 > 599 || $3 !~ /^[0-9]+$/ {
  bad++; next
}
{
  count[$2]++; total++; duration += $3
}
END {
  if (bad) {
    print "Rejected records:", bad > "/dev/stderr"
    exit 2
  }
  if (!total) {
    print "No valid records" > "/dev/stderr"
    exit 1
  }
  for (status in count) print status, count[status]
  printf "TOTAL %d\nMEAN_MS %.2f\n", total, duration / total
}' requests.tsv
```

The total duration is 1,050 milliseconds and the arithmetic mean is 1,050 / 8 = 131.25 milliseconds. This mean describes all attempts, including the error responses. It does not establish a tail percentile and should not be substituted for one. If the desired metric covers only successful attempts, state that filter and its denominator rather than changing the calculation silently.

Test an empty file, a missing duration, a nonnumeric duration, and a record with an extra delimiter. Observe the exit status as well as the output. The exercise is complete when a bad input produces a visible failure rather than a plausible partial report. Keep the fixture and expected results so a future edit can be checked against the same cases.

## Treat exit status as data

In a shell pipeline, the default status commonly comes from the last command. An early read failure can therefore be hidden by a later command that successfully processes an empty stream. In Bash, `set -o pipefail` changes pipeline status handling, but it does not decide which nonzero statuses are expected in your application.

GNU `grep` normally uses status 0 for selected lines, 1 for no selected lines, and 2 for an error. A search with no matches can be a valid result. A report script should distinguish that outcome from an unreadable file. Do not apply `set -e` or `pipefail` without considering these semantics and then assume every early exit represents an operational failure.

Commands such as `head` can close their input after receiving enough data. An upstream writer may then receive a broken-pipe signal. This can affect the observed pipeline status even though truncating output was intentional. Separate exploratory display pipelines from production transformations whose completeness must be established.

Write critical reports to a temporary output and promote them only after validation succeeds. The promotion mechanism should match the destination filesystem and permissions. Keep the prior known-good result when a refresh fails, and report its age rather than replacing it with an empty file that looks current.

## Preserve filenames as filenames

The default whitespace splitting in `xargs` is unsuitable for arbitrary filenames. A filename can contain spaces, tabs, quotes, and newlines. On systems supporting the options, `find -print0` paired with `xargs -0` preserves boundaries using a NUL separator. `find -exec ... {} +` is another way to pass filenames directly as arguments.

Boundary-safe transport does not make a destructive operation safe. Selection criteria can still be wrong, files can change between discovery and action, and an unexpectedly broad starting directory can include unrelated data. For a learning exercise, list the selected files first and use a disposable directory. For maintained automation, narrow the scope and define how changes or errors are handled.

Do not parse the human-oriented output of `ls` when you need a reliable list of paths. Prefer a tool's machine-readable mode or direct argument passing. Similarly, shell quoting protects arguments but does not turn untrusted text into safe shell code. Avoid constructing a command string from a filename when the program can accept the filename as a separate argument.

## Control locale and numeric interpretation

Sort order and character classes can depend on locale. Setting `LC_ALL=C` can make a byte-oriented exercise reproducible, but it also changes how non-ASCII text is treated. Choose the locale according to the data's meaning and record it in the procedure. A stable order for identifiers is not necessarily the desired alphabetical order for human names.

Numeric sorting needs an explicit numeric key. Lexical order places strings according to characters, which can put `100` before `20`. Specify both the starting and ending field for the key when adjacent fields should not participate. Decide how to handle blank, malformed, or non-finite numeric input before aggregation.

For very large integers or financial arithmetic requiring exact decimal behavior, check the numeric model of the selected implementation. A small `awk` expression is convenient but should not be assumed to preserve arbitrary integer precision. Use a tool with suitable numeric semantics when the decision depends on that precision.

A trustworthy pipeline has a declared input, validated boundaries, visible rejects, a defined denominator, and a checked output. Its compactness is useful only after those properties hold. The goal is an answer that another person can reproduce, not a one-liner that nobody dares to edit.

Keep the report’s generation time separate from the input window. A freshly generated file can describe old or incomplete input. Record both boundaries and the number of accepted and rejected records so a reader can tell whether the result is current, complete, and comparable with the previous report.

## Primary references

- [GNU grep: exit status](https://www.gnu.org/software/grep/manual/html_node/Exit-Status.html)
- [GNU Findutils: unusual filenames](https://www.gnu.org/software/findutils/manual/html_node/find_html/Unusual-Characters-in-File-Names.html)
- [GNU Coreutils: sort invocation](https://www.gnu.org/software/coreutils/manual/html_node/sort-invocation.html)
