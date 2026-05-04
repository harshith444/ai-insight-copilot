import test from "node:test";
import assert from "node:assert/strict";
import { analyzeQuestion } from "../src/copilot.js";
import { loadCsv } from "../src/csv.js";

const rows = loadCsv(new URL("../data/sales.csv", import.meta.url));

test("answers top region questions", () => {
  const result = analyzeQuestion("Which region has the highest revenue?", rows);
  assert.equal(result.intent, "Top revenue region");
  assert.match(result.sql, /GROUP BY region/);
  assert.ok(result.chart.values.length > 0);
});

test("creates an executive summary fallback", () => {
  const result = analyzeQuestion("What is happening?", rows);
  assert.equal(result.intent, "Executive summary");
  assert.match(result.answer, /revenue/);
});
