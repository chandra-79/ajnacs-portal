---
title: "Python Packaging and Dependency Management in 2026: From requirements.txt Chaos to Reproducible Builds"
description: "The Python packaging story finally consolidated — pyproject.toml, lockfiles, and uv. What a modern, reproducible Python dependency setup looks like for teams, and how to migrate an estate of requirements.txt files without drama."
date: 2025-02-10
tags: ["Python", "Platform Engineering", "Engineering Practice", "Supply Chain Security", "Developer Experience"]
format: article
---

For twenty years, "how do I manage Python dependencies" had a dozen answers, all partially wrong: setup.py, requirements.txt, pip-tools, pipenv, poetry, conda, and a folklore layer of "well, what we actually do is…" The result was the most common failure mode in enterprise Python — *it works on my machine, fails in CI, and does something third in production*, because those three environments resolved dependencies at different times and got different trees.

That era is genuinely ending. The standards consolidated, and the tooling caught up. Here's what current-day Python dependency management looks like, and how to get an existing estate there.

## The consolidation: pyproject.toml won

Everything about a Python project now lives in **`pyproject.toml`** — metadata, dependencies, optional extras, build backend, and tool configuration. `setup.py` is legacy (still executable, no longer where new work goes); standalone `requirements.txt` survives only as an *export format*. The standards behind this (PEP 517/518/621 and successors) mean tools interoperate instead of inventing private universes: any modern builder can build any compliant project, and any resolver can read its requirements.

The second consolidation is newer and more consequential for teams: **uv** — the Rust-based package/project manager — has effectively become the default recommendation for new work. One binary that replaces pip, pip-tools, virtualenv, and most of poetry's project-management surface, 10–100× faster at resolution and installation, with first-class lockfiles and Python-version management (`uv python install 3.12` — it will fetch and pin interpreters too). Speed sounds like a luxury until you remember every CI job on every PR pays the install tax; estates that switched routinely cut minutes per build. (pip + pip-tools remains a fine conservative stack, and Poetry is still respectable; but if you're choosing today with no legacy constraints, the argument for uv is short.)

## The core discipline: intentions vs. resolutions

Every mature dependency setup — in any language — separates two files with two jobs:

**What you intend** (`pyproject.toml` dependencies): loose, human-edited, semantic. `fastapi>=0.110`, `pydantic~=2.7`. This expresses compatibility policy, not exact state.

**What you resolved** (the lockfile — `uv.lock`, `poetry.lock`, or a pip-tools-compiled requirements file): exact versions *and hashes* of the entire transitive tree, machine-generated, committed to git. This is what CI and production install — with `--frozen`/`--require-hashes` semantics so the build fails loudly if the lock is stale or a package's content changes.

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
3. **Generate the lockfile, make CI install from it frozen.** This is the step that changes reliability; everything else is ergonomics.
4. **Point everything at the internal proxy** and turn on hash checking + vulnerability scanning as merge gates (warn-then-enforce, per the usual rollout playbook).
5. **Schedule the upgrade cadence:** a weekly or fortnightly automated lock-refresh PR (Renovate/Dependabot equivalents work with modern lockfiles) with test suite as arbiter. Estates that upgrade continuously in small diffs never have to do the multi-year framework leap again — the same lesson Java estates learned the expensive way.

The one-page policy worth adopting verbatim: *pyproject.toml for intentions, committed lockfile for state, CI installs frozen with hashes from the internal proxy, automated refresh PRs on a cadence, and no pip install anywhere outside those rails.* Python packaging spent two decades as a running joke; it's now — quietly, finally — a solved problem for teams willing to adopt the solution.
