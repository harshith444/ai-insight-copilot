export function buildKnowledgeBase(dataset) {
  const docs = [
    {
      id: "dataset-overview",
      kind: "overview",
      title: `${dataset.name} overview`,
      text: `${dataset.name} has ${dataset.rowCount} rows, ${dataset.columns.length} columns, numeric columns ${names(dataset.numericColumns)}, categorical columns ${names(dataset.categoricalColumns)}, and date columns ${names(dataset.dateColumns)}.`
    },
    ...dataset.columns.map((column) => ({
      id: `column-${column.name}`,
      kind: "column",
      column: column.name,
      title: `${column.name} column`,
      text: columnText(column)
    }))
  ];

  return docs.map((doc) => ({ ...doc, tokens: tokenize(`${doc.title} ${doc.text}`) }));
}

export function retrieve(question, docs, limit = 5) {
  const queryTokens = tokenize(question);
  return docs
    .map((doc) => ({ ...doc, score: score(queryTokens, doc.tokens) }))
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/[^a-z0-9.\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((token) => [token, singular(token)]);
}

function score(queryTokens, docTokens) {
  const docSet = new Set(docTokens);
  return queryTokens.reduce((total, token) => total + (docSet.has(token) ? 1 : 0), 0);
}

function columnText(column) {
  const parts = [
    `${column.name} is a ${column.type} column`,
    `${column.uniqueCount} unique values`,
    `${column.missing} missing values`,
    `examples ${column.examples.join(" ")}`
  ];
  if (column.stats) {
    parts.push(`min ${column.stats.min}`, `max ${column.stats.max}`, `mean ${column.stats.mean}`, `sum ${column.stats.sum}`);
  }
  if (column.dateRange) {
    parts.push(`date range ${column.dateRange.min} to ${column.dateRange.max}`);
  }
  return parts.join(". ");
}

function names(columns) {
  return columns.map((column) => column.name).join(", ") || "none";
}

function singular(token) {
  return token.endsWith("s") ? token.slice(0, -1) : token;
}
