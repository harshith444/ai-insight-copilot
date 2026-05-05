# What AI Is It Using?

Short answer: this project does not currently call GPT, Claude, Gemini, or any external AI model.

It uses a lightweight local AI-style workflow:

- schema profiling
- local retrieval
- analysis planning
- deterministic execution
- answer explanation

This keeps the project offline-first and private-data friendly.

## Why Call It RAG-Grounded?

RAG means Retrieval-Augmented Generation.

In this project, retrieval happens locally over dataset metadata.

The app creates small documents like:

```text
avg_wait_minutes is a numeric column.
10 unique values.
examples 31 24 42 28 36.
min 22.
max 54.
mean 35.7.
```

When the user asks:

```text
Which clinic has the highest average wait minutes?
```

the retriever finds:

- `clinic`
- `avg_wait_minutes`
- the healthcare dataset overview

Then the planner uses that retrieved context to build an analysis plan.

## Is This A Real LLM?

No.

Current version:

```text
No hosted LLM
No API key
No embeddings
No vector database
No data upload
```

That is intentional for the offline-first version.

## How It Is Different From GPT, Claude, Or Gemini

GPT, Claude, and Gemini are general-purpose AI models.

This project is a data product with a narrower goal:

- keep data local by default
- inspect schema before answering
- show retrieved context
- generate query logic
- execute deterministic analysis
- expose connector readiness
- prepare for governed warehouse access

Generic chatbots are very good at reasoning, but they do not automatically know:

- your warehouse schema
- approved metric definitions
- freshness warnings
- which connector is safe
- whether SQL executed successfully
- what data quality problems exist

This project is meant to become a governed analytics layer, not just a chatbot.

## Future AI Upgrade Paths

### Option 1: Local LLM

Use Ollama, LM Studio, or llama.cpp.

Flow:

```text
local dataset
  -> schema retrieval
  -> local LLM SQL planner
  -> local execution
  -> answer
```

This keeps data private.

### Option 2: Hosted LLM

Use OpenAI, Claude, Gemini, or another hosted model.

Flow:

```text
schema metadata only
  -> hosted LLM
  -> SQL plan
  -> local/cloud execution
  -> answer
```

This can be more powerful, but needs governance so raw private data is not sent to the model unnecessarily.

### Option 3: Hybrid

Use local retrieval and local query validation, then call a hosted LLM only for language generation.

This is a strong production direction:

```text
private data stays local
schema context is controlled
queries are validated
LLM writes better explanations
```

## Honest Current Positioning

The current app is best described as:

> An offline-first, retrieval-grounded analytics copilot prototype with connector-ready architecture.

It is not yet:

> A full autonomous warehouse agent with LLM reasoning and production SQL execution.
