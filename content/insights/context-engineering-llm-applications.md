---
title: "Context Engineering: Designing the Information an LLM Receives"
description: "As LLM applications matured from prompts to systems, the craft moved from wording instructions to architecting everything the model sees — retrieval, memory, tool results, and token budgets. The principles of context engineering for production AI systems."
date: 2027-09-03
tags: ["AI Adoption", "LLM", "Enterprise AI", "Architecture", "AI & MLOps"]
format: article
---

Prompt design remains useful, but production systems also require deliberate management of the information surrounding each request. A deployed LLM application assembles, for every single call, a context window containing some mixture of: system instructions, conversation history, retrieved documents, tool definitions and their results, user data, and examples. *That assembly* — what goes in, in what form, in what order, within what budget, refreshed by what rules — can materially affect behavior alongside model choice and instruction wording. The industry's name for this discipline is **context engineering**, and it's best understood as the information architecture of AI systems.

## The mental model: the context window is a working set, not a transcript

The naive model of an LLM call is conversational: everything so far, plus the new question. The engineering model is different: the context window is a **scarce, expensive, per-call working set** — like a CPU cache or a working memory — that you populate deliberately with the minimum sufficient information for *this* step. Three properties drive everything:

**Attention is finite and unevenly distributed.** The Lost in the Middle study found position-sensitive performance in the models and tasks it evaluated; the effect should be tested for each current configuration. A correct fact embedded in a large amount of distracting material may be harder for a particular model to use than the same fact in a curated context; compare those configurations on the actual task rather than treating context length as a universal accuracy law. Bigger windows raised the ceiling, not the discipline: "we have a million tokens, ship everything" can increase cost without improving accuracy, depending on the model and task.

**Cost and latency scale with what you send.** Input processing and billing depend on context size, caching and the serving implementation — prefill compute, per-token pricing, time-to-first-token — and conversation-style accumulation makes cost quadratic-ish over long sessions. Context discipline *is* cost engineering (and pairs directly with prefix-caching economics: stable content first, volatile content last, so the cacheable prefix stays cacheable).

**Context supplements the model's learned knowledge for that call.** The model can rely on learned priors when evidence is absent and can misuse material that is present — including the injected instruction in the retrieved document (the security dimension covered under prompt injection). Curation is therefore both an accuracy and a safety function.

## The craft: what to include, and in what shape

The working questions of context engineering, in the order they pay:

**Selection over accumulation.** Retrieval (the RAG stack) is one selector among several: recency windows over conversation history, summarization of older turns (a running compressed state instead of raw transcript), tool-result truncation with drill-down affordances ("the query returned 4,000 rows; here are the first 20 and the aggregates — ask for more"), and per-step task framing in agentic loops (each step gets *its* relevant slice, not the whole odyssey). The recurring anti-pattern is the append-only context — sessions that degrade over an hour as the window silts up with stale tool output and dead conversational branches; production systems need **context hygiene**: pruning, summarizing, and resetting as first-class operations.

**Structure beats prose.** Delimiters, labels and consistent formatting can make context easier to interpret, with their effect verified on the task: mark sections (instructions vs data vs examples vs history), tag provenance on retrieved material (source, date, trust tier — which also enables the model to cite and the system to audit), prefer schemas (JSON, tables) for structured facts, and keep instructions *out* of data channels as thoroughly as your architecture allows — the same separation the security layer wants for injection resistance turns out to be what accuracy wants too. Unlike parameterized database queries, role labels and delimiters do not provide a complete security boundary against prompt injection.

**Test position deliberately.** Stable prefixes can support caching in compatible serving systems. Evaluate placement of task instructions and evidence using the chosen model and task; primacy, recency and middle-position effects are empirical behaviors, not guaranteed attention priorities. And **budget explicitly**: a production context assembly should be a composed pipeline with per-section token budgets and eviction rules — "instructions 1k, tools 2k, retrieved 6k with rerank-then-truncate, history 4k summarized past 10 turns" — not a string concatenation that grows until something breaks.

**Memory is a database problem wearing a novelty costume.** Long-running assistants need state across sessions — user preferences, accumulated facts, task progress — and the mature pattern treats this as *storage with retrieval policies* (write summaries and structured facts to a store; retrieve selectively into future contexts) rather than ever-longer transcripts. All the boring data-engineering questions apply — freshness, conflict (the user changed their mind), provenance, deletion (very much including the compliance kind) — and teams that pretend memory is "just more context" meet those questions in production instead of design review.

## Making it an engineering practice

What separates context engineering from context vibes is the loop around it. **Observability**: log the *assembled context* (or its recipe and hashes — mind the sensitivity) per call, because "why did the model say that?" is unanswerable without knowing what it saw; trace token spend by section to find what's eating the budget for no lift. **Evaluation**: context changes are behavior changes — the same eval-gate discipline as model or serving changes; retrieval quality gets measured *separately* from generation quality (was the answer wrong because the context lacked the fact, or because the model missed it in context? — the diagnosis fork that directs all improvement effort). **And ablation as a habit**: the cheapest experiment in the field is removing a context section and measuring — teams are routinely surprised by how much of their carefully assembled context is inert, and removing unhelpful material can reduce processing work and cost, subject to caching, billing granularity and the effect on task quality.

The strategic reframe for architects: the model is becoming the *commodity* layer in these systems, swapped as vendors leapfrog; the durable, differentiating asset is the context system — the retrieval quality, the memory architecture, the assembly pipeline, the evaluation harness around it all. That's where the engineering hours compound, and it's also — conveniently — the layer that transfers when the next model generation arrives. Prompt engineering asked "what should I say to the model?" Context engineering asks the systems question: "what should this component know, from where, in what form, at what cost, verified how?" — which is to say, it asks the question software architecture has always asked, about the newest component in the stack.

## A context budget with an actual denominator

Start with the task boundary. A support assistant answering one question about an order does not need the entire customer's account history, every policy document and every available tool. It needs the authorized order facts, the applicable policy version and enough conversation state to understand the request. More material may help some questions, but inclusion should have a reason that can be tested.

For a hypothetical assistant, reserve 2,000 tokens for instructions, 2,000 for tool definitions, 6,000 for retrieved evidence and 2,000 for selected history. That is a 12,000-token input budget. Reserve a further 2,000 tokens for output, giving a planned 14,000-token combined requirement before any provider-specific overhead. Whether the model supports that request depends on its documented context and output limits; do not assume all advertised context can be consumed by input.

The chart shows the four input allocations. Retrieval consumes 6,000/12,000, or 50%, while each other section consumes approximately 16.7%. These are planning allocations, not a measured optimum. Tokenization differs across models, languages and content types, so count with the relevant tokenizer when available and maintain a margin. A character estimate can be useful during drafting but should not be the final request-size enforcement.

At 100 calls with all four allocations filled, the application sends 1.2 million input tokens. That is an accounting total, not a price quote: caching, provider billing rules, output tokens and serving architecture affect cost. If conversation history grows by 500 tokens on every call, the added history across 100 calls is 500 × (1 + 2 + ... + 100), or 2,525,000 tokens. This simple arithmetic explains why unbounded accumulation becomes expensive without asserting that every real conversation follows that growth pattern.

## Decide what happens when evidence does not fit

A budget is incomplete without an overflow policy. Truncating the final assembled string can remove a policy exception or cut a tool result in the middle of a record. Instead, select complete evidence units before serialization. Keep document identifiers, effective dates and passage boundaries together. If a document is too large, retrieve a smaller relevant section or return a controlled request for narrower scope.

Suppose an answer depends on a policy rule and its exception. A relevance scorer might rank the general rule highly while omitting the exception because it uses different wording. Evaluation therefore needs cases where the correct answer requires multiple passages, including apparently contradictory ones. Treat unresolved contradiction as a reason to show uncertainty or seek clarification, not a reason to average the text into a confident answer.

The assembly pipeline also needs an access-control boundary. Filtering documents before retrieval and checking their authorization again before exposure protects against stale indexes and incorrectly cached results. A shared cache must include the access scope in its key or contain only content safe for every user of that cache. Token savings do not justify exposing another tenant's evidence.

## Memory is an update process

A stored preference such as a preferred language can remain useful across tasks; a temporary instruction such as "use the staging environment for this test" can become dangerous if preserved as a permanent preference. Define memory categories with separate expiry and confirmation rules. Save the source of a remembered fact and permit correction without requiring users to find an invisible historical transcript.

A summary is a lossy transformation. It can erase qualifications, turn a proposal into a decision or merge two people with similar names. For consequential state, store structured facts with explicit statuses such as proposed, approved, completed and revoked. A generated summary can help navigate those facts but should not replace the authoritative transaction record. This is especially important when an assistant resumes a task after a long interruption.

Deletion must reach derived representations. Removing an original document while leaving a searchable summary or embedding may preserve sensitive content. Inventory the stores used for retrieval, caches, summaries and evaluation examples. The right deletion process depends on the system and policy, but it should be designed before accumulating memory rather than inferred during a complaint.

## A practical ablation worksheet

Construct 40 synthetic support questions: ten single-document lookups, ten requiring an exception, ten involving changed policies and ten with insufficient evidence. Record the allowed documents and expected answer disposition for each. Use a fixed model configuration and compare full-context, selected-context and selected-context-with-summary variants. Randomize execution order when service load could affect timing.

For each case, record whether the necessary evidence was retrieved, whether it survived assembly, whether the answer used it correctly, input tokens and elapsed time. This separates three failures that an overall answer score would merge. A retrieval fix will not help if the relevant passage is subsequently evicted; a larger context window will not help if the source is outdated.

Ablate one section at a time. Remove history while preserving the current question, remove examples while preserving instructions, or reduce the retrieval allocation while keeping the ranking algorithm fixed. If a score changes on two of 40 cases, inspect those cases and repeat before making a broad claim. Small synthetic sets expose defects; they do not estimate production performance precisely.

For the worksheet's decision column, require an explanation tied to task behavior: "retain exception passages even when the token budget is tight" is more actionable than "use better context." Keep latency and quality separate until a product owner defines the acceptable tradeoff. A cheaper configuration that cannot answer a critical class of questions may need a routing rule rather than universal deployment.

## Release and incident investigation

Version the assembly recipe alongside the prompt and retrieval configuration. Record source identifiers and transformation versions so a bad answer can be reconstructed without storing unrestricted copies of every sensitive prompt. Access to detailed diagnostic traces should be narrower than access to aggregate metrics. Redaction itself should be tested because it can remove the clue required to understand an incident.

During a rollout, watch changes in abstentions, missing-evidence errors, context-limit rejections and answer quality by question type. A lower token count is useful only in conjunction with those outcomes. Keep a rollback recipe that restores the previous assembly behavior, not merely the previous model identifier. The context pipeline is a deployable dependency with its own failure modes, and treating it that way makes improvement measurable.

## Sources and further study

- [Anthropic — Effective context engineering for AI agents](https://www.anthropic.com/research/effective-context-engineering-for-ai-agents)
- [Liu et al. — Lost in the Middle](https://arxiv.org/abs/2307.03172)
- [OWASP — Prompt injection risks](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
