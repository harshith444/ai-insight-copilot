# AI Insight Copilot - Full Project Guide

AI Insight Copilot is an offline-first analytics assistant.

In simple words: you give it a dataset, ask a question, and it tries to understand the dataset structure before answering. It does not just guess from the question. It first looks at the dataset profile, retrieves the most relevant columns, builds a small analysis plan, runs the analysis, and then explains the result.

## What Problem It Solves

Generic chatbots can understand data, but they are usually not built around data engineering needs:

- They may hallucinate column names.
- They may write SQL that looks correct but does not match the dataset.
- They often need you to upload private data.
- They do not naturally show what schema context they used.
- They do not separate offline local analysis from online cloud connectors.

This project is designed differently. It is a small analytics engine first, and a chat-like interface second.

## What It Does Today

The app currently supports:

- local CSV datasets
- offline execution
- schema profiling
- lightweight local retrieval over dataset metadata
- generic question planning
- SQL-style query generation
- grouped comparisons
- averages
- summaries
- trends
- chart rendering
- connector status checks for Snowflake, AWS S3, and Azure Blob

## What It Does Not Do Yet

This project does not currently use:

- OpenAI API
- Claude API
- Gemini API
- a hosted LLM
- embeddings
- a vector database
- DuckDB
- real SQL execution against cloud warehouses

The current "AI" behavior is local and lightweight. It is closer to a retrieval-grounded analytical planner than a full LLM agent.

## Why That Is Still Useful

The app can run fully offline. That means private files do not need to leave the machine.

It also shows the retrieved context, so the user can see why the system chose a metric or column. That makes it more transparent than a black-box chatbot.

## Main Flow

```text
User question
  -> selected dataset
  -> dataset profile
  -> local retrieval over schema docs
  -> analysis planner
  -> local executor
  -> answer + query + chart + retrieved context
```

## Example

Question:

```text
Which clinic has the highest average wait minutes?
```

The app retrieves:

- `clinic` as the grouping column
- `avg_wait_minutes` as the metric column
- Healthcare Operations as the selected dataset

Then it creates:

```sql
SELECT clinic, AVG(avg_wait_minutes) AS value
FROM healthcare_operations
GROUP BY clinic
ORDER BY value DESC;
```

Then it executes the equivalent analysis locally in JavaScript and returns the answer.

## Project Structure

```text
ai-insight-copilot/
  data/                  sample offline datasets
  docs/                  human-readable project documentation
  public/                browser UI
  src/
    connectors/          local and cloud connector registry
    copilot.js           planner + executor
    csv.js               CSV parser
    profile.js           dataset profiler
    retriever.js         lightweight retrieval
  test/                  Node test suite
  server.js              HTTP API + static server
```

## Best Next Upgrades

The strongest next upgrades would be:

- DuckDB for real local SQL execution
- local LLM support with Ollama
- optional hosted LLM support
- embedding-based retrieval
- file upload support
- Snowflake read-only query execution
- S3/Azure file ingestion
- query history
- role-based data access
- PII masking
