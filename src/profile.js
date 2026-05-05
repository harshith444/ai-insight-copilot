export function profileDataset(name, rows) {
  const columns = Object.keys(rows[0] || {});
  const columnProfiles = columns.map((column) => profileColumn(column, rows));

  return {
    name,
    rowCount: rows.length,
    columns: columnProfiles,
    numericColumns: columnProfiles.filter((column) => column.type === "numeric"),
    categoricalColumns: columnProfiles.filter((column) => column.type === "categorical"),
    dateColumns: columnProfiles.filter((column) => column.type === "date")
  };
}

function profileColumn(name, rows) {
  const values = rows.map((row) => row[name]).filter((value) => value !== "" && value != null);
  const numericValues = values.map(Number).filter(Number.isFinite);
  const dateValues = values.map((value) => new Date(`${value}T00:00:00Z`)).filter((date) => Number.isFinite(date.getTime()));
  const unique = [...new Set(values.map(String))];
  const type = inferType(values, numericValues, dateValues);

  return {
    name,
    type,
    missing: rows.length - values.length,
    uniqueCount: unique.length,
    examples: unique.slice(0, 5),
    stats: type === "numeric" ? numericStats(numericValues) : null,
    dateRange: type === "date" ? dateRange(dateValues) : null
  };
}

function inferType(values, numericValues, dateValues) {
  if (values.length && numericValues.length / values.length >= 0.9) return "numeric";
  if (values.length && dateValues.length / values.length >= 0.9) return "date";
  return "categorical";
}

function numericStats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const total = values.reduce((sum, value) => sum + value, 0);
  return {
    min: sorted[0],
    max: sorted.at(-1),
    mean: total / values.length,
    sum: total
  };
}

function dateRange(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    min: sorted[0].toISOString().slice(0, 10),
    max: sorted.at(-1).toISOString().slice(0, 10)
  };
}
