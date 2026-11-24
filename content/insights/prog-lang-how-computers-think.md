---
title: "Before You Pick a Language, Understand How Computers Actually Think"
description: "Programming languages are abstractions over how a CPU executes instructions. Understanding the machine underneath makes every language easier to learn and every bug easier to diagnose."
date: 2027-06-04
tags: ["Programming", "Fundamentals"]
series: "Getting Started with Programming Languages"
seriesOrder: 1
format: article
---

Every programming language is a set of agreements between you and the machine — a translation layer that converts your instructions into the sequences of ones and zeros a processor can act on. The reason learning a second language is faster than learning the first is not that you are smarter the second time. It is that you already understand what every language is doing underneath, regardless of its syntax.

Before picking a language, it is worth spending an hour with the model that all languages share.

## What a CPU Actually Does

A sequential instruction stream is a useful introductory model. Modern CPUs can overlap, speculate on, and reorder internal execution while preserving the architecture's required observable behaviour. Examples include moving values, arithmetic, comparisons and branches. This is an introductory subset: real instruction sets also include operations such as floating-point computation, vector processing and atomic memory access, with architecture-specific semantics.

Everything a program does — displaying a web page, training a machine learning model, running a database query — is built from combinations of those primitive operations. The programming language is what lets you describe complex behaviour without writing every primitive operation by hand.

## Memory: The Two Models

The most consequential thing a programming language decides is how it manages memory: where data lives and who is responsible for reclaiming it when it is no longer needed.

**Stack memory** is fast, automatically managed, and limited in size. Some local values or references may be stored here; actual placement depends on the language implementation and optimisation. When the function returns, the stack frame is cleaned up automatically.

**Heap memory** supports allocations whose lifetime need not follow one call frame. A heap is often larger than an individual thread stack, but both have limits. Longer-lived data can also occupy static storage or other mappings. Ownership, a runtime or a garbage collector determines when heap allocations can be reclaimed.

Languages differ fundamentally in how they handle this:
- **C and C++**: ownership must be managed explicitly, although modern C++ uses RAII and smart pointers extensively. Incorrect lifetime or bounds handling can cause leaks and memory-safety failures.
- **Java, Python, Go, JavaScript**: a garbage collector manages heap memory automatically. Runtime management changes allocation and reclamation costs; actual performance depends on implementation and workload.
- **Rust**: safe Rust uses ownership and borrowing rules to provide memory-safety guarantees without requiring a tracing garbage collector. Unsafe code and foreign interfaces carry additional obligations, and memory leaks are still possible. Runtime performance depends on the program.

## Types: What the Language Knows About Your Data

Every value in a program has a type — an integer, a string of characters, a floating-point number, a boolean, a more complex data structure. Languages differ in when they check types:

**Statically typed languages** (Java, Go, Rust, C#, TypeScript) check types at compile time. The checker detects mismatches covered by its type model before execution. Escape hatches, foreign code, unvalidated inputs and runtime conditions still require other checks.

**Dynamically typed languages** (Python, JavaScript, Ruby) check types at runtime. More flexible to write, more susceptible to type-related errors that only appear under specific conditions.

Neither is universally better. Static checking can catch useful classes of mistakes in shared codebases, while dynamically typed languages also support substantial production systems.

## Compiled vs Interpreted

**Ahead-of-time compilation**, commonly used for C, C++, Go and Rust, translates a program before execution, often to machine code. It changes startup and optimisation opportunities, but does not guarantee that an arbitrary program is fast.

**Interpreted languages** (Python, Ruby, JavaScript in a basic sense) are commonly executed through an interpreter or virtual machine, often after compilation to an intermediate form. They are not necessarily translated to machine code line by line.

**Just-in-time compilation** produces machine code during execution. Common JVM and JavaScript engine configurations combine interpretation and compilation, but implementations and modes differ, including ahead-of-time options. Warm-up and optimisation can affect measured performance.

## Why This Matters Before You Start

Knowing this model helps explain why Python-level loops can incur more runtime overhead than comparable compiled loops, while work delegated to native libraries may behave differently. It also explains why object representation affects memory use and why an invalid memory access in a C program may cause a segmentation fault. That context turns error messages from frustrating noise into diagnostic information.

The next lesson covers how to actually choose the right first language given your goals — and which common first choices are worth avoiding.

## Separate a language from its implementation

The language defines what a program means; its implementation decides how to execute it while preserving those semantics. A Python implementation may compile source to bytecode and then execute that bytecode in a virtual machine. JavaScript engines can interpret and compile different portions at runtime. It is therefore more accurate to ask which implementation and execution mode you are using than to classify every language permanently as compiled or interpreted.

This distinction matters when a performance explanation sounds too simple. A Python function that calls a numerical library may spend most of its time in compiled native code. A Go program making a slow remote request may spend little time executing its own instructions. Neither example can be predicted from syntax alone. Measure the operation that matters, then investigate the part responsible for the cost.

Memory has a similar abstraction boundary. A local name does not guarantee that the named value occupies a machine stack slot. The compiler may put a value in a register, eliminate it, or allocate an object elsewhere. Python names refer to objects, and assigning a second name to a list does not create a second list. Learning these observable rules is more useful initially than guessing physical addresses.

## Work through a reference example

Consider a fictional importer with three records. A variable named `records` refers to a list, and `pending = records` creates another reference to that same list. Appending through `pending` changes what both names observe. In contrast, `pending = list(records)` creates a new outer list; nested mutable objects may still be shared. A deep copy has a different contract and cost again.

For a deliberately simplified storage model, imagine 1,000 records containing 64 bytes of payload each. One payload copy is 64,000 bytes. Three independent payload copies occupy 192,000 bytes. Sharing the payload instead keeps that component at 64,000 bytes, plus the references and ownership machinery omitted here. These are arithmetic estimates, not Python object-memory measurements. Real representations include headers, alignment, allocator overhead, and potentially separate string objects.

The chart makes one relationship visible: duplicating payloads increases that payload component. It does not establish that shared mutable data is always preferable. Copies can isolate a caller from changes; immutable shared data can reduce duplication without sharing mutation. The right choice depends on who may change the value and when.

## A language-mechanics lab

Write a function that appends a marker to an input list and returns its length. Call it using the original list, a second reference, and a shallow copy. Before each call, predict the original list's contents. Use assertions to compare prediction and result. Then repeat with a nested list to see which inner objects remain shared.

Next, use CPython's `dis` module on a tiny arithmetic function. Treat its output as implementation-specific bytecode rather than native CPU instructions. Change the function from addition to a conditional and identify the altered control flow. Record the interpreter version because bytecode details can change between releases. There is no need to memorise opcode names to learn the boundary between source semantics and execution machinery.

Finally, introduce an invalid input and observe where it fails. In Python, a type annotation alone does not enforce runtime validation. In a statically checked program, type checking still does not prove that network input is valid or that an array index is in range. Compile-time checks, runtime validation, tests, and error handling protect different obligations.

## Avoid comparisons without a workload

A benchmark needs equivalent outputs, input distributions, runtime settings, and a measured operation. Start-up time and steady-state throughput are different. Warm-up, garbage collection, and native dependencies can change the result. A memory-safety model also does not automatically establish freedom from logical bugs or resource leaks.

Write your first comparison as a question: can this implementation transform the declared file within the memory budget while rejecting malformed rows? That question produces a useful experiment. Asking which language is fastest without a workload usually produces an argument. The concepts in this lesson help you form the former question and interpret the result honestly.

## Further reading and source boundaries

- [Python: bytecode disassembly](https://docs.python.org/3.12/library/dis.html)
- [Python: data structures](https://docs.python.org/3.12/tutorial/datastructures.html)
- [Rust book: ownership](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html)
