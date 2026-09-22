---
title: "Reading Code Is a Skill. Most Programmers Never Deliberately Practice It."
description: "Writing code is half the job. Reading and understanding unfamiliar code — especially at scale — is the other half, and it determines how fast you grow as an engineer."
date: 2028-05-22
tags: ["Programming", "Fundamentals"]
series: "Getting Started with Programming Languages"
seriesOrder: 5
format: article
---

Writing code gets most of the attention in programming education. It is the visible, creative part of the work. But professional software engineering involves reading far more code than writing it — reading your own code six months later, reading the library your team depends on, reading the unfamiliar service you inherited, reading the code causing a production incident at 2am. The engineer who reads well moves faster, debugs better, and learns from every codebase they touch.

Reading code is a distinct skill from writing it. Here is how to practise it deliberately.

## Start with the Entry Point

Every program has a starting point. Find it before reading anything else.

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

Tests describe intended behaviour in executable form. They are the best documentation a codebase has, and unlike comments, they cannot become outdated without becoming visibly broken.

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
