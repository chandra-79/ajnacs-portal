---
title: "Python Performance: Profile First, Then Pick Your Weapon"
description: "A working method for making Python faster — production-safe profiling with py-spy, the optimization ladder from algorithm to NumPy to Rust extensions, and what free-threaded CPython actually changes."
date: 2025-02-12
tags: ["Python", "Performance", "Profiling", "Programming"]
format: article
---

Python performance conversations tend to skip straight to religion — "rewrite it in Rust," "PyPy exists," "just use multiprocessing" — before anyone has measured anything. Meanwhile the actual slow code, once profiled, is usually doing something embarrassingly fixable: an N+1 query, a quadratic loop over a list that should have been a set, JSON re-parsed inside a hot loop.

The craft is a sequence: measure honestly, fix the algorithmic sins, and only then reach up the ladder of heavier machinery. Here's that sequence as I practice it.

## Measure first: the profiler decision

Different questions need different profilers, and using the wrong one wastes the afternoon.

**"Why is production slow right now?"** → **py-spy**. It's a sampling profiler that attaches to a *running* process with no code changes, no restart, and negligible overhead: `py-spy dump --pid 1234` for an instant stack snapshot of all threads (the single fastest diagnostic in Python operations — the pandas of thread dumps), `py-spy record -o profile.svg --pid 1234` for a flame graph over 60 seconds of real traffic. Production-safe by design. Every Python-running team should have it installed wherever Python runs.

**"Where does this endpoint/job spend its time?"** → sampling profilers in development too: py-spy against a load test, or **Austin**/pyinstrument for wall-clock views that show where time *passes* (including waiting on I/O) rather than only where CPU burns. Wall-clock vs CPU-time is the key reading skill: a flame graph that's 80% `socket.recv` says your Python is fine and your downstream is slow — an entirely different project than 80% in `_parse_row`.

**"What exactly does this function do per line?"** → deterministic tools once you've localized the suspect: `cProfile` + snakeviz for call-graph accounting, `line_profiler` for line-by-line, `memray` when the question is allocations rather than CPU (memory profiling reveals a surprising amount of *time* — allocation churn is CPU cost wearing a memory costume).

The habit that matters more than tooling: profile against **realistic data sizes**. Python's performance cliffs are usually complexity cliffs, invisible at dev-database scale and catastrophic at production scale.

## The optimization ladder: cheapest rung first

**Rung 1: Algorithms and data structures.** The majority of real-world Python slowness dies here. Membership tests against lists instead of sets/dicts (O(n) vs O(1) — inside a loop, that's the whole story). String concatenation in loops instead of `"".join`. Re-compiling regexes, re-parsing config, re-opening connections per iteration. Sorting when a heap or `max` would do. And the database N+1, which is an algorithm problem that lives in the ORM. None of this is Python-specific advice, but Python's convenience makes the sins frictionless to commit — and its interpreter overhead makes each one 10–50× more expensive than in compiled languages.

**Rung 2: Make the standard machinery do the work.** Built-ins and the stdlib run in C: comprehensions over manual loops, `collections.Counter`/`defaultdict`/`deque` over hand-rolled equivalents, `itertools` for streaming instead of materializing intermediate lists, generators to keep memory flat. `functools.lru_cache` on pure hot functions is a one-decorator order-of-magnitude win when inputs repeat. Also on this rung: upgrade CPython itself — the 3.11–3.13 era delivered real interpreter speedups (double-digit percentages for typical code) for the cost of a version bump, and the JIT maturing through 3.13+ keeps adding.

**Rung 3: Vectorize or delegate.** When the hot loop is numeric or tabular, the answer is almost never "optimize the Python loop" — it's "eliminate it": NumPy/pandas vectorization (or Polars, whose lazy engine and parallelism have made it the modern default for heavy dataframe work) moves the iteration into compiled code operating on whole arrays. The mental shift is from "for each row" to "for this column"; a 100× speedup from vectorizing a per-row `apply` is unremarkable.

**Rung 4: Compile the hot spot.** When profiling shows a genuinely algorithmic, genuinely hot Python function that can't vectorize: **Cython** (annotate types, compile — mature, boring, effective), **Numba** (`@njit` for numerical kernels — spectacular when it fits), or increasingly the modern default, a small **Rust extension via PyO3/maturin** — memory-safe, pleasant tooling, and easy to hire for enthusiasm if not yet experience. The discipline on this rung: compile the *5%* the profiler named, keep the interface thin, and resist the creeping rewrite. If truly everything is hot, that's not rung 4; that's a language-choice conversation to have honestly.

**Rung 5: Parallelism — with the 2026 asterisk.** The classical rules: `multiprocessing`/`ProcessPoolExecutor` for CPU-bound fan-out (serialization cost at the boundary is the tax — chunk work coarsely), threads or asyncio for I/O-bound concurrency, where the GIL was never your problem anyway. The asterisk: **free-threaded CPython** (the no-GIL build, official since 3.13 and maturing through 3.14+) changes the endgame — real multi-core threading without process boundaries — but the ecosystem's C extensions are still catching up on compatibility and single-thread overhead exists; treat it as "benchmark for your workload," not yet default. For workloads where it fits, it deletes the most awkward architecture Python ever forced on anyone (the process-pool-plus-shared-memory contraption).

## Keeping it fast: performance as a tested property

One-off optimization sprints decay; the durable version is institutional. Put **benchmarks in CI** (`pytest-benchmark` or ASV) for the code paths that earned optimization — a regression gate that fails when someone's innocent refactor re-introduces the quadratic loop. Keep **py-spy in every production image** and dashboards on p95/p99 per endpoint, because the profile that matters is the one under real traffic. And write down the *budget*: "this pipeline processes the nightly file in under 20 minutes" is a testable requirement; "should be fast" is a mood.

The uncomfortable, liberating truth about Python performance: the language is rarely the first problem, and by the time it genuinely is, the profiler has usually pointed at 200 lines that want to be NumPy or Rust — not at the other hundred thousand lines that are perfectly happy where they are. Measure, climb the ladder one rung at a time, and stop when the budget is met. Undirected optimization is just refactoring with extra steps and a worse commit message.
