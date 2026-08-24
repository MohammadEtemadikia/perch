#!/usr/bin/env node
import { rmSync, existsSync } from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
for (const suffix of ["", "-wal", "-shm"]) {
  const file = path.join(dataDir, `perch.db${suffix}`);
  if (existsSync(file)) {
    rmSync(file);
    console.log(`removed ${file}`);
  }
}
console.log("Database reset. Run `npm run db:seed` to repopulate.");
