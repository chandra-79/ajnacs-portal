---
title: "Shell Scripting: Writing Bash Scripts That Actually Work in Production"
description: "Variables, conditionals, loops, functions, error handling, and the specific practices that separate a shell script that works once from one that runs reliably in production automation."
date: 2027-02-10
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 8
format: article
---

Shell scripts are everywhere in production Linux environments — deployment pipelines, cron jobs, backup procedures, health checks, and system initialization. Scripts written without structure or error handling work on the first run and fail silently in the worst circumstances. This lesson covers bash scripting from the essentials to the practices that make scripts production-ready.

## The Script Header

One common Bash header is:

```bash
#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'
```

**`#!/usr/bin/env bash`**: the shebang line. Tells the OS to execute this file with bash. Using `env bash` rather than `/bin/bash` finds Bash through PATH. This helps with installation paths but requires a trusted PATH and does not guarantee compatibility across Bash versions.

**`set -euo pipefail`**: options that expose some errors, with semantics that must be understood:
- `-e`: exit on certain unhandled failures; conditional contexts and other documented exceptions apply
- `-u`: treat references to unset variables as an error
- `-o pipefail`: a pipeline's exit code is the exit code of the last failing command

## Variables

```bash
## Assign (no spaces around =)
name="production"
count=42

## Reference — always quote variable references
echo "$name"
echo "${name}_suffix"

## Command substitution: capture command output
current_date=$(date +%Y-%m-%d)
## GNU find: count matched files without relying on filename newlines
file_count=$(find /var/log -type f -name "*.log" -printf x | wc -c)

## Arithmetic
total=$((count + 10))
remainder=$((count % 7))

## Default values
env="${ENV:-production}"
log_dir="${LOG_DIR:-/var/log/app}"

## String operations
str="hello world"
echo "${str^^}"              # uppercase: HELLO WORLD
echo "${#str}"               # length: 11
echo "${str/world/Linux}"    # replace: hello Linux
echo "${str:0:5}"            # substring first 5: hello

## Arrays
servers=("web01" "web02" "web03")
echo "${servers[0]}"         # first element
echo "${servers[@]}"         # all elements
echo "${#servers[@]}"        # count: 3
```

## Conditionals

```bash
if [[ -f "/etc/nginx/nginx.conf" ]]; then
    echo "nginx config exists"
elif [[ -d "/etc/nginx" ]]; then
    echo "nginx dir exists but no config"
else
    echo "nginx not installed"
fi

## Common test expressions
[[ -f file ]]          # is a regular file
[[ -d dir ]]           # is a directory
[[ -e path ]]          # exists (any type)
[[ -z "$str" ]]        # string is empty
[[ -n "$str" ]]        # string is non-empty
[[ "$a" == "$b" ]]     # string equal
[[ $n -eq 0 ]]         # numeric equal
[[ $n -lt 10 ]]        # less than
[[ $n -gt 10 ]]        # greater than
[[ "$str" =~ ^[0-9]+$ ]]  # matches regex

## case statement
case "$environment" in
    production)  log_level="warn" ;;
    staging)     log_level="info" ;;
    dev*)        log_level="debug" ;;
    *)           echo "Unknown environment" >&2; exit 1 ;;
esac
```

## Loops

```bash
## for over a list
for host in web01 web02 web03; do
    ping -c 1 "$host" && echo "$host is up" || echo "$host is DOWN"
done

## for over an array
for host in "${servers[@]}"; do
    ssh "$host" "systemctl status nginx"
done

## for with range
for i in {1..10}; do
    echo "Iteration $i"
done

## while loop
attempts=0
status="pending"
while [[ "$status" != "ready" && $attempts -lt 30 ]]; do
    status=$(check_deployment_status)
    attempts=$((attempts + 1))
    if [[ "$status" != "ready" && $attempts -lt 30 ]]; then sleep 5; fi
done
[[ "$status" == "ready" ]] || { echo "Deployment did not become ready" >&2; exit 1; }

## Read a file line by line
while IFS= read -r line; do
    echo "Processing: $line"
done < servers.txt
```

## Functions

```bash
log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $*" >&2
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2
}

check_service() {
    local service="$1"

    if systemctl is-active --quiet "$service"; then
        log_info "$service is running"
        return 0
    else
        log_error "$service is not running"
        return 1
    fi
}

## To return a string: echo it and capture with $()
get_container_ip() {
    local container="$1"
    docker inspect --format '{{.NetworkSettings.IPAddress}}' "$container"
}

ip=$(get_container_ip "my-api")
```

## Error Handling

```bash
## Trap: run cleanup on exit or error
TEMP_FILE="$(mktemp)"

cleanup() {
    local exit_code=$?
    rm -f "$TEMP_FILE"
    exit "$exit_code"
}
trap cleanup EXIT
trap 'log_error "Interrupted"; exit 1' INT TERM

## die: print error and exit
die() {
    log_error "$*"
    exit 1
}

## Require a command to exist
require_command() {
    command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

require_command docker
require_command kubectl

## Retry logic
retry() {
    local attempts="$1"
    local delay="$2"
    local i
    shift 2
    [[ "$attempts" =~ ^[1-9][0-9]*$ && "$delay" =~ ^[0-9]+$ ]] || return 2
    (( $# > 0 )) || return 2

    for (( i=1; i<=attempts; i++ )); do
        if "$@"; then
            return 0
        fi
        if (( i < attempts )); then
            log_info "Attempt $i/$attempts failed. Retrying in ${delay}s..."
            sleep "$delay"
        else
            log_error "All $attempts attempts failed"
        fi
    done
    return 1
}

retry 3 3 curl --connect-timeout 1 --max-time 2 -sf "https://api.service.internal/health"
```

## Argument Parsing

```bash
usage() {
    echo "Usage: $(basename "$0") [--version VERSION] [--dry-run] ENVIRONMENT"
    exit "${1:-0}"
}

VERSION="latest"
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --version|-v) [[ $# -ge 2 ]] || usage 1; VERSION="$2"; shift 2 ;;
        --dry-run|-n) DRY_RUN=true; shift ;;
        --help|-h)    usage 0 ;;
        -*)           echo "Unknown option: $1" >&2; usage 1 ;;
        *)            ENVIRONMENT="$1"; shift ;;
    esac
done

[[ -z "${ENVIRONMENT:-}" ]] && { echo "ENVIRONMENT required" >&2; usage 1; }
[[ "$ENVIRONMENT" =~ ^(production|staging|development)$ ]] || die "Invalid: $ENVIRONMENT"
```

## A Deployment Sketch to Adapt and Test

```bash
#!/usr/bin/env bash
## deploy.sh — Deploy application to target environment
set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMP_FILE="$(mktemp)"

cleanup() { rm -f "$TEMP_FILE"; }
trap cleanup EXIT

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$1] ${*:2}" | tee -a "$LOG_FILE"
}

die() { log ERROR "$*"; exit 1; }

check_prerequisites() {
    log INFO "Checking prerequisites..."
    command -v docker  >/dev/null || die "docker not found"
    command -v kubectl >/dev/null || die "kubectl not found"
}

wait_for_health() {
    local endpoint="$1"
    local i
    for (( i=1; i<=30; i++ )); do
        curl --connect-timeout 2 --max-time 5 -sf "$endpoint" >/dev/null && log INFO "Health OK" && return 0
        if (( i < 30 )); then sleep 5; fi
    done
    die "Health check timed out: $endpoint"
}

main() {
    log INFO "Deploying $IMAGE to $ENVIRONMENT"
    check_prerequisites
    docker pull "$IMAGE"
    kubectl set image deployment/app app="$IMAGE" -n "$ENVIRONMENT"
    kubectl rollout status deployment/app -n "$ENVIRONMENT" --timeout=300s
    wait_for_health "https://$ENVIRONMENT.internal/health"
    log INFO "Deployment complete"
}

ENVIRONMENT="${1:-}"; IMAGE="${2:-}"
LOG_FILE="/var/log/deploy/$(date +%Y%m%d_%H%M%S).log"
mkdir -p "$(dirname "$LOG_FILE")"

[[ -z "$ENVIRONMENT" || -z "$IMAGE" ]] && die "Usage: $0 <environment> <image>"
main
```

The key disciplines: understand error-status handling and the chosen strict options, use `trap` for cleanup, validate inputs before acting on them, use `local` in functions, quote every variable reference, and log with timestamps to a file rather than just printing to stdout. A script that fails loudly and cleanly is far better than one that silently produces inconsistent state.

## Strict options are not an error-handling design

Bash's `errexit` behaviour depends on syntactic context. A command used as an `if` condition is expected to return a status the script will inspect. Commands in several conditional lists and loop tests are also exempt from automatic exit. Calling a function from such a context can change how failures inside it are treated. Read the documented semantics and handle consequential operations explicitly.

A useful pattern is to test the operation that changes state, record its status, and choose the recovery action deliberately. Do not depend on a distant `set -e` to decide whether a failed copy, deployment, or backup should be retried. `pipefail` helps expose failure in a pipeline, but it does not undo work already performed by other pipeline members.

Arithmetic commands have exit statuses too. In Bash, `(( attempts++ ))` evaluates to the old value; when that value is zero, its status is unsuccessful. Under applicable `errexit` conditions this can stop a loop unexpectedly. `attempts=$((attempts + 1))` expresses assignment without using the arithmetic expression's truth value as the command result. Test these details in the exact shell version used by automation.

## Make retries bounded and safe to repeat

Suppose a fictional health probe makes at most three attempts, each capped at two seconds, with two three-second delays between attempts. The upper bound in this simplified plan is 3 × 2 + 2 × 3 = 12 seconds, excluding process startup and scheduling overhead. The chart splits that into six seconds for attempts and six for delays. Sleeping after the final failed attempt would add delay without creating another opportunity to succeed.

A bounded count is not enough if each command can wait indefinitely. Set connection and total-request limits on the probe itself. For an operation with side effects, first establish an idempotency or reconciliation rule. Retrying “create resource” after a lost response can create duplicates unless the command has a stable identity and a way to discover prior completion.

Log attempt number, operation identity, elapsed time, and final status. Avoid logging credentials, signed URLs, or command arguments containing secrets. A retry log that prints an entire environment can cause more harm than the original transient failure. Use a non-sensitive correlation identifier when several subprocesses belong to one operation.

## Treat arguments as data

Quoting prevents unintended word splitting and pathname expansion in many common contexts. It does not make a value safe to evaluate as shell code. Avoid `eval` for constructing commands from input. Build an array of arguments and invoke the array so spaces remain within the intended argument. Use `--` where a command supports it to separate options from a filename that may begin with a dash.

For path processing, newline-delimited text is not a general filename protocol because filenames can contain newlines. When arbitrary filenames are in scope, use null-delimited tools or direct shell arrays with appropriate glob handling. If the script's contract prohibits such names, validate and document that constraint instead of silently assuming it.

Validate required option values before shifting arguments. A bare `--version` without a following value should produce usage information, not an unset-variable crash. Reject extra positional arguments if the command accepts only one environment. Prefer an explicit environment allowlist and a fixed cluster context for deployment tooling; a typo should not silently select a default production target.

## Cleanup and rollback solve different problems

An EXIT trap can remove a temporary file or release a local lock. It cannot reverse a remote database migration or guarantee that a deployment has not partially completed. Preserve the original exit status and make cleanup safe when a resource was never created. Register the trap after establishing the resource name and avoid broad deletion patterns.

Signal handling needs a stated policy. On interruption, should the script wait for a child to stop, cancel it, or leave a remote job running and print its identifier? Killing the parent does not necessarily terminate all descendants or remote actions. Test interruption in a disposable environment and verify the resulting state, rather than assuming a trap makes the operation transactional.

The deployment sketch above also needs environment-specific controls before real use: an immutable image digest, a verified Kubernetes context, workload-specific readiness, and a recovery plan for incompatible data changes. Pulling an image into the local Docker daemon does not populate the image cache on every Kubernetes node. Separate a local image check from the cluster rollout itself.

## A focused script test matrix

Use stub commands in a temporary PATH to simulate success, failure, delay, and malformed output. This allows you to exercise control flow without deploying anything. Test missing arguments, an unavailable command, a failed first attempt followed by success, all attempts failing, and interruption during the wait. Record exit status and whether temporary files remain.

Include a path with spaces and a value beginning with a dash. Verify that the script passes each as one argument and does not reinterpret it as an option. For output consumed by another program, reserve standard output for the documented result and send diagnostic logs to standard error. This makes composition predictable and avoids parsing timestamps out of a data stream.

Run a shell linter and syntax check, then inspect their findings rather than treating a clean report as proof. A linter cannot know whether a cloud operation is safe to retry or whether the selected cluster is the intended one. Those are behavioural obligations that require the test harness and the deployment contract.

When the script grows substantial state, nested parsing, complex data manipulation, or many recovery branches, consider a language with structured types and libraries. Bash is useful for composing existing commands. The right stopping point is when the shell's implicit behaviour makes the operation harder to explain and verify than an equivalent small program.

## Further reading and source boundaries

- [GNU Bash reference manual](https://www.gnu.org/software/bash/manual/bash.html)
- [GNU Coreutils: timeout](https://www.gnu.org/software/coreutils/manual/html_node/timeout-invocation.html)
- [ShellCheck project documentation](https://www.shellcheck.net/wiki/)
