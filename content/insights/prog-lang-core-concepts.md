---
title: "Variables, Types, Control Flow and Functions: A Practical Introduction"
description: "Learn four useful programming concepts through explicit inputs, boundary cases, and a small cost calculator."
date: 2028-05-22
tags: ["Programming", "Fundamentals"]
series: "Getting Started with Programming Languages"
seriesOrder: 3
format: article
---

Variables, types, control flow, and functions are four useful concepts for learning many mainstream languages. Their exact semantics differ, and some programming paradigms express computation differently. This lesson explains each using Python examples, with notes on how they appear differently in statically typed languages.

## Variables: Named Storage

A variable is a name that refers to a value stored in memory.

```python
name = "Chandra"
years_of_experience = 25
is_currently_learning = True
```

The variable is not the value — it is a label attached to a location in memory that holds the value. When you reassign a variable, the label moves to a new location; the old value may eventually be garbage-collected.

**Why this matters**: In languages like C, the variable is the memory location. Understanding that distinction explains why passing a large data structure between functions in Python is cheap (you pass the reference, not the data) while in C it requires a deliberate decision about pointers.

## Types: What the Value Is

Every value has a type that determines what operations are valid on it.

```python
count = 42           # integer
price = 19.99        # float
message = "hello"    # string
active = True        # boolean
items = [1, 2, 3]   # list
config = {"env": "prod", "region": "us-east-1"}  # dictionary
```

Type errors occur when you apply an operation to a value whose type does not support it:

```python
result = "25" + 5    # TypeError: can only concatenate str to str
```

In Python this error appears at runtime — when the line executes. Static type checkers can reject many incompatible operations before execution. However, this particular string-plus-number expression performs concatenation in Java and JavaScript/TypeScript, illustrating why language-specific semantics matter.

**Custom types**: Every language lets you define your own types — classes in Python and Java, structs in Go and Rust. Complex programs are mostly built from custom types that model the problem domain.

## Control Flow: Decision and Repetition

Control flow determines what runs and when.

**Conditionals** choose a code path based on a condition:

```python
def classify_latency(ms: int) -> str:
    if ms < 100:
        return "acceptable"
    elif ms < 500:
        return "degraded"
    else:
        return "unacceptable"
```

**Loops** repeat a block of code:

```python
## For each item in a collection
for service in services:
    print(service.name)

## While a condition holds
retries = 0
while retries < 3:
    result = try_connect()
    if result.success:
        break
    retries += 1
```

**The key insight**: every loop can be expressed as a recursive function and every recursive function as a loop. Understanding both forms gives you flexibility in how you express repetition.

## Functions: Named, Reusable Computation

A function takes input, does something, and optionally returns output. It is the primary tool for reducing duplication and organising code.

```python
def calculate_monthly_cost(daily_rate: float, days: int, discount: float = 0.0) -> float:
    """Calculate total cost after applying an optional discount."""
    base_cost = daily_rate * days
    return base_cost * (1 - discount)

## Call it
cost = calculate_monthly_cost(daily_rate=12.50, days=31, discount=0.15)
```

**Parameters and arguments**: the variable names in the function definition are parameters. The values you pass when calling the function are arguments.

**Return values**: a Python function that reaches its end returns `None`. Java methods declared `void` return no value, and Go functions may have no result parameters; neither implicitly returns a null-like value in that case. Be explicit about what your functions return.

**Scope**: variables defined inside a function are local to that function. The local names are not directly available outside their scope, although referenced objects can outlive the call and functions can still affect shared state.

## Putting It Together: A Real Example

```python
def calculate_cloud_bill(services: list[dict]) -> dict:
    """
    Calculate total cloud bill from a list of service cost records.
    Each record: {"name": str, "daily_cost": float, "days": int}
    """
    total = 0.0
    breakdown = {}

    for service in services:
        cost = service["daily_cost"] * service["days"]
        breakdown[service["name"]] = cost
        total += cost

    return {"total": total, "breakdown": breakdown}

services = [
    {"name": "compute", "daily_cost": 45.00, "days": 31},
    {"name": "storage",  "daily_cost": 8.50,  "days": 31},
    {"name": "egress",   "daily_cost": 3.20,  "days": 31},
]

bill = calculate_cloud_bill(services)
print(f"Total: ${bill['total']:.2f}")
```

This small program uses all four concepts: variables (`total`, `breakdown`, `cost`), types (float, list, dict, str), control flow (a for loop), and a function (`calculate_cloud_bill`). These concepts provide a foundation for understanding the example; real systems also require models for effects, concurrency, and external state.

The next lesson covers data structures — the containers that organise values at scale — and why choosing the right one determines whether your program runs in milliseconds or minutes.

## Make the calculator's contract explicit

The earlier cost calculator is a learning example, not a billing system. Its inputs need rules: are days whole numbers, may a service appear twice, what currency applies, and what should happen to a negative amount? Those choices determine correct behaviour more directly than the programming language does.

Using the fictional rates already shown, compute costs are 45.00 multiplied by 31, or 1,395.00 currency units. Storage is 8.50 multiplied by 31, or 263.50. Egress is 3.20 multiplied by 31, or 99.20. The total is 1,757.70. The chart displays those three components; it is not a provider price comparison or a customer bill. Days and rates are chosen teaching inputs.

Notice the difference between an input and a derived value. `days` and `daily_cost` arrive in the record. `cost` is computed for that record. `total` accumulates across records. `breakdown` associates a name with an amount. Reading a loop as a sequence of state changes is a useful way to check whether it handles every record exactly once.

## Trace the loop by hand

Create a worksheet with one row per iteration and columns for service name, prior total, current cost, and new total. The first row starts at zero and ends at 1,395.00. The second starts at 1,395.00 and ends at 1,658.50. The third ends at 1,757.70. If a program produces a different result, compare the earliest differing row instead of staring at the final total.

Now add a second record named `compute`. The original dictionary assignment overwrites the earlier entry in `breakdown`, while `total` still includes both records. The output no longer has the implied property that the breakdown sums to the total. This is a logical bug even though every operation is permitted by the language's type rules.

Decide which contract you want. Reject duplicate service names if each service must appear once, or add each cost into the existing breakdown entry if multiple records are legitimate. Test the chosen behaviour explicitly. Avoid silently changing the contract just to make a test pass; the caller needs to know what duplicate input means.

## Use precise representations when the domain requires them

Binary floating-point cannot represent every decimal fraction exactly. For a teaching display rounded to two decimals, the simple example is useful. For a financial computation, define the currency, precision, rounding mode, and point at which rounding occurs. Python's decimal type or integer minor units can support an explicit policy, but neither chooses that policy for you.

For example, if three independently billable line items each calculate to 0.005 currency units, rounding each item can differ from rounding their sum. The correct answer depends on the agreed billing rule. The programming lesson is to make domain assumptions visible rather than assume that changing a numeric type settles the question.

Type annotations help communicate the expected shapes but do not validate a Python dictionary at runtime. An external JSON payload might contain the string `"31"`, a missing key, or a boolean where an integer was expected. Validate at the input boundary and return a clear error before accumulating a partial result. The core calculation can then work with a smaller set of trusted assumptions.

## A practical progression of exercises

First, write assertions for an empty input and one valid service. Second, test the three-record example against the hand-calculated total. Third, introduce duplicate names and implement the chosen rule. Fourth, reject a missing rate and a negative day count. Fifth, separate input parsing from arithmetic so each can be tested independently.

For each exercise, state the expected result before modifying the function. Keep output formatting outside the calculation; a function returning structured values is easier to test than one that only prints a sentence. Give errors meaningful names or messages so a caller can distinguish invalid input from an unexpected internal failure.

Finally, explain the function aloud without relying on syntax: it accepts validated records, computes each cost, combines costs under a declared duplicate rule, and returns totals in a stated currency. If that explanation is unclear, more language features will not fix it. Variables, types, control flow, and functions become useful when they express a precise contract that another person can check.

## Further reading and source boundaries

- [Python tutorial: control flow](https://docs.python.org/3.12/tutorial/controlflow.html)
- [Python tutorial: data structures](https://docs.python.org/3.12/tutorial/datastructures.html)
- [Rust book: ownership](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html)
- [Python: decimal arithmetic](https://docs.python.org/3.12/library/decimal.html)
