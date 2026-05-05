# Architecture

AI Insight Copilot has four main layers.

## 1. Data Source Layer

This layer decides where data comes from.

Current sources:

- local CSV files in `data/`

Prepared connector sources:

- Snowflake
- AWS S3
- Azure Blob Storage

The app is offline-first. If cloud credentials or SDKs are missing, local CSV mode still works.

## 2. Dataset Profiling Layer

File:

```text
src/profile.js
```

This layer scans every dataset and creates a profile:

- row count
- column names
- column type
- missing values
- unique counts
- sample values
- numeric min, max, mean, sum
- date ranges

Example profile idea:

```json
{
  "name": "avg_wait_minutes",
  "type": "numeric",
  "missing": 0,
  "uniqueCount": 10,
  "stats": {
    "min": 22,
    "max": 54,
    "mean": 35.7,
    "sum": 357
  }
}
```

## 3. Retrieval Layer

File:

```text
src/retriever.js
```

This is the local RAG part.

The app turns the dataset profile into small text documents:

- one document for the dataset overview
- one document for every column

Then it tokenizes the user question and ranks the documents.

This is not vector search yet. It is simple local lexical retrieval. The benefit is that it works offline with no AI API.

## 4. Planner and Execution Layer

File:

```text
src/copilot.js
```

This layer uses the retrieved context to decide:

- what metric to use
- what dimension to group by
- whether the user wants sum, average, count, trend, distribution, or summary
- what SQL-style query to show
- what local JavaScript calculation to run

It returns:

- dataset name
- intent
- answer
- recommendation
- SQL-style query
- chart data
- retrieved context
- internal plan

## API Layer

File:

```text
server.js
```

Main API routes:

```text
GET /api/datasets
GET /api/ask?dataset=sales&q=Which region has the highest revenue?
GET /api/data?dataset=sales
GET /api/connectors
GET /api/connectors/preview?id=snowflake
```

## UI Layer

Folder:

```text
public/
```

The UI lets users:

- choose a dataset
- ask a question
- see the answer
- see the generated query
- see retrieved schema context
- see connector readiness
- see a chart

## Architecture Diagram

```text
Browser UI
   |
   v
Node HTTP API
   |
   v
Dataset source registry
   |
   +--> Local CSV connector
   +--> Snowflake connector status
   +--> AWS S3 connector status
   +--> Azure Blob connector status
   |
   v
Dataset profiler
   |
   v
Local schema knowledge base
   |
   v
Retriever
   |
   v
Planner + executor
   |
   v
Answer + SQL-style query + chart + context
```
