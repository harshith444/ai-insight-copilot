# AI Insight Copilot

[![Profile](https://img.shields.io/badge/Profile-harshith444-111827?style=for-the-badge&logo=github&logoColor=white)](https://github.com/harshith444)
[![Repository](https://img.shields.io/badge/Repository-ai--insight--copilot-10B981?style=for-the-badge&logo=github&logoColor=white)](https://github.com/harshith444/ai-insight-copilot)

An offline-first, RAG-grounded analytics copilot that works on local private files by default and can attach to cloud data sources when internet access and credentials are available.

## Features

- Works across sales, healthcare, and education sample datasets
- Builds a dataset profile from column names, types, stats, examples, and date ranges
- Retrieves relevant schema and column context for each question
- Infers a generic analysis plan instead of relying on business-only hardcoded routes
- Generates SQL-style query logic for transparency
- Supports summaries, group comparisons, averages, distributions, and trends
- Browser dashboard with canvas charts
- Offline local CSV mode with no external dependencies
- Optional connector layer for Snowflake, AWS S3, and Azure Blob Storage

## How It Works

1. **Profile the dataset**: each CSV is scanned for numeric, categorical, and date columns.
2. **Build a small knowledge base**: the app creates retrievable documents for the dataset overview and every column.
3. **Retrieve context**: the user question is matched against column names, examples, stats, and dataset metadata.
4. **Plan the analysis**: the copilot chooses a metric, dimension, date column, and aggregation.
5. **Execute locally**: JavaScript runs the aggregation over the selected CSV.
6. **Explain the result**: the API returns the answer, SQL-style logic, recommendation, chart data, and retrieved context.

This is intentionally lightweight local RAG. It does not call an external LLM yet, but the architecture is ready for one.

## Offline-First Mode

The default app runs fully offline:

- local Node.js server
- local CSV files
- local schema profiling
- local lexical retrieval
- local analysis execution
- no cloud model, API key, or data upload required

This makes it suitable for private datasets where uploading files to a generic chatbot is not acceptable.

## Online Connectors

The connector registry exposes optional cloud sources while keeping the offline path intact.

| Connector | Purpose | Optional Package | Required Environment |
|---|---|---|---|
| Snowflake | Discover warehouse schema and prepare read-only analytical SQL | `snowflake-sdk` | `SNOWFLAKE_ACCOUNT`, `SNOWFLAKE_USERNAME`, `SNOWFLAKE_PASSWORD`, `SNOWFLAKE_WAREHOUSE`, `SNOWFLAKE_DATABASE`, `SNOWFLAKE_SCHEMA` |
| AWS S3 | List cloud files for profiling and analysis | `@aws-sdk/client-s3` | `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET` |
| Azure Blob | List cloud files for profiling and analysis | `@azure/storage-blob` | `AZURE_STORAGE_CONNECTION_STRING`, `AZURE_STORAGE_CONTAINER` |

Install only the connector packages you need. The core app still works without them.

```bash
npm install snowflake-sdk
npm install @aws-sdk/client-s3
npm install @azure/storage-blob
```

Connector status is available at:

```text
GET /api/connectors
GET /api/connectors/preview?id=snowflake
GET /api/connectors/preview?id=aws_s3
GET /api/connectors/preview?id=azure_blob
```

## Run Locally

```bash
npm start
```

Open `http://localhost:3000`.

## Test

```bash
npm test
```

## Example Questions

- Which region has the highest revenue?
- Which clinic has the highest average wait minutes?
- Which program has the highest completion rate?
- Show the main trend over time.

## Stack

Node.js, JavaScript, offline-first connectors, lightweight retrieval, schema profiling, CSV analytics, HTML, CSS, Canvas.

## Links

- Profile README: [github.com/harshith444](https://github.com/harshith444)
- Companion project: [Data Quality Radar](https://github.com/harshith444/data-quality-radar)
