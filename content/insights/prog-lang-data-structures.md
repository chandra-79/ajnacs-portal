---
title: "Data Structures Every Programmer Must Know — and When to Use Each"
description: "Arrays, hash maps, linked lists, stacks, queues, trees. The choice of data structure determines performance as much as the algorithm does. Here is the practical guide."
date: 2027-06-04
tags: ["Programming", "Fundamentals"]
series: "Getting Started with Programming Languages"
seriesOrder: 4
format: article
---

The data structure is the decision that determines whether your program scales. An algorithm running against the right data structure is fast. The same algorithm against the wrong one is slow in a way that no amount of hardware can fix. This lesson covers the structures you will use in almost every serious program, and the performance characteristics that determine which to choose.

## Arrays and Lists: Sequential Storage

An array stores elements in contiguous memory locations, accessible by index in constant time — O(1). The index calculation is direct: `base_address + (index × element_size)`.

```python
latencies = [12, 45, 8, 102, 23]
first = latencies[0]    # O(1) — direct index access
last = latencies[-1]    # O(1) — Python negative indexing
```

**What arrays are fast at**: random access by index, iteration, appending to the end (amortized O(1) for dynamic arrays).

**What arrays are slow at**: inserting or deleting in the middle (O(n) — everything after the insertion point shifts). Searching for a value without knowing its index (O(n) linear scan).

**When to use**: any ordered collection where you access elements by position, iterate through all elements, or append frequently. This covers the majority of collection use cases.

## Hash Maps: Key-Value Lookup

A hash map (dictionary in Python, HashMap in Java, map in Go) stores key-value pairs with average O(1) lookup, insertion, and deletion.

```python
## Service registry: name → endpoint
registry = {
    "auth-service":    "https://auth.internal:8080",
    "billing-service": "https://billing.internal:8081",
    "data-service":    "https://data.internal:8082",
}

endpoint = registry["auth-service"]    # O(1) average
```

**How it works**: a hash function converts the key to an integer, which is used as an index into an underlying array. Different keys that hash to the same index — a collision — are handled by chaining (a linked list at that bucket) or open addressing (probing adjacent slots).

**What hash maps are fast at**: lookup by key, insertion, deletion. This makes them the right choice for caches, indexes, counting, grouping, and any problem that involves "find the thing associated with this key."

**What hash maps are slow at**: ordered iteration (hash maps are unordered), range queries (find all values between X and Y), and memory — they use more memory than arrays for equivalent data.

**When to use**: whenever lookup by a specific key matters more than ordering. If you find yourself scanning an array looking for a matching field, a hash map is almost certainly the right structure.

## Sets: Unique Membership

A set stores unique values and supports fast membership testing.

```python
processed_ids = set()

for event in event_stream:
    if event.id in processed_ids:     # O(1) membership test
        continue                       # skip duplicate
    processed_ids.add(event.id)        # O(1) insertion
    process(event)
```

**Use sets when**: deduplication, membership testing, and set operations (union, intersection, difference) are the primary operations. Backed by a hash table internally; the same performance characteristics apply.

## Stacks and Queues: Ordered Processing

**A stack** is last-in, first-out (LIFO). Python lists work as stacks:

```python
stack = []
stack.append("task_a")   # push
stack.append("task_b")
task = stack.pop()        # pop — returns "task_b"
```

Uses: function call management (every language runtime uses a call stack), undo/redo operations, depth-first graph traversal, parsing nested structures.

**A queue** is first-in, first-out (FIFO). Use `collections.deque` for efficient queues in Python:

```python
from collections import deque
queue = deque()
queue.append("request_1")    # enqueue
queue.append("request_2")
item = queue.popleft()        # dequeue — returns "request_1"
```

Uses: task queues, breadth-first graph traversal, rate limiting, message buffering. The database work queue, the web server request queue, the Kafka consumer — all queues.

## Trees: Hierarchical Structure

A tree is a set of nodes where each node has zero or more children and exactly one parent (except the root, which has none).

**Binary search trees** keep elements sorted, enabling O(log n) search, insertion, and deletion — far better than O(n) linear search for large datasets.

```
        50
       /  \
      25   75
     / \   / \
    10  35 60  90
```

Searching for 60: start at 50, go right (60 > 50), arrive at 75, go left (60 < 75), arrive at 60. Three comparisons for a seven-node tree. For a million-node balanced tree: roughly 20 comparisons.

**Where trees appear in practice**: database indexes (B-trees and B+ trees are the dominant index structure in every relational database), file systems (directory hierarchies), expression parsing, and routing tables.

## The Decision Logic

| If you need... | Use... |
|---|---|
| Ordered elements, access by position | Array / List |
| Fast lookup by key | Hash Map |
| Unique elements, membership test | Set |
| LIFO processing (undo, recursion) | Stack |
| FIFO processing (queues, BFS) | Queue |
| Sorted data with fast search | Binary Search Tree / Sorted Set |
| Hierarchical data (org chart, file system) | Tree |

The next and final lesson in this series covers how to read existing code — the most underrated skill in programming, and the one that determines how fast you grow once you can write working code of your own.
