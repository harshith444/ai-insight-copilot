import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeQuestion, listDatasets } from "./src/copilot.js";
import { loadCsv } from "./src/csv.js";
import { profileDataset } from "./src/profile.js";

const root = fileURLToPath(new URL(".", import.meta.url));
const datasets = loadDatasets();
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 3000);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (url.pathname === "/api/ask") {
    const question = url.searchParams.get("q") || "give me an executive summary";
    const datasetId = url.searchParams.get("dataset") || "sales";
    return json(response, analyzeQuestion(question, datasets[datasetId] || datasets.sales));
  }

  if (url.pathname === "/api/datasets") {
    return json(response, { datasets: listDatasets(datasets) });
  }

  if (url.pathname === "/api/data") {
    const datasetId = url.searchParams.get("dataset") || "sales";
    return json(response, { rows: (datasets[datasetId] || datasets.sales).rows });
  }

  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  try {
    const file = await readFile(join(root, "public", pathname));
    response.writeHead(200, { "content-type": mime[extname(pathname)] || "text/plain" });
    response.end(file);
  } catch {
    response.writeHead(404, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "Not found" }));
  }
});

server.listen(port, host, () => {
  console.log(`AI Insight Copilot running at http://${host}:${port}`);
});

function json(response, body) {
  response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body, null, 2));
}

function loadDatasets() {
  return Object.fromEntries(
    [
      ["sales", "Sales Performance", "sales.csv"],
      ["health", "Healthcare Operations", "health.csv"],
      ["education", "Education Programs", "education.csv"]
    ].map(([id, name, filename]) => {
      const rows = loadCsv(join(root, "data", filename));
      return [id, { id, rows, profile: profileDataset(name, rows) }];
    })
  );
}
