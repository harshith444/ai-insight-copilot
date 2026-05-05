import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { listConnectors, loadOfflineDatasets, previewConnector } from "../src/connectors/registry.js";

const root = fileURLToPath(new URL("../", import.meta.url));

test("loads offline datasets without cloud credentials", () => {
  const datasets = loadOfflineDatasets(root);
  assert.deepEqual(Object.keys(datasets), ["sales", "health", "education"]);
  assert.equal(datasets.sales.connector, "local_csv");
});

test("reports local and cloud connector status", async () => {
  const result = await listConnectors(root);
  assert.equal(result.offlineFirst, true);
  assert.ok(result.connectors.some((connector) => connector.id === "local_csv" && connector.status === "ready"));
  assert.ok(result.connectors.some((connector) => connector.id === "snowflake"));
  assert.ok(result.connectors.some((connector) => connector.id === "aws_s3"));
  assert.ok(result.connectors.some((connector) => connector.id === "azure_blob"));
});

test("cloud preview is safe when connector is not configured", async () => {
  const result = await previewConnector("snowflake");
  assert.equal(result.status.id, "snowflake");
  assert.equal(result.status.status, "not_configured");
  assert.deepEqual(result.tables, []);
});
