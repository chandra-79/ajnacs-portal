---
title: "Data Structures Every Programmer Must Know — and When to Use Each"
description: "Arrays, hash maps, linked lists, stacks, queues, trees. The choice of data structure determines performance as much as the algorithm does. Here is the practical guide."
date: 2028-05-24
tags: ["Programming", "Fundamentals"]
series: "Getting Started with Programming Languages"
seriesOrder: 4
format: article
---

The data structure is the decision that determines whether your program scales. An algorithm running against the right data structure is fast. A poor match can cause unnecessary work that grows faster than the available hardware budget. This lesson covers the structures you will use in almost every serious program, and the performance characteristics that determine which to choose.

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

**Tradeoffs**: hash maps do not inherently support sorted range queries. Ordering depends on the implementation: Python dictionaries preserve insertion order. Memory overhead also depends on representation and capacity.

**When to use**: whenever lookup by a specific key matters more than ordering. For repeated equality lookups, a hash map is a candidate. Small collections, ordered queries, update costs and memory overhead can favour a different structure, so compare the actual operation mix.

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

A rooted tree is a connected acyclic structure with one root. Each other node has exactly one parent, and every node has zero or more children. The connected and acyclic conditions exclude disconnected components and loops.

**Balanced binary search trees** can support O(log n) search, insertion, and deletion. An unbalanced tree can degrade to O(n).

```
        50
       /  \
      25   75
     / \   / \
    10  35 60  90
```

Searching for 60: start at 50, go right (60 > 50), arrive at 75, go left (60 < 75), arrive at 60. Three comparisons for a seven-node tree. For a million-node balanced tree: roughly 20 comparisons.

**Where trees appear in practice**: database indexes (B-trees and related structures are common relational-database indexes, alongside other index types), file systems (directory hierarchies), expression parsing, and routing tables.

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

## Count the operations before timing them

Consider a hypothetical inventory report with 1,000 products and 200 requested product identifiers. A simple implementation scans all products for every requested identifier. In a worst-case missing-key workload, that performs 1,000 × 200 = 200,000 equality comparisons. A dictionary implementation first inserts 1,000 entries and then performs 200 expected constant-time lookups: 1,200 high-level map operations under the simplified model.

The chart compares those operation counts, not CPU instructions or elapsed time. A hash operation can cost more than one comparison, and building the map allocates memory. Collisions, key size, cache locality, and runtime implementation all matter. The point is to expose repeated work, then measure whether removing it helps the actual workload.

If there is only one query against a tiny collection, constructing a map may be unnecessary. If the same product identifier appears twice, a naive dictionary construction may silently keep the later entry. Decide whether duplicates are invalid, represent versions, or require a list of values per key. Correctness comes before an attractive complexity label.

## Preserve the properties the application needs

Order has several meanings. Insertion order, sorted key order, priority order, and arbitrary iteration are different contracts. Python dictionaries preserve insertion order, but that does not make a dictionary a sorted index. Sorting dictionary keys before every range query introduces extra work that a suitable ordered structure may avoid.

A queue also needs a capacity and ownership policy. An unbounded deque is convenient in a toy program but can accumulate enough work to exhaust memory when arrival exceeds processing. A queue between threads or processes may require synchronisation and durability beyond the collection's basic operations. A FIFO container does not guarantee end-to-end ordering once multiple workers process items concurrently.

The earlier event set is an illustration of membership, not a durable exactly-once processor. Marking an identifier before processing can suppress a retry after failure. Marking it afterward can permit duplicate side effects if the process crashes between the effect and the mark. A production design must connect deduplication state and business effects through a transaction, an idempotent operation, or another explicit recovery protocol.

## A collection-choice worksheet

For one application operation, write down the lookup key, required order, maximum size, update frequency, duplicate rule, and concurrent writers. Add the failure behaviour if memory is exhausted or a write is interrupted. This turns a general question such as “should we use a tree?” into a contract a structure can satisfy.

Suppose a dashboard needs the ten earliest due tasks and continually changes deadlines. A plain list can be entirely reasonable for fifty tasks. At much larger scale, a priority queue or indexed database query may fit better. A heap efficiently exposes an extremum, but arbitrary updates and deletion need careful handling of stale entries or extra indexing. The structure should match the operation mix, not the largest number in a tutorial table.

For sorted search, distinguish balanced from unbalanced trees. A binary search tree built by inserting already sorted keys without balancing can degrade into a chain, with linear search depth. The logarithmic bound requires a balancing property or a probabilistic expectation supplied by the actual implementation. An elegant diagram alone does not establish that property.

## Run a reproducible lab

Generate synthetic product identifiers and a fixed list of queries. Implement the scan and dictionary versions, then assert identical outputs for present, missing, and duplicate keys under your chosen contract. Only after correctness matches should you time them. Measure construction and lookup separately, then combine them using the expected number of queries per build.

Repeat at several input sizes and record memory as well as elapsed time. Keep the interpreter, hardware, key distribution, and number of trials in the report. Include both hit and miss queries. A benchmark consisting only of the first item in a list can make linear search look deceptively attractive; a benchmark of only missing keys describes a different workload.

Finally, change one assumption. Use longer string keys, make most queries repeat the same identifier, or update products between queries. Explain whether the structure remains appropriate. Record the benchmark seed and preserve the generated query list with the report. This allows another reader to reproduce the hit distribution and distinguish a change in implementation from a change in inputs. Report any excluded setup work explicitly. The lesson is not that a dictionary always beats a list. It is that the application's operations and correctness requirements determine what work must be done, and the chosen structure controls how that work grows.

## Further reading and source boundaries

- [Python: data structures](https://docs.python.org/3.12/tutorial/datastructures.html)
- [Python: deque](https://docs.python.org/3.12/library/collections.html#collections.deque)
- [Python: heap queue](https://docs.python.org/3.12/library/heapq.html)
