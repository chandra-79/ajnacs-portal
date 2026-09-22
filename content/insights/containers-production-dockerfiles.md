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
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

## Stage 2: Runtime (only production artifacts, no build tools)
FROM node:20-slim AS runtime
WORKDIR /app

## Create non-root user
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --gid 1001 appuser

## Copy only what runtime needs
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/package.json ./

USER appuser
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

Final image contains: Node.js runtime, production node_modules, compiled dist. No TypeScript compiler, no dev dependencies, no source files.

## Layer Caching: Order Instructions by Change Frequency

Docker caches each layer. When a layer changes, all subsequent layers are invalidated. Order instructions from least-likely-to-change to most-likely-to-change:

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
