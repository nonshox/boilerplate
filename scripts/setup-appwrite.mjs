/**
 * Creates mono's Appwrite tables (users, notifications, telegram, codes).
 * Idempotent: existing tables/columns/indexes are reused; missing ones are
 * created. Safe to run on every fresh clone.
 *
 *   npm run setup
 */
import { setTimeout as delay } from "node:timers/promises";
import { Client, TablesDB, AppwriteException } from "node-appwrite";

try {
  process.loadEnvFile(".env");
} catch {
  console.error("Missing .env — copy .env.example and fill it in first.");
  process.exit(1);
}
try {
  process.loadEnvFile(".env.secret");
} catch {
  // Optional overlay; .env alone is fine.
}

const { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_DATABASE_ID, APPWRITE_API_KEY } =
  process.env;
for (const [key, value] of Object.entries({
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_DATABASE_ID,
  APPWRITE_API_KEY,
})) {
  if (!value) {
    console.error(`${key} is not set.`);
    process.exit(1);
  }
}

const databaseId = APPWRITE_DATABASE_ID;
const tables = new TablesDB(
  new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY),
);

/** Reference of everything mono needs. One lowercase word names only. */
const SPEC = [
  {
    id: "users",
    name: "users",
    columns: [
      { type: "email", key: "email", required: true },
      { type: "string", key: "name", size: 100, required: true },
    ],
    indexes: [],
  },
  {
    id: "notifications",
    name: "notifications",
    columns: [
      { type: "string", key: "recipient", size: 36, required: true },
      { type: "string", key: "actor", size: 36, required: true },
      { type: "string", key: "type", size: 64, required: true },
      { type: "string", key: "ref", size: 36, required: false },
      { type: "boolean", key: "read", required: true },
    ],
    indexes: [{ key: "recipient", type: "key", columns: ["recipient"] }],
  },
  {
    id: "telegram",
    name: "telegram",
    columns: [
      { type: "string", key: "user", size: 36, required: true },
      { type: "string", key: "member", size: 64, required: true },
      { type: "string", key: "chat", size: 64, required: true },
      { type: "datetime", key: "created", required: true },
    ],
    indexes: [
      { key: "user", type: "unique", columns: ["user"] },
      { key: "member", type: "unique", columns: ["member"] },
    ],
  },
  {
    id: "codes",
    name: "codes",
    columns: [
      { type: "string", key: "user", size: 36, required: true },
      { type: "string", key: "hash", size: 64, required: true },
      { type: "datetime", key: "expires", required: true },
      { type: "boolean", key: "used", required: true },
    ],
    indexes: [{ key: "hash", type: "unique", columns: ["hash"] }],
  },
];

/** Retries network flakiness (connect timeouts) with backoff. */
async function api(fn, label, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const isAppwrite4xx =
        error instanceof AppwriteException &&
        error.code >= 400 &&
        error.code < 500;
      if (isAppwrite4xx || attempt === attempts) throw error;
      console.log(`  retry ${attempt}/${attempts - 1} (${label})…`);
      await delay(1500 * attempt);
    }
  }
  throw lastError;
}

const results = [];

for (const spec of SPEC) {
  await ensureTable(spec);
}

console.log("\nSetup summary:");
for (const line of results) console.log(`  ${line}`);
console.log("\nDone. Tables are ready for `npm run dev`.");

async function ensureTable(spec) {
  const existing = await tryGetTable(spec.id);
  if (!existing) {
    await api(() => tables.createTable({ databaseId, tableId: spec.id, name: spec.name }), `create table ${spec.id}`);
    results.push(`table ${spec.id}: created`);
  } else {
    results.push(`table ${spec.id}: exists`);
  }

  const columnStatus = new Map();
  for (const column of await listColumns(spec.id)) {
    columnStatus.set(column.key, column.status);
  }

  for (const column of spec.columns) {
    if (columnStatus.has(column.key)) {
      results.push(`  column ${column.key}: exists`);
      continue;
    }
    await createColumn(spec.id, column);
    results.push(`  column ${column.key}: created`);
    await waitForColumn(spec.id, column.key);
  }

  const indexKeys = new Set((await listIndexes(spec.id)).map((index) => index.key));
  for (const index of spec.indexes) {
    if (indexKeys.has(index.key)) {
      results.push(`  index ${index.key}: exists`);
      continue;
    }
    await api(
      () =>
        tables.createIndex({
          databaseId,
          tableId: spec.id,
          key: index.key,
          type: index.type,
          columns: index.columns,
        }),
      `create index ${spec.id}.${index.key}`,
    );
    results.push(`  index ${index.key}: created`);
  }
}

async function createColumn(tableId, column) {
  const run = (fn) => api(fn, `create column ${tableId}.${column.key}`);
  const base = {
    databaseId,
    tableId,
    key: column.key,
    required: column.required,
    ...(column.xdefault !== undefined ? { xdefault: column.xdefault } : {}),
  };
  switch (column.type) {
    case "string":
      return run(() => tables.createStringColumn({ ...base, size: column.size }));
    case "email":
      return run(() => tables.createEmailColumn(base));
    case "boolean":
      return run(() => tables.createBooleanColumn(base));
    case "datetime":
      return run(() => tables.createDatetimeColumn(base));
    default:
      throw new Error(`Unknown column type ${column.type}`);
  }
}

async function tryGetTable(tableId) {
  try {
    return await api(
      () => tables.getTable({ databaseId, tableId }),
      `get table ${tableId}`,
    );
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 404) return null;
    throw error;
  }
}

async function listColumns(tableId) {
  const result = await api(() => tables.listColumns({ databaseId, tableId }), `list columns ${tableId}`);
  return result.columns ?? [];
}

async function listIndexes(tableId) {
  const result = await api(() => tables.listIndexes({ databaseId, tableId }), `list indexes ${tableId}`);
  return result.indexes ?? [];
}

async function waitForColumn(tableId, key) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const column = await api(() => tables.getColumn({ databaseId, tableId, key }), `get column ${tableId}.${key}`);
    if (column.status === "available") return;
    if (column.status === "failed" || column.status === "stuck") {
      throw new Error(`Column ${key} entered status ${column.status}.`);
    }
    await delay(500);
  }
  throw new Error(`Column ${key} did not become available in time.`);
}
