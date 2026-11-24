---
title: "Multi-Agent AI Systems: When They Add Value and When They Add Complexity"
description: "Multi-agent architectures are generating significant interest. Before adopting one, it helps to be clear about what problem they solve, what they cost in complexity and reliability, and what simpler alternatives look like."
date: 2024-10-22
tags: ["AI & MLOps", "Enterprise AI", "Architecture"]
format: article
---

Multi-agent systems are compelling in demos. A coordinator agent breaks down a task, specialist agents handle their parts, results are assembled, and the system produces an output that no single LLM call could have achieved.

In production, multi-agent architectures are harder to operate than single-model pipelines, more difficult to debug when they fail, and rarely necessary for the tasks most enterprise applications actually need. The question worth asking before building one: what specifically requires multiple agents rather than a well-designed single prompt or pipeline?

## What to measure

**Task completion and human intervention.** On a fixed set of 100 workflows, record successful completion, handoffs and total cost. If 70 succeed without intervention and 20 more succeed after escalation, autonomous success is 70% and overall success is 90%. Compare with a single-agent baseline at the same quality bar.

*Illustrative measurement. Any numbers in this example are hypothetical.*

## What multi-agent architectures actually solve

The genuine use cases:

**Parallelism**: tasks that can be decomposed into genuinely independent subtasks and completed faster in parallel than sequentially. Researching multiple topics simultaneously, processing multiple documents in parallel, generating multiple draft variations concurrently.

**Context window management**: workflows where the full context would exceed a single model's context window. An agent that processes one section of a large document and passes a summary to a coordinator, which synthesizes the full picture.

**Specialization**: tasks where different subtasks benefit from different prompting strategies, tools, or models. A planning agent using a reasoning-optimized model; an execution agent using a faster, cheaper model for straightforward tasks.

**Long-horizon tasks**: multi-step workflows where intermediate results inform subsequent decisions. An agent that searches for information, evaluates what it found, decides whether to search further, and synthesizes when it has enough.

These are legitimate benefits. They come with real costs.

## The costs

**Reliability compounds downward.** If all three stages must pass and each has a 90% conditional probability of passing after every earlier stage passed, the overall pass probability is 72.9%. Separate marginal pass rates are insufficient if failures are correlated. Fallbacks or review also change the outcome. Compare paired task results, latency, cost and handoff failures.

**Failure modes are harder to debug.** When a single LLM call fails or produces a bad output, the failure is localized and inspectable. When a multi-agent system produces a wrong answer, tracing why requires understanding which agent's output was wrong, whether it was a tool call, a hallucination, a bad decision in the orchestration logic, or a context window issue in the coordinator. This is significantly harder to debug than a monolithic pipeline.

**Latency accumulates.** Sequential agent calls add latency. An agentic loop that makes 5 sequential LLM calls at 2-3 seconds each takes 10-15 seconds before it reaches an answer. For user-facing applications, this is often unacceptable.

**Extra calls can raise cost.** For a metered service, usage depends on input and output size, model, caching and billing terms. Ten equally priced calls would cost ten times a single call before orchestration. Measure total workflow cost and divide by accepted outcomes.

## The simpler alternative worth trying first

Before building a multi-agent system, try:

**Structured prompting**: a single prompt with explicit step-by-step instructions, chain-of-thought guidance, and output format specifications. For many "complex" tasks, a well-structured prompt with a capable model outperforms a multi-agent system at a fraction of the complexity.

**Sequential pipeline with validation**: a series of single LLM calls with deterministic code between them — format validation, filtering, transformation. Each step is predictable, debuggable, and independently testable. Not "agentic," but reliable.

**Tool-augmented single agent**: one agent with access to tools (web search, code execution, database queries, API calls). The agent decides when to use tools and synthesizes the results. Much simpler than multi-agent orchestration for most workflows.

The question is not "could this benefit from multiple agents?" but "is the complexity of multiple agents justified by what they enable over a simpler design?"

## When to actually build multi-agent

The cases where multi-agent architectures genuinely earn their complexity:

**Document processing at scale**: processing hundreds of documents in parallel, each requiring substantive analysis, with results aggregated into a single output. The parallelism justifies the orchestration overhead.

**Competitive research or monitoring**: an agent that reads multiple sources, each handled by a sub-agent, with deduplication and synthesis at the coordinator level. Genuinely parallel independent tasks.

**Long-horizon planning tasks**: a planner that generates a multi-step execution plan, delegates steps to specialized executors, checks results, adjusts the plan based on what it learns. The planning-execution separation is architecturally meaningful.

**Human-in-the-loop workflows**: an orchestrator that hands off to a human for approval at defined checkpoints. The "agent" is the workflow manager; humans are one type of participant. This is often more workflow orchestration than multi-agent AI.

## Practical orchestration patterns

If you do build multi-agent, the patterns that hold up:

**Explicit message passing**: agents communicate through defined message types with schemas, not freeform text. This makes the contract between agents auditable and testable.

**Idempotent operations** use a stable identifier so repeating an accepted action has the same effect on the destination as performing it once. A model can produce a different proposal on a retry. Keep proposals versioned and enforce the side-effect guarantee outside the model.

**Observability at every hop**: trace every agent invocation, tool call, and state transition. You cannot debug a multi-agent system that is a black box. Use OpenTelemetry spans for each agent call and persist the intermediate state required to resume the workflow.

**Bounded iteration**: orchestration loops must have explicit termination conditions and maximum iteration counts. An agent that can loop indefinitely will, eventually, loop indefinitely.

```python
MAX_ITERATIONS = 10

for i in range(MAX_ITERATIONS):
    result = agent.step(state)
    if result.is_terminal:
        break
    state = result.next_state
else:
    raise MaxIterationsExceeded(f"Agent did not terminate after {MAX_ITERATIONS} steps")
```

**Graceful degradation**: define the behavior when an agent fails. Does the coordinator retry? Fall back to a simpler approach? Return a partial result? "Raise an exception and fail the entire workflow" is usually the wrong answer for user-facing applications.

*Building a production AI pipeline and evaluating whether multi-agent architecture fits your use case? The design decision has significant operational implications downstream. [Happy to think through the specific requirements.](/contact/)*

## Compare three designs on the same review task

Take an internal procurement review that checks a purchase packet for missing documents and evidence of applicable policy. A single call could read the packet and propose a checklist. A fixed workflow could extract fields, run deterministic checks for presence and validity, and pass the excerpts to one model for a written summary. A coordinator could instead discover which policy specialties apply, give each worker access to the relevant authorised excerpts, then merge the evidence. Use an identical set of packets, approved sources and rubric for all designs. Include packets that are both incomplete and ambiguous, and check whether each design refers them to the right owner. If adding a worker helps only a narrow category, routing that category into a specialist lane may preserve the gains with fewer handoffs. [Anthropic’s workflow and agent patterns](https://www.anthropic.com/research/building-effective-agents).

Record a typed finding for each issue with its criterion, source version, passage locator and outcome. Accept an approved evidence reference only if it points to the packet and policy version designated for that case. A specialist returned too late can submit an incomplete result rather than a guessed finding. The coordinator can report which criteria are pending and record disagreements for human review. Include automated invalid citations, missed required checks and false escalation in the score. Give reviewers the same presentation across arms so a polished output does not earn a higher score by appearance alone.

Use paired results to study which work improved. In an illustrative batch of 100 packets, imagine both designs pass 74, only the agent workflow passes 12, only the simpler workflow passes six, and neither passes eight. The agent workflow gains six passes, from 80% to 86%, on this collection. Inspect the six new failures for severity and the twelve new successes for a common capability. Report analyst time including recovery work. A design with a better completion rate might produce incomplete outputs that require longer or more specialised review.

## Bound the critical path and the bill

Consider illustrative timings of 0.6 seconds for routing, parallel worker times of 1.1, 2.4 and 1.6 seconds, 1.2 seconds for merging, and 0.3 seconds for final validation. With capacity and immediate dispatch, the critical path is 4.5 seconds. The same worker times serialised would take 7.2 seconds including the other steps. Treat this as an accounting model for one trace. End-to-end p95 needs measured timings under shared rate limits, the actual arrival mix and occasional slow branches. A system that accepts five workflows at once can launch fifteen worker requests before retried calls or summarizers. Bound concurrency across cases as well as within each case.

Sum metered token usage per call at the rate for that model and mode, plus any tool, compute, logging and review costs included in the comparison. A larger call reusing all source material and several smaller calls receiving only relevant excerpts can have very different input and output profiles. A chain that repeats a large prefix can have the reverse pattern. Illustratively, $4.80 in measured charges with 80 accepted results costs 6 cents per result, whereas $5.59 with 86 accepted results costs 6.5 cents. Add reviewer cost using observed minutes for accepted cases, escalations and recoveries. Report a total per accepted result over a fixed packet set, with useful but partial results shown separately.

## Make each handoff recoverable

Keep durable case state with the workflow identifier, stage, input version, evidence scope, and deadline. Generate a stable operation identifier for a write and commit the accepted effect once, using the receiving system’s idempotency or uniqueness mechanism where available. A repeated model call can return different text. An idempotent operation keeps the observable effect unchanged when submitted again under the same key. When a downstream write has an uncertain outcome, inspect its state using the stable identifier before retrying. Keep generated proposals as separate, versioned records so a retrospective can tell which one the approver saw.

Treat each worker result as untrusted input to its coordinator and give workers access only to the data required for their scope. Any action authorisation remains with the application. Verify the approver’s current permission and the approved version of the request before committing, and require a new approval if the operation changes. When a review pauses overnight, persist what was complete and resume from the approved checkpoint while checking for expired evidence. Make cancellation propagate to workers where supported, and discard late responses from superseded executions. Use configurable limits for depth, calls, elapsed time and cost, with predictable results when any limit is reached.

Instrument a parent trace for the workflow and spans for decisions, work submissions, tool reads, retries and validation. Keep fan-out visible even when a worker’s call completes asynchronously elsewhere. Useful attributes include stage, model version, attempt, duration, outcome, counts and controlled identifiers. Keep document content out of traces by default and define any protected evidence store separately. Alert on an accumulation of stalled or repeatedly retried jobs, and correlate those cases with service limits and operator recovery time. These observations help determine whether simplifying a branch will improve the user outcome more than changing the model. [OpenTelemetry generative AI semantic conventions](https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/README.md).

## Test recovery as deliberately as the happy path

Use an isolated queue to exercise the cases a sequence diagram depends on. Deliver the same worker completion twice and check that only one accepted finding appears. Suspend the coordinator after an approval has been recorded and before the next step returns, then restart with the same workflow ID. Verify whether the effect was applied exactly once by querying the destination. Schedule two conflicting versions of the same finding and verify that the final packet exposes the conflict with its source versions. Set a deadline that one worker misses and check that the user can still understand which checks are pending. Record recovery time and how many workflows need operators to intervene. Run the same tests whenever the workflow’s state format or delivery mechanism changes.

Keep a short log of fallback reasons visible to workflow owners. If one branch repeatedly times out after waiting for admission, change its service budget or scheduling policy and replay the comparison before investing in a more capable model.
