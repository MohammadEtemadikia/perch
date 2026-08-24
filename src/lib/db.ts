import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

// When packaged, electron/main.cjs sets DB_DIR to app.getPath('userData') and
// passes it to the spawned Next server process. In plain `next dev`/`next start`
// there is no Electron process, so we fall back to a local ./data folder.
const dataDir = process.env.DB_DIR || path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "perch.db");

declare global {
  // eslint-disable-next-line no-var
  var __perchDb: Database.Database | undefined;
}

function createConnection(): Database.Database {
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  // Next.js's build-time page-data collection can spin up several worker
  // processes that each open this file at nearly the same instant; without a
  // busy timeout the schema-creation transaction below can hit SQLITE_BUSY.
  db.pragma("busy_timeout = 5000");

  const schemaPath = path.join(process.cwd(), "db", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  db.exec(schema);

  return db;
}

// Next.js dev mode re-evaluates modules on every request; cache on globalThis
// so we don't reopen the database file constantly.
export const db: Database.Database =
  globalThis.__perchDb ?? createConnection();

if (process.env.NODE_ENV !== "production") {
  globalThis.__perchDb = db;
}

export function getDbPath(): string {
  return dbPath;
}
