import { localCsvConnector, loadLocalCsvDatasets } from "./localCsv.js";
import { cloudConnectorStatuses, discoverSnowflakeTables, listAzureBlobs, listS3Objects } from "./cloudConnectors.js";

export function loadOfflineDatasets(root) {
  return loadLocalCsvDatasets(root);
}

export async function listConnectors(root) {
  return {
    offlineFirst: true,
    activeDatasetConnector: "local_csv",
    connectors: [localCsvConnector(root), ...(await cloudConnectorStatuses())]
  };
}

export async function previewConnector(id) {
  if (id === "snowflake") return discoverSnowflakeTables();
  if (id === "aws_s3") return listS3Objects();
  if (id === "azure_blob") return listAzureBlobs();
  return { status: { id, status: "unsupported" }, objects: [] };
}
