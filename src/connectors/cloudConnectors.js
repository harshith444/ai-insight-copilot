const connectorSpecs = [
  {
    id: "snowflake",
    name: "Snowflake",
    mode: "online",
    packageName: "snowflake-sdk",
    env: ["SNOWFLAKE_ACCOUNT", "SNOWFLAKE_USERNAME", "SNOWFLAKE_PASSWORD", "SNOWFLAKE_WAREHOUSE", "SNOWFLAKE_DATABASE", "SNOWFLAKE_SCHEMA"],
    description: "Discovers warehouse schema from INFORMATION_SCHEMA and can execute read-only analytical SQL."
  },
  {
    id: "aws_s3",
    name: "AWS S3",
    mode: "online",
    packageName: "@aws-sdk/client-s3",
    env: ["AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "S3_BUCKET"],
    description: "Lists CSV or Parquet objects from S3 for offline-style profiling after download or streaming."
  },
  {
    id: "azure_blob",
    name: "Azure Blob Storage",
    mode: "online",
    packageName: "@azure/storage-blob",
    env: ["AZURE_STORAGE_CONNECTION_STRING", "AZURE_STORAGE_CONTAINER"],
    description: "Lists blob datasets from Azure Storage and prepares them for profiling and analysis."
  }
];

export async function cloudConnectorStatuses() {
  return Promise.all(connectorSpecs.map(connectorStatus));
}

export async function connectorStatus(spec) {
  const missingEnv = spec.env.filter((key) => !process.env[key]);
  const sdkAvailable = await hasPackage(spec.packageName);

  return {
    id: spec.id,
    name: spec.name,
    mode: spec.mode,
    status: missingEnv.length === 0 && sdkAvailable ? "ready" : "not_configured",
    description: spec.description,
    env: spec.env,
    missingEnv,
    packageName: spec.packageName,
    sdkAvailable,
    notes: buildNotes(spec, missingEnv, sdkAvailable)
  };
}

export async function discoverSnowflakeTables() {
  const spec = connectorSpecs.find((connector) => connector.id === "snowflake");
  const status = await connectorStatus(spec);
  if (status.status !== "ready") return { status, tables: [] };

  const snowflake = await import("snowflake-sdk");
  const connection = snowflake.default.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT,
    username: process.env.SNOWFLAKE_USERNAME,
    password: process.env.SNOWFLAKE_PASSWORD,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE,
    database: process.env.SNOWFLAKE_DATABASE,
    schema: process.env.SNOWFLAKE_SCHEMA
  });

  await connectSnowflake(connection);
  const rows = await executeSnowflake(connection, `
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = '${process.env.SNOWFLAKE_SCHEMA}'
    ORDER BY table_name, ordinal_position
  `);
  connection.destroy(() => {});
  return { status, tables: rows };
}

export async function listS3Objects() {
  const spec = connectorSpecs.find((connector) => connector.id === "aws_s3");
  const status = await connectorStatus(spec);
  if (status.status !== "ready") return { status, objects: [] };

  const { S3Client, ListObjectsV2Command } = await import("@aws-sdk/client-s3");
  const client = new S3Client({ region: process.env.AWS_REGION });
  const result = await client.send(new ListObjectsV2Command({ Bucket: process.env.S3_BUCKET, MaxKeys: 50 }));
  return {
    status,
    objects: (result.Contents || []).map((object) => ({
      key: object.Key,
      size: object.Size,
      updatedAt: object.LastModified
    }))
  };
}

export async function listAzureBlobs() {
  const spec = connectorSpecs.find((connector) => connector.id === "azure_blob");
  const status = await connectorStatus(spec);
  if (status.status !== "ready") return { status, objects: [] };

  const { BlobServiceClient } = await import("@azure/storage-blob");
  const service = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
  const container = service.getContainerClient(process.env.AZURE_STORAGE_CONTAINER);
  const objects = [];
  for await (const blob of container.listBlobsFlat()) {
    objects.push({ name: blob.name, size: blob.properties.contentLength, updatedAt: blob.properties.lastModified });
    if (objects.length >= 50) break;
  }
  return { status, objects };
}

async function hasPackage(packageName) {
  try {
    await import(packageName);
    return true;
  } catch {
    return false;
  }
}

function buildNotes(spec, missingEnv, sdkAvailable) {
  const notes = [];
  if (!sdkAvailable) notes.push(`Install optional package: npm install ${spec.packageName}`);
  if (missingEnv.length) notes.push(`Set environment variables: ${missingEnv.join(", ")}`);
  if (!notes.length) notes.push("Connector is configured and ready.");
  return notes;
}

function connectSnowflake(connection) {
  return new Promise((resolve, reject) => {
    connection.connect((error) => (error ? reject(error) : resolve()));
  });
}

function executeSnowflake(connection, sqlText) {
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText,
      complete: (error, _statement, rows) => (error ? reject(error) : resolve(rows))
    });
  });
}
