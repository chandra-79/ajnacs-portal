---
title: "Shell Scripting: Writing Bash Scripts That Actually Work in Production"
description: "Variables, conditionals, loops, functions, error handling, and the specific practices that separate a shell script that works once from one that runs reliably in production automation."
date: 2026-08-03
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 8
format: article
---

Shell scripts are everywhere in production Linux environments — deployment pipelines, cron jobs, backup procedures, health checks, and system initialization. Scripts written without structure or error handling work on the first run and fail silently in the worst circumstances. This lesson covers bash scripting from the essentials to the practices that make scripts production-ready.

## The Script Header

Every production script starts the same way:

```bash
#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'
```

**`#!/usr/bin/env bash`**: the shebang line. Tells the OS to execute this file with bash. Using `env bash` rather than `/bin/bash` makes the script portable — it finds bash in the user's PATH rather than requiring a fixed location.

**`set -euo pipefail`**: the three flags that make scripts fail safely:
- `-e`: exit immediately if any command returns a non-zero exit code
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
file_count=$(find /var/log -name "*.log" | wc -l)

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
while [[ "$status" != "ready" && $attempts -lt 30 ]]; do
    status=$(check_deployment_status)
    sleep 5
    (( attempts++ ))
done

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
    local timeout="${2:-30}"    # second argument with default

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
    shift 2

    for (( i=1; i<=attempts; i++ )); do
        if "$@"; then
            return 0
        fi
        log_info "Attempt $i/$attempts failed. Retrying in ${delay}s..."
        sleep "$delay"
    done
    return 1
}

retry 3 5 curl -sf "https://api.service.internal/health"
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
        --version|-v) VERSION="$2"; shift 2 ;;
        --dry-run|-n) DRY_RUN=true; shift ;;
        --help|-h)    usage 0 ;;
        -*)           echo "Unknown option: $1" >&2; usage 1 ;;
        *)            ENVIRONMENT="$1"; shift ;;
    esac
done

[[ -z "${ENVIRONMENT:-}" ]] && { echo "ENVIRONMENT required" >&2; usage 1; }
[[ "$ENVIRONMENT" =~ ^(production|staging|development)$ ]] || die "Invalid: $ENVIRONMENT"
```

## A Complete Production Script

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
    for (( i=1; i<=30; i++ )); do
        curl -sf "$endpoint" >/dev/null && log INFO "Health OK" && return 0
        sleep 5
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

The key disciplines: always `set -euo pipefail`, use `trap` for cleanup, validate inputs before acting on them, use `local` in functions, quote every variable reference, and log with timestamps to a file rather than just printing to stdout. A script that fails loudly and cleanly is far better than one that silently produces inconsistent state.
