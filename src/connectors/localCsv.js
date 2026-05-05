import { join } from "node:path";
import { loadCsv } from "../csv.js";
import { profileDataset } from "../profile.js";

const bundledDatasets = [
  ["sales", "Sales Performance", "sales.csv"],
  ["health", "Healthcare Operations", "health.csv"],
  ["education", "Education Programs", "education.csv"]
];

export function loadLocalCsvDatasets(root) {
  return Object.fromEntries(
    bundledDatasets.map(([id, name, filename]) => {
      const rows = loadCsv(join(root, "data", filename));
      return [
        id,
        {
          id,
          connector: "local_csv",
          source: filename,
          rows,
          profile: profileDataset(name, rows)
        }
      ];
    })
  );
}

export function localCsvConnector(root) {
  const datasets = loadLocalCsvDatasets(root);
  return {
    id: "local_csv",
    name: "Local CSV",
    mode: "offline",
    status: "ready",
    description: "Runs completely offline against bundled or local CSV files.",
    datasets: Object.keys(datasets),
    env: [],
    notes: ["No internet, API key, warehouse, or cloud account required."]
  };
}
