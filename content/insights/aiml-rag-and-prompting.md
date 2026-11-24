---
title: "RAG, Prompting, and Building Applications on LLMs: The Practitioner's Guide"
description: "Retrieval-augmented generation, system prompts, few-shot examples, chain-of-thought, structured output, and the engineering patterns that make LLM applications reliable in production."
date: 2026-08-25
tags: ["AI & MLOps", "Enterprise AI", "Fundamentals"]
series: "AI, ML, LLMs, and Neural Networks: A Practitioner's Introduction"
seriesOrder: 4
format: article
---

The gap between a demo that works and an application that is reliable in production is wider for LLM-based systems than for most software categories. The model generates plausible output, not correct output. The engineering work in production LLM applications is largely about closing that gap — through information retrieval that provides accurate context, prompt engineering that constraints outputs, and evaluation frameworks that catch degradation before users do.

## What to measure

**Retrieval coverage versus answer grounding.** If 75 of 100 questions retrieve the required evidence in the top five chunks, retrieval coverage at five is 75%. If 68 of those 75 answers accurately cite that evidence, conditional grounding is about 91%. Report the end-to-end result of 68 out of 100 as well.

*Illustrative measurement. Any numbers in this example are hypothetical.*

## Retrieval-Augmented Generation (RAG)

LLMs have fixed training knowledge. RAG extends this by retrieving relevant documents at inference time and including them in the context sent to the model.

```
User query: "What is our current cloud egress cost per GB?"

Without RAG: Model generates a plausible but likely incorrect answer
             based on general knowledge about cloud pricing.

With RAG:
  1. Retrieve: search internal knowledge base for egress cost documentation
  2. Retrieved: "Current egress rate: $0.087/GB (US East), $0.12/GB (EU)"
  3. Augment: include retrieved documents in the prompt context
  4. Generate: model synthesises answer from provided documents

Result: "Based on your cost documentation, current egress costs are 
        $0.087/GB for US East and $0.12/GB for EU regions."
```

**The retrieval component** uses vector embeddings — the query and all documents are converted to numerical vectors representing their semantic meaning. Cosine similarity finds documents whose vectors are closest to the query vector.

```python
from openai import OpenAI
import numpy as np

client = OpenAI()

def embed(text: str) -> list[float]:
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding

def cosine_similarity(a: list[float], b: list[float]) -> float:
    a, b = np.array(a), np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
```

**Vector databases** (Pinecone, Weaviate, Qdrant, pgvector) store pre-computed embeddings and retrieve nearest neighbours at query time.

## Prompt Engineering That Matters in Production

The system prompt can guide answers. Enforce source entitlements, tool authorisation and write permissions in application code outside the model.

```python
SYSTEM_PROMPT = """You are a cloud cost analysis assistant for Acme Corp.

You answer questions about cloud spend using only the provided cost documents.
You do not guess costs, estimates, or figures not present in the provided documents.
If the information needed to answer is not in the provided documents, say so explicitly.

Response format:
- Answer the question directly in the first sentence
- Cite the specific document and section you drew from
- If multiple figures are relevant, present them in a table

You do not discuss competitors, provide pricing not from our internal documentation,
or recommend specific vendors."""
```

**Few-shot examples**: include 2–3 examples of input/output pairs in the prompt. LLMs pattern-match on examples more reliably than they follow abstract instructions.

```python
FEW_SHOT_EXAMPLES = """
Example 1:
User: What was total cloud spend last month?
Documents: [Monthly Bill: Total $284,320. Compute: $198,240. Storage: $42,100...]
Assistant: Total cloud spend last month was $284,320, composed of compute ($198,240),
           storage ($42,100), and other services. Source: Monthly Bill report.

Example 2:
User: What is our Azure vs AWS split?
Documents: [Vendor breakdown: AWS 62%, Azure 31%, GCP 7%]
Assistant: AWS accounts for 62% of cloud spend, Azure 31%, and GCP 7%.
           Source: Vendor breakdown report.
"""
```

**Reasoning tasks**: test model-specific guidance and ask for verifiable evidence or calculations. A generic instruction to think step by step does not reliably improve results, especially when the model already handles reasoning internally.

## Structured Output

Unstructured text is difficult to parse reliably. For applications that need to process model output programmatically, enforce structured output:

```python
from pydantic import BaseModel
from openai import OpenAI

client = OpenAI()

class CostSummary(BaseModel):
    total_cost: float
    currency: str
    period: str
    top_services: list[str]
    anomalies_detected: bool

response = client.chat.completions.parse(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "Extract cost summary from the provided bill."},
        {"role": "user", "content": bill_text},
    ],
    response_format=CostSummary,
)

choice = response.choices[0]
if choice.finish_reason != "stop" or choice.message.refusal or choice.message.parsed is None:
    raise ValueError("No complete cost summary")
summary = choice.message.parsed
# Reconcile totals and source provenance before use.
```

## Evaluation: The Work Nobody Does Until It Is Expensive

Production LLM applications need automated evaluation. Without it, a model version change that degrades performance reaches users before anyone notices.

**Minimum viable evaluation framework**:

1. **Golden dataset**: 50–200 representative queries with known correct answers or reference outputs
2. **Automated scoring**: for factual tasks, check that specific facts appear in the response; for classification, compare to ground truth; for generation, use an LLM-as-judge with a structured rubric
3. **Regression testing**: run the evaluation on every model version change or prompt change

```python
def evaluate_response(query: str, response: str, ground_truth: str) -> dict:
    # Simple factual check: does the response contain key facts?
    key_facts = extract_key_facts(ground_truth)
    facts_present = sum(1 for fact in key_facts if fact.lower() in response.lower())

    return {
        "query": query,
        "fact_coverage": facts_present / len(key_facts),
        "response_length": len(response),
        # Add domain-specific metrics here
    }
```

The evaluation framework is the most important infrastructure investment in an LLM application. Without it, you are learning about regressions from user complaints. With it, you catch them in CI before deployment.

## Establish what makes a passage eligible

Each indexed passage needs a persistent record of where it came from. For a cloud rate card, store the source identifier, version, effective interval, vendor, region, billing unit, access policy and a locator into the authoritative document. A heading or table row needs enough surrounding context to preserve its units and scope. When the user wants a historical number, interpret the requested billing period before choosing which versions can appear. Keep the obsolete rate available for qualified historical questions and exclude it from current price lookups. If a source includes several quantities with different meanings, let the citation land on the row or paragraph that supports the answer.

Exact search can help with contract numbers or product codes, and dense retrieval can help with alternate phrasing. Benchmark each separately on realistic questions before combining them. A common hybrid method uses reciprocal rank fusion to combine each result list by rank, which avoids treating raw scores from different retrievers as if they shared a scale. A reranker can score candidate passages against the question, with costs in inference and latency that grow with the work you send it. Vary candidate depth and final context length independently. The quality measure is how often the evidence needed to answer is in the final context. [Azure RAG retrieval guide](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/rag/rag-information-retrieval) and [Azure AI Search hybrid ranking](https://learn.microsoft.com/en-us/azure/search/hybrid-search-ranking).

## Measure retrieval, interpretation and citation separately

Build a reviewed set of questions with eligible document versions and the passages that support an answer. Mark questions with multiple equally valid sources. Include out-of-scope questions, past-date questions, requests with no accessible evidence, and apparent contradictions that the application should surface. Replay with a frozen index and identities representative of actual roles. A reviewer who has access to every record can supply the source mapping, while the replay must enforce the user's visible scope. Keep a second run with the live index to see whether freshness changes the same cases.

In an illustrative test with 120 eligible answerable questions, 96 retrieve the needed evidence across the top results and 84 put all required evidence into the final context. Of those 84, 74 yield a supported, correctly cited answer. The stages identify 24 candidate-retrieval misses, twelve context assembly misses and ten final-answer misses. Under a conservative scoring rule, the observed end-to-end pass rate is 74 of 120, about 62%. Run a separate experiment that injects reviewed passages directly. This helps isolate whether an answer failure survives a correction to retrieval, without counting the injected result as normal user performance.

Add an abstention slice with a separate denominator. For an illustrative set of 40 unanswerable questions, 36 safe deferrals and four unsupported answers are a 10% unsupported-answer rate on that slice. If the correct evidence exists underneath restricted permissions, the outward behavior should be consistent with ordinary lack of accessible evidence. Check that responses do not expose restricted titles, citation metadata or summaries during those cases. Read source-bearing output for entailment. Keyword checks alone can reward an answer that repeats the right region and price but associates them with the wrong invoice term. [Microsoft RAG evaluator definitions](https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/rag-evaluators).

## Decide what happens when the number will drive a decision

Use application logic for current user entitlements at retrieval, while building context, and at response release where revocation policy requires it. Cache eligible results using identity scope and policy or index version, then invalidate promptly when the records change. Retention policy applies to the request, the evidence and the model response. Store enough metadata for authorised review, with trace identifiers and versioned document references. For sensitive documents, count eligible sources and capture failures without retaining the underlying snippets by default.

For a financial rate, permit structured fields carrying the amount, currency, unit, interval, source reference and whether evidence is missing or conflicting. Use exact decimals or integer minor units when the domain permits it, track rounding conventions and reconcile totals against the source. If one approved contract uses binary units and a later price list uses decimal units, refuse automatic comparison until the billing basis is resolved. If two authorised passages disagree for the same scope and interval, show both references and route the conflict to the content owner. Count how often conflicts occur, including outcomes cached before the correction.

Run release reviews against evidence diffs. When a user flags a wrong answer, classify it as stale source, wrong scope, missed retrieval, discarded context, unsupported generation, or ambiguous policy. The same symptom, such as an incorrect rate, can require very different repairs. Publish a small set of examples internally that includes source snapshots and recorded outcomes, then re-run those cases whenever the indexer, permissions, prompts or model changes. Add an end-to-end latency budget with separate timings for retrieval, reranking, generation and validation. Under load, a system can return a source link or a clarification path when it cannot collect enough evidence before the deadline. Record that deferral so a faster-looking release cannot mask a declining answer rate.

Give content owners a way to publish an indexable correction with an effective date. Track time from source publication to searchable availability and measure a separate interval for access revocations, where the policy may require faster propagation.
