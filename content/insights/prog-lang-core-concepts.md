---
title: "Variables, Types, Control Flow, Functions: The Four Concepts That Run Every Program"
description: "Every programming language is built from the same four building blocks. Master these in one language and you have transferred 80 percent of what you need to learn the next one."
date: 2028-02-11
tags: ["Programming", "Fundamentals"]
series: "Getting Started with Programming Languages"
seriesOrder: 3
format: article
---

Every program ever written — from the first UNIX shell to a large language model training run — is built from four concepts: variables, types, control flow, and functions. The syntax differs by language. The concepts do not. This lesson explains each using Python examples, with notes on how they appear differently in statically typed languages.

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

In Python this error appears at runtime — when the line executes. In TypeScript or Java, the same error is caught at compile time, before the program runs. This is the central practical difference between dynamic and static typing.

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

**Return values**: a function that does not explicitly return a value returns `None` in Python, `null` in Java, `nil` in Go. Be explicit about what your functions return.

**Scope**: variables defined inside a function are local to that function. They do not exist outside it. This is fundamental to managing complexity — functions are isolated units.

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

This small program uses all four concepts: variables (`total`, `breakdown`, `cost`), types (float, list, dict, str), control flow (a for loop), and a function (`calculate_cloud_bill`). Everything else a program does is a combination of these.

The next lesson covers data structures — the containers that organise values at scale — and why choosing the right one determines whether your program runs in milliseconds or minutes.
