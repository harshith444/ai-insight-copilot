# Connectors

AI Insight Copilot is designed to work in two modes:

- offline local mode
- online connector mode

Offline mode is active by default. Online connectors are optional.

## Local CSV Connector

Status:

```text
ready by default
```

This connector loads CSV files from the local `data/` folder.

Current bundled datasets:

- `sales.csv`
- `health.csv`
- `education.csv`

It needs no credentials and no internet.

## Connector Status API

```text
GET /api/connectors
```

This returns all connector statuses.

Example:

```json
{
  "offlineFirst": true,
  "activeDatasetConnector": "local_csv",
  "connectors": [
    {
      "id": "local_csv",
      "status": "ready"
    },
    {
      "id": "snowflake",
      "status": "not_configured"
    }
  ]
}
```

## Snowflake Connector

Purpose:

- discover warehouse schema
- read metadata from `INFORMATION_SCHEMA`
- prepare read-only analytical SQL

Install:

```bash
npm install snowflake-sdk
```

Environment:

```bash
export SNOWFLAKE_ACCOUNT="..."
export SNOWFLAKE_USERNAME="..."
export SNOWFLAKE_PASSWORD="..."
export SNOWFLAKE_WAREHOUSE="..."
export SNOWFLAKE_DATABASE="..."
export SNOWFLAKE_SCHEMA="..."
```

Preview:

```bash
curl 'http://127.0.0.1:3000/api/connectors/preview?id=snowflake'
```

## AWS S3 Connector

Purpose:

- list cloud files
- prepare CSV or Parquet objects for profiling
- support S3-backed datasets in future versions

Install:

```bash
npm install @aws-sdk/client-s3
```

Environment:

```bash
export AWS_REGION="us-east-1"
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
export S3_BUCKET="..."
```

Preview:

```bash
curl 'http://127.0.0.1:3000/api/connectors/preview?id=aws_s3'
```

## Azure Blob Connector

Purpose:

- list blob files
- prepare Azure-hosted datasets for profiling
- support ADLS-style workflows in future versions

Install:

```bash
npm install @azure/storage-blob
```

Environment:

```bash
export AZURE_STORAGE_CONNECTION_STRING="..."
export AZURE_STORAGE_CONTAINER="..."
```

Preview:

```bash
curl 'http://127.0.0.1:3000/api/connectors/preview?id=azure_blob'
```

## Important Security Note

Cloud credentials should never be committed to GitHub.

Use environment variables or a local `.env` file that is ignored by Git.

## Current Connector Limits

The connector layer currently reports readiness and previews cloud metadata.

Full cloud query execution is the next upgrade. The intended flow is:

```text
cloud source
  -> metadata discovery
  -> schema retrieval
  -> safe query generation
  -> read-only execution
  -> local answer/chart
```
