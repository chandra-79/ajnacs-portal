---
title: "Reading Unfamiliar Code: Trace Behaviour and Check Your Assumptions"
description: "Practise reading a real execution path, finding its state changes, and verifying the contract with focused tests."
date: 2028-09-06
tags: ["Programming", "Fundamentals"]
series: "Getting Started with Programming Languages"
seriesOrder: 5
format: article
---

Writing code gets most of the attention in programming education. It is the visible, creative part of the work. But professional software engineering involves reading far more code than writing it — reading your own code six months later, reading the library your team depends on, reading the unfamiliar service you inherited, reading the code causing a production incident at 2am. The engineer who reads well moves faster, debugs better, and learns from every codebase they touch.

Reading code is a distinct skill from writing it. Here is how to practise it deliberately.

## Start with the Entry Point

Find the entry point for the behaviour you are investigating. Applications can have several entry points, and framework initialisation may execute before the handler you care about.

- Python script: the `if __name__ == "__main__":` block, or the first function called
- Python web app (Flask/FastAPI): the route handlers
- Java application: the `main` method
- Go program: `func main()` in `main.go`
- JavaScript Node.js app: the top-level execution in the entry file

The entry point tells you what the program does first. From there, you follow the execution path rather than reading files top to bottom. Top-to-bottom reading is how humans read prose. Code is not prose — it is a graph of execution, and you navigate it by following calls.

## Read the Public Interface Before the Implementation

Before reading a function's body, read its signature:

```python
def calculate_cost_allocation(
    resources: list[Resource],
    allocation_strategy: AllocationStrategy,
    billing_period: BillingPeriod,
    include_shared: bool = True,
) -> CostReport:
```

This tells you: what goes in, what comes out, and what the function needs to make a decision (`include_shared`). The implementation details — how the calculation is performed — are secondary to understanding what the function contracts to do.

Read module-level or class-level documentation before function bodies. Read function signatures before function bodies. Read the high-level flow before the individual steps.

## Follow One Path Completely

Resist the urge to read everything. Instead, choose one execution path — one user action, one API call, one event — and follow it from entry to exit through every function call it makes.

```
HTTP request → route handler → validation → service layer → repository → database query → response
```

Tracing one complete path gives you more understanding than skimming every file. You learn the layering, the data transformations, and the error handling in context rather than in isolation.

## Build a Mental Map of the Data

In any non-trivial program, the most important thing to understand is the data: what it is, where it comes from, how it transforms, and where it ends up.

As you read, track:
- The main data structures the program operates on
- Where data enters the program (user input, database, API, file)
- Where data leaves the program (response, database write, file output)
- How the data changes shape between entry and exit

When you understand the data flow, you understand the program. Functions are just the operations that transform the data.

## Use the Tests as Documentation

Tests describe intended behaviour in executable form. They are useful executable evidence, but can remain green while requirements change or mocks diverge from reality. Read their assertions and assumptions critically.

When reading unfamiliar code, look for the test file alongside the implementation file. A test like:

```python
def test_cost_allocation_excludes_shared_when_flagged():
    report = calculate_cost_allocation(
        resources=sample_resources,
        allocation_strategy=ByTag("team"),
        billing_period=LAST_MONTH,
        include_shared=False,
    )
    assert report.shared_cost == 0.0
    assert report.total == report.direct_cost
```

tells you more about what `calculate_cost_allocation` is supposed to do than the function body alone, because it shows the expected input-output relationship in a concrete, readable form.

## Practise on Real Codebases

The skill compounds through practice on real code, not toy examples. Productive starting points:

- **CPython** (the Python interpreter itself): well-organised, extensively documented, excellent for understanding how a language runtime works
- **FastAPI**: clean, modern Python with excellent type annotations and a well-structured codebase
- **Go standard library**: the Go authors write very clean, readable Go; studying the `net/http` package rewards the time
- **Kubernetes source**: large, complex, real production code — appropriate once you are comfortable with Go and want to understand cloud infrastructure

The practice: pick a specific feature, find the entry point for that feature, and trace one execution path completely. Write down what you find. Summarise what the code does in a paragraph. If you cannot, read it again.

The engineer who can read code they did not write, quickly and accurately, has access to every library, every open-source project, and every codebase as a learning resource. That is a compounding advantage that grows for the length of a career.

## Begin with a question that can be answered

Reading an unfamiliar repository becomes tractable when the investigation has a concrete question. For a fictional invoice service, use: “What prevents a retried request from creating a second invoice?” This directs attention to request identity, transaction boundaries, persistence, and response handling. Reading every utility file alphabetically would not answer it efficiently.

Find the route registration and middleware as well as the handler. Authentication, body parsing, dependency injection, and exception translation may happen before or around the visible function. In a worker application, the meaningful entry point may be an event subscription rather than `main`. Framework startup and module import side effects can also matter. An entry point is a hypothesis about execution, not merely a filename convention.

Keep a reading notebook with three columns: observation, inference, and unresolved question. “The handler calls `save_invoice` inside a transaction block” is an observation. “The request is atomic” is an inference that needs checking: another write or external call may occur outside that transaction. Marking the difference prevents plausible explanations from turning into unsupported certainty.

## Trace one synthetic request with a ledger

Suppose the request path contains eight meaningful boundaries: authentication, input parsing, account lookup, duplicate lookup, invoice construction, database commit, event publication, and response formatting. You have verified five from code and tests; three remain uncertain. The chart records five verified and three unresolved boundaries in this invented exercise. It is an investigation checklist, not a code-quality score or measured onboarding benchmark.

For each boundary, record input shape, output shape, state changed, error path, and retry behaviour. A database method named `get_or_create` does not prove atomicity. Read its implementation and the relevant uniqueness constraint. An event method named `publish` does not prove durable delivery. Locate where acknowledgement occurs and what happens when the caller times out.

Follow one failure path after the success path. For example, make the event publisher fail after the invoice transaction commits in a disposable test environment. Does the API return an error, does a durable outbox retain the event, or does the system lose the notification? The answer changes how a client should retry. Do not infer it from a method name or an architecture diagram alone.

## Use tests as evidence with limits

A test can be green while the requirement it encodes is obsolete. It can also use a mock whose behaviour differs from the real dependency. Read the assertions, fixtures, and setup alongside the test name. Ask what would have to change for the test to fail. If removing duplicate detection leaves the test green, that test is not evidence for duplicate protection.

Add a focused characterisation test only when it clarifies a meaningful behaviour. Use synthetic identifiers and a disposable database. First demonstrate the existing result, then decide whether that result is intended. A characterisation test records what the system does; it does not automatically endorse the behaviour. Keep that distinction visible in the test description or issue.

Static types and documentation provide additional evidence, but neither replaces execution. A return type might exclude an error that is raised as an exception. A comment might describe a prior implementation. Compare the contract across the public documentation, type signature, implementation, and tests. Investigate disagreement rather than choosing the most reassuring source.

## Avoid changing the system while learning it

Use a local checkout, read-only access, and synthetic data where possible. Running a repository's default command can trigger migrations, contact cloud services, or send notifications. Read startup scripts and environment requirements before executing them. The goal is to understand one path without creating unrelated state that obscures the investigation.

A debugger can help when dynamic dispatch or framework wiring makes call paths hard to see. Set a breakpoint at the relevant boundary and inspect only the data needed for the question. Avoid exporting secrets or customer payloads in screenshots and notes. For asynchronous code, correlate task or request identifiers so a trace does not combine unrelated executions.

Finish with a short explanation someone else can challenge: the request is identified by this key, this constraint prevents concurrent duplicates, this transaction stores the invoice and event intent, and this worker retries delivery. Link each statement to evidence and list any remaining uncertainty. That explanation is the durable output of reading code. The number of files opened is not a useful substitute.

## Further reading and source boundaries

- [Python developer guide: exploring CPython internals](https://devguide.python.org/internals/exploring/)
- [Python: debugger](https://docs.python.org/3.12/library/pdb.html)
- [Go: net/http reference and source links](https://pkg.go.dev/net/http)
