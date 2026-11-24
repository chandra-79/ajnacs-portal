---
title: "Writing Production-Grade Dockerfiles: The Decisions That Actually Matter"
description: "Multi-stage builds, minimal base images, layer caching, non-root users, build arguments, and the specific Dockerfile patterns that separate a working image from a secure, efficient, maintainable one."
date: 2026-06-24
tags: ["DevSecOps", "Fundamentals"]
series: "Containerization from the Ground Up"
seriesOrder: 2
format: article
---

Most Dockerfiles work. Few Dockerfiles are production-grade. The difference shows up in image size (which affects pull time and cold start), build speed (which affects developer experience and CI runtime), and security posture (which affects your attack surface). This lesson covers the specific decisions that move a Dockerfile from working to production-ready.

## What to measure

**Image weight and build time.** If a multi-stage build reduces the compressed registry image from 480 MB to 120 MB, that is 75% less transfer per cold pull. Record cold and warm build durations separately and verify the runtime libraries still meet application needs.

*Illustrative measurement. Any numbers in this example are hypothetical.*

## Start with the Right Base Image

The base image determines your starting attack surface, your image size, and what package manager is available.

```dockerfile
## Avoid: full OS images with unnecessary tools
FROM ubuntu:22.04

## Better: distribution-specific slim variants
FROM python:3.12-slim

## Best for most statically compiled apps: distroless (no shell, no package manager)
FROM gcr.io/distroless/python3-debian12

## For Go, Rust binaries: scratch (empty filesystem)
FROM scratch
COPY my-binary /my-binary
CMD ["/my-binary"]
```

**Alpine** is commonly recommended for minimal size (5MB base). Use it cautiously: Alpine uses musl libc instead of glibc, which causes compatibility issues with some Python packages and compiled binaries that link against glibc.

**Distroless** images (from Google) contain only the runtime — no shell, no package manager, no system utilities. This dramatically reduces attack surface because there is nothing for an attacker to use inside the container. The trade-off: debugging requires running a debug-variant image.

## Multi-Stage Builds: Separate Build from Runtime

The build environment needs compilers, package managers, and build tools. The runtime environment does not. Multi-stage builds keep the build dependencies out of the production image.

```dockerfile
## Stage 1: Build
FROM node:24-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

## Stage 2: Install production dependencies from the same lockfile
FROM node:24-slim AS production-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

## Stage 3: Runtime
FROM node:24-slim AS runtime
WORKDIR /app

## Create non-root user
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --gid 1001 appuser

## Copy only what runtime needs
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=production-deps --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/package.json ./

USER appuser
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

Final image contains: Node.js runtime, production node_modules, compiled dist. No TypeScript compiler, no dev dependencies, no source files.

## Layer Caching: Order Instructions by Change Frequency

A cache miss invalidates later instructions that depend on that result in the build stage. Independent stages follow their own dependencies. Order instructions from least-likely-to-change to most-likely-to-change:

```dockerfile
## Bad: changes to requirements invalidate package install cache
FROM python:3.12-slim
COPY . /app          # <-- changes every code edit
RUN pip install -r /app/requirements.txt  # reinstalled every time

## Good: dependencies installed before source code is copied
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt ./          # rarely changes
RUN pip install --no-cache-dir -r requirements.txt   # cached until requirements change
COPY . .                          # changes frequently; only this layer rebuilds
CMD ["python", "main.py"]
```

## Run as Non-Root

By default, containers run as root inside the container namespace. This is unnecessary for almost all applications and creates security risk.

```dockerfile
## Create a system user and group
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup --no-create-home appuser

## Own the application directory
RUN chown -R appuser:appgroup /app

## Switch to non-root
USER appuser
```

In Kubernetes, you can enforce this at the cluster level with PodSecurity admission or OPA/Gatekeeper policies that reject containers running as root.

## Use .dockerignore

The build context (everything sent to the Docker daemon) should exclude files the image does not need:

```
## .dockerignore
.git/
.gitignore
*.md
tests/
.env
.env.*
node_modules/
__pycache__/
*.pyc
.pytest_cache/
coverage/
```

A missing `.dockerignore` on a large repository can send gigabytes of context to the Docker daemon on every build, even when no relevant file changed.

## Useful Image Analysis

```bash
## Analyse image layers and size contributions
docker history --no-trunc my-image:latest

## Deep dive with dive (install separately)
dive my-image:latest

## Scan for known vulnerabilities
docker scout cves my-image:latest
trivy image my-image:latest
grype my-image:latest

## Check image for non-root, read-only filesystem, dropped capabilities
docker run --rm -it \
  --cap-drop ALL \
  --read-only \
  --tmpfs /tmp \
  my-image:latest
```

A production Dockerfile review checklist:
- Non-root user defined and `USER` instruction applied
- Multi-stage build separating builder from runtime
- `.dockerignore` present and correct
- Base image pinned to a specific digest, not `latest`
- No secrets or credentials in any layer (use build secrets or environment variables at runtime)
- Image scanned for CVEs before registry push
- Image size is reasonable (< 200MB for most web applications; < 50MB for Go binaries)

## Start with the runtime contract

Define the exact command, required files, user identifier, writable paths, signal behavior, and dependencies before reducing image size. Run a representative request in Linux with the same architecture and constraints as production. In a container that writes temporary files, include expected writable mounts in the test. Check that data written during verification does not silently depend on the container's default writable layer when production requires a separate volume or a read-only root filesystem. Ensure that the process behaves when it cannot write to its application directory. A build that produces the expected digest but fails under the production runtime contract is not ready for deployment.

For compiled applications, separate build tooling from runtime dependency installation. A TypeScript or bundle build can need packages in development dependencies even though the final process does not. Verify that the build stage installs the compiler and build tools, and that the runtime stage receives a separately prepared production dependency set or a verified self-contained artifact. Native modules may need architecture and library compatibility between stages. Test them by starting the final container and reaching the actual functionality rather than seeing whether a base image's package list looks complete.

## Validate reproducibility rather than assuming it

Pinning a base digest establishes which base the builder used. Use the application's lockfile and a repeatable install process, then record the source revision, base digests, architecture, and builder configuration for a release. If you intentionally update base digests, send the change through automated verification rather than silently switching the runtime environment. A narrow base reduces the packages you have to maintain. Its security value also depends on how promptly you can obtain and roll out a usable replacement.

Ensure the policies apply to every stage that can influence the output. If a build reads a private test fixture or an access token, keep it out of the build context and use the builder's scoped secret mechanism when a credential is required during a step. Do not put sensitive values in Dockerfile arguments or environment metadata. A value omitted from the final application filesystem may still appear in histories, caches, or logs. Confirm what the builder exports and who can read it. [Docker's build secrets guide](https://docs.docker.com/build/building/secrets/) explains why secret mounts are preferred over build arguments for this purpose.

## Measure cold and warm behavior independently

Consider a fictional rollout of 20 nodes. A runtime image has 150 decimal MB of transferable layers missing on each node during a cold rollout. The nominal transfer for those layers is 3,000 MB, or three decimal GB, if each node pulls them once. After a routine code update, only a 35 MB application layer changes and all shared layers remain present. The nominal transfer is about 700 MB across all nodes under those assumptions. These figures leave out protocol overhead, retries, compression differences, and caching elsewhere. They explain why a cold-pull test and a routine release test are different and why total image size alone does not predict either one.

Time the path from creating a container to an eligible user request. Separate scheduling, downloading layers, starting the process, warming caches, and reaching the first successful response. If download accounts for a small share of the total and application startup dominates, prioritize where time actually goes. Also capture rebuild time for a small source edit, a dependency update, and a base refresh. Build caches are beneficial only when the right step is reused. Compare results on the same architecture and test a clean build with no local cache before declaring inputs complete.

## Review the release artifact and recovery path

Test the resulting image with explicit access boundaries, using only the capabilities and mounts the application needs. Exercise shutdown with an in-flight request and verify the exit behavior of the actual entrypoint. Some lightweight images omit a shell, so choose an approved debugging mechanism ahead of the incident. It could be a purpose-built test image, runtime diagnostics, or an observability signal that eliminates the need to inspect a running task interactively. Keep the debug workflow authorized and distinct from the image approved for routine production.

Write a short acceptance record containing the image and test digests, relevant compatibility checks, inventory results, and downgrade or rollback plan. Inspect the size increase of a new release in context. An intentional addition to support a critical compatibility requirement differs from an unnecessary compiler accidentally bundled into the runtime image. [Docker's build best practices](https://docs.docker.com/build/building/best-practices/) describes how build context, stages, and base-image choices affect the artifact. Verify the decisions against what the image actually does when the service is deployed.
