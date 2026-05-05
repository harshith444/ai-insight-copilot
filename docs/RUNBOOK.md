# How To Run

This guide explains how to run the project from zero.

## Requirements

You need:

- Node.js 18 or newer
- npm

No database is required for the default offline mode.

## 1. Clone The Repo

```bash
git clone https://github.com/harshith444/ai-insight-copilot.git
cd ai-insight-copilot
```

## 2. Install Dependencies

The core app has no required external packages.

You can run it directly:

```bash
npm start
```

## 3. Open The App

Open:

```text
http://127.0.0.1:3000
```

or:

```text
http://localhost:3000
```

## 4. Ask Questions

Try:

```text
Which region has the highest revenue?
```

```text
Which clinic has the highest average wait minutes?
```

```text
Which program has the highest completion rate?
```

```text
Show the main trend over time.
```

## 5. Run Tests

```bash
npm test
```

Expected result:

```text
pass 7
fail 0
```

## 6. API Examples

List datasets:

```bash
curl 'http://127.0.0.1:3000/api/datasets'
```

Ask a question:

```bash
curl 'http://127.0.0.1:3000/api/ask?dataset=health&q=Which%20clinic%20has%20the%20highest%20average%20wait%20minutes%3F'
```

Check connectors:

```bash
curl 'http://127.0.0.1:3000/api/connectors'
```

## Offline Mode

Offline mode is the default.

It uses:

- `data/sales.csv`
- `data/health.csv`
- `data/education.csv`

No internet is needed after the repo is on your machine.

## Changing The Port

```bash
PORT=4000 npm start
```

Then open:

```text
http://127.0.0.1:4000
```

## Common Issues

If port `3000` is busy:

```bash
PORT=3002 npm start
```

If cloud connectors show `not_configured`, that is normal unless you have installed the optional SDK and set the required environment variables.
