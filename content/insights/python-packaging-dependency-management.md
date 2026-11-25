---
title: "Python Packaging and Dependency Management in 2026: From requirements.txt Chaos to Reproducible Builds"
description: "The Python packaging story finally consolidated — pyproject.toml, lockfiles, and uv. What a modern, reproducible Python dependency setup looks like for teams, and how to migrate an estate of requirements.txt files without drama."
date: 2026-11-23
tags: ["Python", "Platform Engineering", "Engineering Practice", "Supply Chain Security", "Developer Experience"]
format: article
---

For twenty years, "how do I manage Python dependencies" had a dozen answers, all partially wrong: setup.py, requirements.txt, pip-tools, pipenv, poetry, conda, and a folklore layer of "well, what we actually do is…" The result was the most common failure mode in enterprise Python — *it works on my machine, fails in CI, and does something third in production*, because those three environments resolved dependencies at different times and got different trees.

That era is genuinely ending. The standards consolidated, and the tooling caught up. Here's what current-day Python dependency management looks like, and how to get an existing estate there.

## What to measure

**Reproducibility across supported environments.** Install from the lock in each supported Python and OS combination with a clean cache. If 11 of 12 jobs install and pass a smoke test, report the failing combination, package and missing wheel so teams can act. Test the built artifact as well as the editable checkout.

*Illustrative measurement. Any numbers in this example are hypothetical.*

## The consolidation: pyproject.toml won

Everything about a Python project now lives in **`pyproject.toml`** — metadata, dependencies, optional extras, build backend, and tool configuration. `setup.py` is legacy (still executable, no longer where new work goes); standalone `requirements.txt` survives only as an *export format*. The standards behind this (PEP 517/518/621 and successors) mean tools interoperate instead of inventing private universes: any modern builder can build any compliant project, and any resolver can read its requirements.

The second consolidation is newer and more consequential for teams: **uv** — the Rust-based package/project manager — has effectively become the default recommendation for new work. One binary that replaces pip, pip-tools, virtualenv, and most of poetry's project-management surface, 10–100× faster at resolution and installation, with first-class lockfiles and Python-version management (`uv python install 3.12` — it will fetch and pin interpreters too). Speed sounds like a luxury until you remember every CI job on every PR pays the install tax; estates that switched routinely cut minutes per build. (pip + pip-tools remains a fine conservative stack, and Poetry is still respectable; but if you're choosing today with no legacy constraints, the argument for uv is short.)

## The core discipline: intentions vs. resolutions

Every mature dependency setup — in any language — separates two files with two jobs:

**What you intend** (`pyproject.toml` dependencies): loose, human-edited, semantic. `fastapi>=0.110`, `pydantic~=2.7`. This expresses compatibility policy, not exact state.

**What you resolved** (the lockfile — `uv.lock`, `poetry.lock`, or a pip-tools-compiled requirements file): exact versions *and hashes* of the entire transitive tree, machine-generated, committed to git. Run `uv sync --locked` where the complete project inputs are available to check lockfile freshness without rewriting it. An existing lock can be installed using `--frozen`, which skips the freshness check. With pip, `--require-hashes` verifies the expected distribution hashes in a fully pinned requirements file. See [uv locking and syncing](https://docs.astral.sh/uv/concepts/projects/sync/).

Application deploys from the lockfile, always; upgrades happen by *deliberately* re-resolving (`uv lock --upgrade-package django`), reviewing the diff, and shipping it through the pipeline like any other change. This single discipline eliminates the works-on-my-machine class entirely: every environment installs byte-identical trees, and "what version of cryptography are we actually running?" has an answer in git history.

(Libraries — code published for others to install — keep loose constraints in `pyproject.toml` and *don't* ship lockfiles to consumers; they may still commit one for their own CI. The application/library distinction resolves most packaging arguments teams have.)

## The supporting cast

**Virtual environments stopped being a topic.** `uv sync` creates and manages `.venv` implicitly; nobody should be sourcing activate scripts in CI YAML anymore, and the global-site-packages incident genre is extinct where this is adopted.

**Private registries and supply chain:** enterprises should front PyPI with an internal proxy (Artifactory, CodeArtifact, devpi) for availability, audit, and the ability to block a poisoned release fleet-wide within minutes. Hash-checking from lockfiles plus `pip-audit`/`uv`-integrated vulnerability scanning in CI closes the loop; typosquatting and dependency confusion are boring, real, and cheap to defend against — configure the index precedence explicitly so an internal package name can never be shadowed by a public upload.

**Reproducible interpreter, too:** pin the Python version per project (`.python-version` / `requires-python`), because "3.11 locally, 3.9 in prod" is the same disease at a different layer. Container builds should install from the lockfile in a `--no-cache`, multi-stage Dockerfile — dependency layer first for caching, application code after.

**Monorepos:** uv workspaces (like Cargo/pnpm workspaces) finally make multi-package Python repos livable — one lockfile at the root, shared resolution, per-package publishing.

## Migrating an estate without drama

The good news: this migration is mechanical, service-by-service, and each step pays immediately.

1. **Inventory** what each service actually uses: `requirements.txt` files, setup.py installs, "pip install in the Dockerfile" surprises. The undocumented ones are the reason for the project.
2. **Convert intentions:** move top-level dependencies into `pyproject.toml` (uv/poetry both import from requirements files). Resist re-litigating versions during conversion — capture what is, upgrade later.
3. **Generate the lockfile and check it against the project in CI using locked mode.** This is the step that changes reliability; everything else is ergonomics.
4. **Point everything at the internal proxy** and turn on hash checking + vulnerability scanning as merge gates (warn-then-enforce, per the usual rollout playbook).
5. **Schedule the upgrade cadence:** a weekly or fortnightly automated lock-refresh PR (Renovate/Dependabot equivalents work with modern lockfiles) with test suite as arbiter. Estates that upgrade continuously in small diffs never have to do the multi-year framework leap again — the same lesson Java estates learned the expensive way.

The one-page policy worth adopting verbatim: *pyproject.toml for intentions, committed lockfile for state, CI verifies the lockfile and installs verified dependencies from approved sources, automated refresh PRs on a cadence, and no pip install anywhere outside those rails.* Python packaging spent two decades as a running joke; it's now — quietly, finally — a solved problem for teams willing to adopt the solution.

## Make the lockfile policy testable in CI

Keep separate decisions for lock freshness and installation. uv's [locking and syncing documentation](https://docs.astral.sh/uv/concepts/projects/sync/) describes the distinction between `--locked`, which checks whether the lock is up to date and rejects changes to it, and `--frozen`, which uses a lock without checking that it matches the project metadata. Choose the freshness check at the point where a change to project dependencies is reviewed. A later deployment stage working from a specifically reviewed artifact may have a different job. Record the command, interpreter and tool version for both. Running a frozen install alone does not verify that a new dependency declared in the project was included.

Pin the interpreter and define the supported operating system and processor combinations. A universal lock can name conditional requirements and distributions for several environments. Installation may select different wheels or dependency branches based on markers and compatibility tags. The desired outcome is reproducibility for each intended target, not an identical installed tree across Linux and macOS. [PyPA's platform compatibility tag specification](https://packaging.python.org/en/latest/specifications/platform-compatibility-tags/) explains how wheel tags express environment compatibility.

In a representative CI gate, verify freshness before building the distribution, build through the declared backend, and install the produced wheel into a clean environment. Execute an import test and one ordinary command or request. Editable checkouts can reach files from the source tree that the consumer installation lacks. A runtime test of the built output catches that difference. Use a separate job that starts without the shared package cache periodically. A cache can save time, yet hide that the approved registry is missing a needed artifact.

## Troubleshoot one target at a time

An illustrative packaging matrix includes two supported Python versions, two operating systems and two processor architectures, for eight combinations if all combinations are promised. Seven install and pass a smoke test. The remaining combination cannot obtain a compatible wheel for one dependency and starts an unsupported source build. Report the failing combination, locked version, applicable marker, expected wheel tag, index and installer output. Reporting an 87.5% pass rate alone disguises the fact that a promised configuration has no usable install path.

Decide what triggered the source build. The configured index may have an incomplete mirror, the package may not publish the required wheel, or the selected Python version may be outside the supported range. A successful developer build from cached artifacts does not establish that a clean installer can reach them. Test resolution and installation with the approved index configuration and distinguish authentication errors from missing packages. If a target requires source builds, account for the build backend, build dependencies, compiler and system libraries that enter reproducibility. Build a controlled wheel and verify the exact shipped artifact where reliable operations require it.

Also separate application requirements from developer conveniences. Tests and formatters need a reproducible developer environment, but are not automatically part of production runtime. Install the production selection and run a smoke test before declaring it valid. A test suite that imports a runtime requirement from a development-only group can otherwise pass while the deployed application crashes for lack of that import.

## Preserve the identity of the deployed artifact

A lock describes dependency resolution. Extend release identity to the project's source revision, build backend, interpreter, base image and published artifact digest. Two builds using the same application lock can still embed different system libraries or include different application files. If a supply-chain policy compares digests, keep separate steps for inspecting a lock diff, recording which distributions were used, and attesting to the resulting image or wheel. [PyPA's pyproject.toml specification](https://packaging.python.org/en/latest/specifications/pyproject-toml/) distinguishes project metadata from build-system requirements, which have their own roles in a reproducible release.

Keep promotion separate from rebuilding. An example release process builds a wheel once, verifies that exact wheel in the supported runtime and carries its digest into deployment metadata. A later environment promotes that artifact rather than resolving dependencies again under a different registry or tool version. Keep the previous artifact and its runtime for a bounded reversal window. If a dependency becomes restricted, an approved rollback must still honor the organization's policy. Test the procedure to restore a supported previous release without widening package or index permissions.

Treat registry names and indexes as reviewed configuration. Authorize internal dependencies through explicitly intended indexes where the tool supports it. A lock and artifacts sourced from the wrong repository can be consistent but fail the organization's provenance requirement. Keep sensitive credentials out of the lock, command output and artifacts. Use an approved credential mechanism in CI and verify removal from captured build logs. For a withdrawn dependency, practice rebuilding from known, permitted artifacts or delivering a reviewed update rather than relying on whatever public copy can still be fetched.

## Stage a migration that changes one dependency decision at a time

Compare an existing installation and a locked proposal for each meaningful target. Save both resolved package sets and check the difference before changing versions. Record which exact dependency and import each test exercises, including optional configuration such as image codecs or a database adapter. Run one test that executes the packaged main command and one that exercises a binary dependency on the target node. Record cache-warm and clean-cache timing separately to avoid attributing environmental changes to the new tool.

Where a diff also upgrades transitive dependencies, decide whether the version movement is needed for the migration or can be reviewed independently later. Smaller reviews make it easier to identify a compatibility regression. After adopting a lockfile, deliberately amend project metadata without refreshing it in a temporary test branch and verify that the freshness gate fails. Verify that a clean reinstall of an older approved artifact can still be performed from intended sources. Keep a runbook that says who owns lock refreshes and how to test target-specific breakage. Dependable promotion comes from connecting project intent, resolution and observed deployed behavior.
