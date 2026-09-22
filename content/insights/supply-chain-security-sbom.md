---
title: "Software Supply Chain Security: SBOM, Dependency Auditing, and What Actually Reduces Risk"
description: "The software supply chain attack surface is large and growing. SBOMs, dependency scanning, and provenance verification are the practical measures that reduce real risk — here's what each covers and where the gaps are."
date: 2025-08-18
tags: ["DevSecOps", "Architecture"]
format: article
---

The SolarWinds and Log4Shell incidents changed how the industry thinks about software supply chain risk. Both showed the same vulnerability: organizations had extensive perimeter controls and almost no visibility into what software they were actually running and whether it contained known vulnerabilities.

Software Bill of Materials (SBOM) and supply chain security practices exist to address this. The challenge is that the tooling is maturing, the standards are still evolving, and the gap between "we generate an SBOM" and "we have meaningful supply chain security" is significant.

## What an SBOM actually is

A Software Bill of Materials is a formal, machine-readable list of the components in a piece of software — libraries, frameworks, and their transitive dependencies — with version information and license data. Think of it as the ingredient list for software.

SBOM formats:
- **SPDX** (Software Package Data Exchange) — Linux Foundation standard, widely supported
- **CycloneDX** — OWASP standard, focused on security use cases, strong tooling ecosystem

Most software today ships without a published SBOM. The US Executive Order on Cybersecurity (May 2021) created requirements for software sold to the US federal government; this has accelerated adoption in commercial software as well.

## Generating an SBOM

SBOM generation is now straightforward for most technology stacks:

```bash
## For container images using Syft
syft ubuntu:latest -o cyclonedx-json > sbom.json

## For Node.js projects
npx @cyclonedx/cyclonedx-npm --output-format JSON > sbom.json

## For Python projects
pip-audit --format=cyclonedx-json > sbom.json

## For Java/Maven
mvn org.cyclonedx:cyclonedx-maven-plugin:makeAggregateBom
```

The SBOM should be generated as part of the build pipeline and stored alongside the artifact it describes. If you are releasing version 2.1.4 of your service, the corresponding SBOM should be retrievable for that specific version.

## Vulnerability scanning against the SBOM

A generated SBOM is primarily useful for vulnerability scanning: cross-referencing the component list against known vulnerability databases (NVD, OSV, GHSA).

```bash
## Grype vulnerability scanner against a generated SBOM
grype sbom:sbom.json

## Or directly against an image
grype my-app:latest
```

The important distinction: vulnerability presence is not the same as vulnerability exploitability. A critical CVE in a library is only exploitable if the vulnerable code path is reachable in your application. Grype and similar scanners report presence; determining exploitability requires more analysis. Start by prioritizing CVSS score above 7 and direct dependencies over transitive ones.

Integrate scanning into CI:
```yaml
## GitHub Actions example
- name: Scan for vulnerabilities
  uses: anchore/scan-action@v3
  with:
    image: "${{ steps.build.outputs.image }}"
    fail-build: true
    severity-cutoff: critical
```

## Provenance and build attestation

Knowing what is in your software is different from knowing that your software was built from the code you think it was. Supply chain attacks like the SolarWinds compromise tamper with build artifacts after code review but before deployment.

SLSA (Supply chain Levels for Software Artifacts) is a framework that defines levels of build integrity:

- **SLSA Level 1**: build process is scripted; SBOM and provenance are generated
- **SLSA Level 2**: version control, build service generates provenance
- **SLSA Level 3**: hardened build environment, non-falsifiable provenance

In practice for most organizations: SLSA Level 2 provides meaningful protection. Build in a controlled CI environment (not developer laptops), sign artifacts cryptographically, and generate provenance attestation that records what source commit was built and by what build process.

Sigstore/Cosign has become the standard toolchain for signing container images and recording provenance:

```bash
## Sign a container image
cosign sign --key cosign.key my-registry/my-app:v1.2.3

## Verify a signed image
cosign verify --key cosign.pub my-registry/my-app:v1.2.3
```

## Dependency management hygiene

SBOMs and scanning are detective controls. The preventive controls that reduce supply chain risk:

**Pin dependencies to specific versions** rather than ranges. `requests==2.31.0` not `requests>=2.20`. Unpinned dependencies allow supply chain attacks via a malicious version being published to a package registry.

**Lock files**: `package-lock.json`, `poetry.lock`, `Pipfile.lock`, `go.sum`. These record the exact resolved versions of all transitive dependencies. Without them, `npm install` in CI may resolve to different package versions than what was tested locally.

**Private package mirror with allowlist**: mirror approved packages to an internal registry (JFrog Artifactory, AWS CodeArtifact, GitHub Packages). Builds pull from your mirror only. This blocks dependency confusion attacks and gives you a control point for new package approvals.

**Automated dependency updates**: tools like Dependabot and Renovate automatically open PRs when dependencies release new versions. Keeping dependencies current significantly reduces the window of exposure to known vulnerabilities.

The supply chain security posture that matters: knowing what you're running, knowing whether it has known vulnerabilities, and having a process to respond when new vulnerabilities are disclosed for components you depend on.

*Building out a supply chain security program or integrating SBOM generation into an existing CI/CD pipeline? [Happy to share what the implementation looks like at scale.](/contact)*
