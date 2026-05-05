import { buildKnowledgeBase, retrieve, tokenize } from "./retriever.js";

export function analyzeQuestion(question, dataset) {
  const docs = buildKnowledgeBase(dataset.profile);
  const retrieved = retrieve(question, docs, 6);
  const plan = buildPlan(question, dataset.profile, retrieved);
  const result = executePlan(plan, dataset.rows);

  return {
    dataset: dataset.profile.name,
    intent: plan.intent,
    answer: result.answer,
    recommendation: result.recommendation,
    sql: plan.sql,
    chart: result.chart,
    retrievedContext: retrieved.map(({ id, title, text, score }) => ({ id, title, text, score })),
    plan,
    generatedAt: new Date().toISOString()
  };
}

export function listDatasets(datasets) {
  return Object.values(datasets).map((dataset) => ({
    id: dataset.id,
    name: dataset.profile.name,
    rows: dataset.profile.rowCount,
    columns: dataset.profile.columns.map((column) => ({
      name: column.name,
      type: column.type,
      examples: column.examples
    }))
  }));
}

function buildPlan(question, profile, retrieved) {
  const q = question.toLowerCase();
  const tokens = new Set(tokenize(question));
  const metric = selectMetric(profile, tokens, retrieved);
  const dimension = selectDimension(profile, tokens, retrieved, metric);
  const dateColumn = selectDate(profile, tokens, retrieved);
  const wantsTrend = includesAny(q, ["trend", "over time", "daily", "weekly", "timeline", "change"]);
  const wantsAverage = includesAny(q, ["average", "avg", "mean"]);
  const wantsCount = includesAny(q, ["count", "how many", "volume", "number of"]);
  const wantsHighest = includesAny(q, ["highest", "top", "best", "most", "maximum"]) || tokens.has("max");
  const wantsLowest = includesAny(q, ["lowest", "least", "minimum", "worst"]) || tokens.has("min");
  const wantsCompare = includesAny(q, ["compare", "by", "across", "breakdown", "group"]);
  const wantsSummary = includesAny(q, ["summary", "overview", "what is in", "describe", "about this dataset"]);

  if (wantsSummary) {
    return summaryPlan(profile);
  }

  if (wantsTrend && dateColumn && metric) {
    return trendPlan(profile.name, dateColumn.name, metric.name, wantsAverage ? "AVG" : "SUM");
  }

  if ((wantsHighest || wantsLowest || wantsCompare || dimension) && dimension && metric) {
    const aggregation = wantsAverage ? "AVG" : wantsCount ? "COUNT" : "SUM";
    const sort = wantsLowest ? "ASC" : "DESC";
    return groupedPlan(profile.name, dimension.name, metric.name, aggregation, sort);
  }

  if (metric) {
    const aggregation = wantsAverage ? "AVG" : wantsCount ? "COUNT" : "SUM";
    return metricPlan(profile.name, metric.name, aggregation);
  }

  if (dimension) {
    return distributionPlan(profile.name, dimension.name);
  }

  return summaryPlan(profile);
}

function executePlan(plan, rows) {
  if (plan.type === "grouped") {
    const grouped = groupAggregate(rows, plan.dimension, plan.metric, plan.aggregation);
    const sorted = Object.entries(grouped).sort((a, b) => (plan.sort === "ASC" ? a[1] - b[1] : b[1] - a[1]));
    const [leader, value] = sorted[0];
    return {
      answer: `${leader} is the leading ${plan.dimension} for ${plan.aggregation.toLowerCase()}(${plan.metric}) at ${format(value)}.`,
      recommendation: `Compare the top and bottom ${plan.dimension} groups to understand what is driving the gap.`,
      chart: toChart(Object.fromEntries(sorted.slice(0, 10)), `${plan.metric} by ${plan.dimension}`)
    };
  }

  if (plan.type === "trend") {
    const grouped = groupAggregate(rows, plan.dateColumn, plan.metric, plan.aggregation);
    const sorted = Object.fromEntries(Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)));
    const values = Object.values(sorted);
    const first = values[0];
    const last = values.at(-1);
    const direction = last >= first ? "up" : "down";
    return {
      answer: `${plan.metric} is trending ${direction}, moving from ${format(first)} to ${format(last)} over the available timeline.`,
      recommendation: `Segment the trend by a categorical column to find what explains the ${direction} movement.`,
      chart: toChart(sorted, `${plan.metric} trend`)
    };
  }

  if (plan.type === "metric") {
    const value = aggregate(rows, plan.metric, plan.aggregation);
    return {
      answer: `${plan.aggregation.toLowerCase()}(${plan.metric}) is ${format(value)} across ${rows.length} records.`,
      recommendation: "Ask for a breakdown by a category column to make this metric more actionable.",
      chart: toChart({ [plan.metric]: value }, `${plan.aggregation} ${plan.metric}`)
    };
  }

  if (plan.type === "distribution") {
    const counts = groupCount(rows, plan.dimension);
    const sorted = Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10));
    return {
      answer: `${plan.dimension} has ${Object.keys(counts).length} groups. The largest group is ${Object.entries(sorted)[0][0]}.`,
      recommendation: "Pair this distribution with a numeric metric for performance comparison.",
      chart: toChart(sorted, `${plan.dimension} distribution`)
    };
  }

  const numeric = plan.profile.numericColumns.map((column) => `${column.name}: ${format(column.stats.sum)}`).join(", ");
  return {
    answer: `${plan.profile.name} has ${plan.profile.rowCount} rows and ${plan.profile.columns.length} columns. Numeric signals include ${numeric || "none"}.`,
    recommendation: "Ask about a metric, category, trend, average, top group, or distribution.",
    chart: toChart(
      Object.fromEntries(plan.profile.numericColumns.slice(0, 8).map((column) => [column.name, column.stats.sum])),
      "Numeric column totals"
    )
  };
}

function selectMetric(profile, tokens, retrieved) {
  const numeric = rankColumns(profile.numericColumns, tokens, retrieved);
  return numeric[0] || profile.numericColumns[0];
}

function selectDimension(profile, tokens, retrieved, metric) {
  const categorical = rankColumns(profile.categoricalColumns, tokens, retrieved).filter((column) => column.name !== metric?.name);
  return categorical[0] || null;
}

function selectDate(profile, tokens, retrieved) {
  const dates = rankColumns(profile.dateColumns, tokens, retrieved);
  return dates[0] || profile.dateColumns[0] || null;
}

function rankColumns(columns, tokens, retrieved) {
  return [...columns]
    .map((column) => ({
      column,
      score:
        columnScore(column, tokens) +
        retrieved.filter((doc) => doc.column === column.name).reduce((total, doc) => total + doc.score, 0)
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.column);
}

function columnScore(column, tokens) {
  const columnTokens = tokenize(`${column.name} ${column.examples.join(" ")}`);
  return columnTokens.reduce((score, token) => score + (tokens.has(token) ? 3 : 0), 0);
}

function groupedPlan(dataset, dimension, metric, aggregation, sort) {
  return {
    type: "grouped",
    intent: `${aggregation} ${metric} by ${dimension}`,
    dataset,
    dimension,
    metric,
    aggregation,
    sort,
    sql: `SELECT ${dimension}, ${aggregation}(${metric}) AS value FROM ${tableName(dataset)} GROUP BY ${dimension} ORDER BY value ${sort};`
  };
}

function trendPlan(dataset, dateColumn, metric, aggregation) {
  return {
    type: "trend",
    intent: `${metric} trend over ${dateColumn}`,
    dataset,
    dateColumn,
    metric,
    aggregation,
    sql: `SELECT ${dateColumn}, ${aggregation}(${metric}) AS value FROM ${tableName(dataset)} GROUP BY ${dateColumn} ORDER BY ${dateColumn};`
  };
}

function metricPlan(dataset, metric, aggregation) {
  return {
    type: "metric",
    intent: `${aggregation} ${metric}`,
    dataset,
    metric,
    aggregation,
    sql: `SELECT ${aggregation}(${metric}) AS value FROM ${tableName(dataset)};`
  };
}

function distributionPlan(dataset, dimension) {
  return {
    type: "distribution",
    intent: `${dimension} distribution`,
    dataset,
    dimension,
    sql: `SELECT ${dimension}, COUNT(*) AS records FROM ${tableName(dataset)} GROUP BY ${dimension} ORDER BY records DESC;`
  };
}

function summaryPlan(profile) {
  return {
    type: "summary",
    intent: "Dataset summary",
    profile,
    sql: `SELECT COUNT(*) AS rows FROM ${tableName(profile.name)};`
  };
}

function groupAggregate(rows, dimension, metric, aggregation) {
  const groups = rows.reduce((acc, row) => {
    acc[row[dimension]] ||= [];
    acc[row[dimension]].push(Number(row[metric] || 0));
    return acc;
  }, {});
  return Object.fromEntries(Object.entries(groups).map(([key, values]) => [key, aggregateValues(values, aggregation)]));
}

function groupCount(rows, dimension) {
  return rows.reduce((acc, row) => {
    acc[row[dimension]] = (acc[row[dimension]] || 0) + 1;
    return acc;
  }, {});
}

function aggregate(rows, metric, aggregation) {
  return aggregateValues(rows.map((row) => Number(row[metric] || 0)), aggregation);
}

function aggregateValues(values, aggregation) {
  if (aggregation === "AVG") return values.reduce((sum, value) => sum + value, 0) / values.length;
  if (aggregation === "COUNT") return values.length;
  return values.reduce((sum, value) => sum + value, 0);
}

function toChart(grouped, title) {
  return {
    title,
    labels: Object.keys(grouped),
    values: Object.values(grouped)
  };
}

function includesAny(text, phrases) {
  return phrases.some((phrase) => text.includes(phrase));
}

function tableName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function format(value) {
  return Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 });
}
