/**
 * Copies the built Next.js server into the packaged app.
 *
 * Done here rather than through electron-builder's `extraResources`: that
 * mechanism filters out any directory named `node_modules`, which would break
 * the standalone server (better-sqlite3's native binary lives in there).
 */
const fs = require("fs");
const path = require("path");

exports.default = async function afterPack(context) {
  const { appOutDir, electronPlatformName, packager } = context;
  const source = path.join(packager.projectDir, ".next", "standalone");

  if (!fs.existsSync(source)) {
    throw new Error('Missing .next/standalone. Run "npm run build:app" before packaging.');
  }

  const resources =
    electronPlatformName === "darwin"
      ? path.join(appOutDir, `${packager.appInfo.productFilename}.app`, "Contents", "Resources")
      : path.join(appOutDir, "resources");

  const destination = path.join(resources, "server");
  await fs.promises.rm(destination, { recursive: true, force: true });
  await fs.promises.cp(source, destination, { recursive: true, dereference: true });

  const entry = path.join(destination, "server.js");
  const runtime = path.join(destination, "node_modules", "next");
  const schema = path.join(destination, "db", "schema.sql");
  for (const required of [entry, runtime, schema]) {
    if (!fs.existsSync(required)) {
      throw new Error(`Packaged server is incomplete: ${required} is missing.`);
    }
  }

  console.log(`  • bundled Next.js server  ${path.relative(appOutDir, destination)}`);
};
