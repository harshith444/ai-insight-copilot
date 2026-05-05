# AI Insight Copilot

[![Profile](https://img.shields.io/badge/Profile-harshith444-111827?style=for-the-badge&logo=github&logoColor=white)](https://github.com/harshith444)
[![Repository](https://img.shields.io/badge/Repository-ai--insight--copilot-10B981?style=for-the-badge&logo=github&logoColor=white)](https://github.com/harshith444/ai-insight-copilot)

A lightweight RAG-grounded analytics copilot that works across different CSV datasets by retrieving schema context, planning an analysis, executing it, and explaining the result.

## Features

- Works across sales, healthcare, and education sample datasets
- Builds a dataset profile from column names, types, stats, examples, and date ranges
- Retrieves relevant schema and column context for each question
- Infers a generic analysis plan instead of relying on business-only hardcoded routes
- Generates SQL-style query logic for transparency
- Supports summaries, group comparisons, averages, distributions, and trends
- Browser dashboard with canvas charts
- No external dependencies

## How It Works

1. **Profile the dataset**: each CSV is scanned for numeric, categorical, and date columns.
2. **Build a small knowledge base**: the app creates retrievable documents for the dataset overview and every column.
3. **Retrieve context**: the user question is matched against column names, examples, stats, and dataset metadata.
4. **Plan the analysis**: the copilot chooses a metric, dimension, date column, and aggregation.
5. **Execute locally**: JavaScript runs the aggregation over the selected CSV.
6. **Explain the result**: the API returns the answer, SQL-style logic, recommendation, chart data, and retrieved context.

This is intentionally lightweight local RAG. It does not call an external LLM yet, but the architecture is ready for one.

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

Node.js, JavaScript, lightweight retrieval, schema profiling, CSV analytics, HTML, CSS, Canvas.

## Links

- Profile README: [github.com/harshith444](https://github.com/harshith444)
- Companion project: [Data Quality Radar](https://github.com/harshith444/data-quality-radar)
