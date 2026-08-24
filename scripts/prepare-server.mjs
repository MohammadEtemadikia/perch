#!/usr/bin/env node
/**
 * Completes Next.js's standalone output for packaging into Electron.
 *
 * `next build` with `output: "standalone"` emits a self-contained server plus
 * a minimal node_modules but leaves out static assets (normally served by a
 * CDN) and any files read via plain fs at runtime (our db/schema.sql) — those
 * have to be copied in by hand or the packaged app breaks.
 */
import { cp, mkdir, rm, stat } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const root = process.cwd();
const standalone = path.join(root, ".next", "standalone");

if (!existsSync(standalone)) {
  console.error('Missing .next/standalone — run "next build" with output: "standalone" first.');
  process.exit(1);
}

async function copyInto(name, isDir = true) {
  const src = path.join(root, name);
  if (!existsSync(src)) return;
  const dest = path.join(standalone, name);
  await rm(dest, { recursive: true, force: true });
  await mkdir(path.dirname(dest), { recursive: true });
  await cp(src, dest, { recursive: isDir });
  console.log(`copied ${name}`);
}

await copyInto(path.join(".next", "static"));
await copyInto("public");
await copyInto("db");

// Next's output file tracing snapshots node_modules/better-sqlite3 at
// `next build` time, which runs under plain Node — but this app ships inside
// Electron, which has a different native module ABI. `npm run build:app`
// rebuilds the ROOT copy of better-sqlite3 against Electron's ABI right
// before this script runs; that rebuilt native binary has to be copied over
// the stale plain-Node one Next already traced into the standalone output,
// or the packaged app fails to open its database at startup.
const nativeModuleDir = path.join("node_modules", "better-sqlite3", "build");
const nativeSrc = path.join(root, nativeModuleDir);
if (existsSync(nativeSrc)) {
  const nativeDest = path.join(standalone, nativeModuleDir);
  await rm(nativeDest, { recursive: true, force: true });
  await mkdir(path.dirname(nativeDest), { recursive: true });
  await cp(nativeSrc, nativeDest, { recursive: true });
  console.log("copied Electron-rebuilt better-sqlite3 native binary");
}

const server = path.join(standalone, "server.js");
const info = await stat(server);
console.log(`standalone server ready (${info.size} bytes)`);
