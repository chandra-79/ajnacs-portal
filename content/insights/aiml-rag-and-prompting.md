---
title: "RAG, Prompting, and Building Applications on LLMs: The Practitioner's Guide"
description: "Retrieval-augmented generation, system prompts, few-shot examples, chain-of-thought, structured output, and the engineering patterns that make LLM applications reliable in production."
date: 2026-07-08
tags: ["AI & MLOps", "Enterprise AI", "Fundamentals"]
series: "AI, ML, LLMs, and Neural Networks: A Practitioner's Introduction"
seriesOrder: 4
format: article
---

The gap between a demo that works and an application that is reliable in production is wider for LLM-based systems than for most software categories. The model generates plausible output, not correct output. The engineering work in production LLM applications is largely about closing that gap — through information retrieval that provides accurate context, prompt engineering that constraints outputs, and evaluation frameworks that catch degradation before users do.

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

The system prompt is the most powerful tool for constraining model behaviour.

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

**Chain-of-thought prompting**: for reasoning tasks, instruct the model to show its reasoning before giving the final answer. "Think step by step" or including reasoning steps in few-shot examples improves accuracy on multi-step problems.

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

response = client.beta.chat.completions.parse(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "Extract cost summary from the provided bill."},
        {"role": "user", "content": bill_text},
    ],
    response_format=CostSummary,
)

summary = response.choices[0].message.parsed
## summary.total_cost, summary.top_services — strongly typed
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
