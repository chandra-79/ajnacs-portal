---
title: "Text Processing on Linux: grep, sed, awk, cut, sort, and the Pipeline Approach"
description: "The core Linux text processing tools — what each does, when to use each, and how to chain them in pipelines that turn raw logs and data files into exactly the answer you need."
date: 2027-03-01
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 7
format: article
---

Linux treats almost everything as text. Log files, configuration files, command output, process tables — all text. The engineers who can extract precise answers from these streams quickly, using pipelines of small focused tools, are dramatically faster at diagnosis, reporting, and automation than engineers who open log files in editors and scan manually.

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
cut -d',' -f2 data.csv                   # second CSV column

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
sort -k2 file.txt                # sort by second field (space-delimited)
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
awk '$3 > 1000' /etc/passwd      # lines where field 3 > 1000 (users with high UID)
awk '/error/ {print $0}' file    # lines matching a pattern (like grep)
awk 'NR==10,NR==20' file         # lines 10 through 20 (NR = row number)
awk 'NF > 5' file                # lines with more than 5 fields

## Arithmetic
awk '{sum += $5} END {print sum}' file          # sum of field 5
awk '{sum += $5} END {print sum/NR}' file       # average of field 5

## Printf for formatted output
awk '{printf "%-20s %10.2f\n", $1, $5}' data.txt

## Practical: parse nginx access log — total bytes transferred by IP
awk '{bytes[$1] += $10} END {for (ip in bytes) printf "%15s %d\n", ip, bytes[ip]}' \
    /var/log/nginx/access.log | sort -k2,2rn | head -10

## Practical: find processes consuming over 10% CPU
ps aux | awk '$3 > 10.0 {print $1, $2, $3, $11}'

## Practical: calculate disk usage by directory
du -sk /var/log/* | sort -k1,1rn | awk '{printf "%6s MB  %s\n", int($1/1024), $2}'
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

## How many GB of logs are in /var/log?
find /var/log -name "*.log" -exec du -k {} + \
    | awk '{sum+=$1} END {printf "%.1f GB\n", sum/1024/1024}'

## Which user accounts have a login shell (not /sbin/nologin or /bin/false)?
awk -F: '$7 !~ /nologin|false/ {print $1, $7}' /etc/passwd

## Find the largest files modified in the last 24 hours
find /var -mtime -1 -type f -exec du -k {} + \
    | sort -rn | head -20 \
    | awk '{printf "%6d MB  %s\n", int($1/1024), $2}'

## Count error occurrences by hour from an application log
grep "ERROR" app.log \
    | awk '{print substr($1,1,13)}' \
    | sort | uniq -c

## Watch a log file and highlight errors in real time
tail -F /var/log/app.log | grep --color=always -E "ERROR|WARN|$"
```

## xargs — Pass Arguments to Commands

`xargs` takes stdin and passes each line as an argument to a command — essential when you need to act on the output of one command.

```bash
## Kill all processes matching a pattern
pgrep -f "stale-worker" | xargs kill -9

## Delete old files
find /tmp -name "*.tmp" -mtime +7 | xargs rm

## Run a command against multiple targets
cat servers.txt | xargs -I{} ssh {} "uptime"

## Parallel execution
cat urls.txt | xargs -P 4 -I{} curl -s -o /dev/null -w "%{http_code} {}\n" {}
```

The combination of these tools — grep, cut, sort, uniq, awk, sed, tr, xargs — handles the majority of data extraction and transformation tasks you will encounter on a Linux system. The investment in learning them pays back on every production system you ever work on.
