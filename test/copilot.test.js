import test from "node:test";
import assert from "node:assert/strict";
import { analyzeQuestion } from "../src/copilot.js";
import { loadCsv } from "../src/csv.js";
import { profileDataset } from "../src/profile.js";

function dataset(id, name, filename) {
  const rows = loadCsv(new URL(`../data/${filename}`, import.meta.url));
  return { id, rows, profile: profileDataset(name, rows) };
}

const sales = dataset("sales", "Sales Performance", "sales.csv");
const health = dataset("health", "Healthcare Operations", "health.csv");
const education = dataset("education", "Education Programs", "education.csv");

test("retrieves schema context and answers sales questions", () => {
  const result = analyzeQuestion("Which region has the highest revenue?", sales);
  assert.equal(result.intent, "SUM revenue by region");
  assert.match(result.sql, /GROUP BY region/);
  assert.ok(result.retrievedContext.some((item) => item.title.includes("region")));
  assert.ok(result.chart.values.length > 0);
});

test("works on healthcare data without business-specific hardcoding", () => {
  const result = analyzeQuestion("Which clinic has the highest average wait minutes?", health);
  assert.equal(result.intent, "AVG avg_wait_minutes by clinic");
  assert.match(result.sql, /AVG\(avg_wait_minutes\)/);
  assert.ok(result.answer.includes("clinic"));
});

test("works on education data with a different schema", () => {
  const result = analyzeQuestion("Which program has the highest completion rate?", education);
  assert.equal(result.intent, "SUM completion_rate by program");
  assert.match(result.sql, /GROUP BY program/);
  assert.ok(result.retrievedContext.some((item) => item.title.includes("completion_rate")));
});

test("creates a generic dataset summary fallback", () => {
  const result = analyzeQuestion("What is in this dataset?", health);
  assert.equal(result.intent, "Dataset summary");
  assert.match(result.answer, /Healthcare Operations/);
});
