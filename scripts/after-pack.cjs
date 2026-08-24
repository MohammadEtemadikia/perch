/**
 * Copies the built Next.js server into the packaged app.
 *
 * Done here rather than through electron-builder's `extraResources`: that
 * mechanism filters out any directory named `node_modules`, which would break
 * the standalone server (better-sqlite3's native binary lives in there).
 *
 * The copied `.next/standalone` tree was produced once, on the host machine,
 * by `npm run build:app` (via `electron-rebuild -f -w better-sqlite3` with no
 * --platform/--arch override, so its better-sqlite3 binary always matches the
 * HOST platform+arch). electron-builder can build several (platform, arch)
 * targets in one invocation (e.g. `--mac` produces both arm64 and x64), so
 * that single host-matched binary is wrong for every target except the one
 * that happens to match the host — every other target's packaged app gets a
 * server.js that can't load better-sqlite3 at all and crashes on launch
 * ("Perch could not start"). Rebuild it here, per target, after the copy.
 */
const fs = require("fs");
const path = require("path");
const { rebuild } = require("@electron/rebuild");
const { Arch } = require("electron-builder");

exports.default = async function afterPack(context) {
  const { appOutDir, electronPlatformName, packager, arch } = context;
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

  // @electron/rebuild needs two things that Next's output-file-tracing strips
  // out of the copied better-sqlite3 (correctly — neither is needed at
  // runtime, only to rebuild): `binding.gyp` (its absence makes rebuild()
  // silently skip the module instead of rebuilding it), and a resolvable
  // `prebuild-install` (needed to fetch the correct prebuilt binary instead
  // of falling back to node-gyp, which can't cross-compile). Borrow both
  // from the root node_modules for the duration of the rebuild call only —
  // the symlink points at a path that only exists on this build machine, so
  // it must not survive into the shipped installer.
  const rootNodeModules = path.join(packager.projectDir, "node_modules");
  const destBetterSqlite3 = path.join(destination, "node_modules", "better-sqlite3");
  const bindingGyp = path.join(destBetterSqlite3, "binding.gyp");
  const bindingGypAdded = !fs.existsSync(bindingGyp);
  if (bindingGypAdded) {
    await fs.promises.copyFile(path.join(rootNodeModules, "better-sqlite3", "binding.gyp"), bindingGyp);
  }
  const destPrebuildInstall = path.join(destination, "node_modules", "prebuild-install");
  const prebuildInstallAdded = !fs.existsSync(destPrebuildInstall);
  if (prebuildInstallAdded) {
    await fs.promises.symlink(path.join(rootNodeModules, "prebuild-install"), destPrebuildInstall, "dir");
  }

  const archName = Arch[arch];
  const electronVersion = require(path.join(packager.projectDir, "node_modules", "electron", "package.json")).version;
  try {
    console.log(`  • rebuilding better-sqlite3 for ${electronPlatformName}/${archName} (electron ${electronVersion})`);
    await rebuild({
      buildPath: destination,
      electronVersion,
      platform: electronPlatformName,
      arch: archName,
      onlyModules: ["better-sqlite3"],
      force: true,
    });
  } finally {
    if (bindingGypAdded) await fs.promises.rm(bindingGyp, { force: true });
    if (prebuildInstallAdded) await fs.promises.rm(destPrebuildInstall, { force: true });
  }

  // The prebuilt-binary swap above leaves the previous (host-platform) build's
  // intermediate object files sitting next to the new binary — harmless, but
  // pure bloat in the shipped installer.
  const releaseDir = path.join(destBetterSqlite3, "build", "Release");
  for (const junk of [".deps", "obj", "obj.target", "sqlite3.a", "test_extension.node"]) {
    await fs.promises.rm(path.join(releaseDir, junk), { recursive: true, force: true });
  }

  const entry = path.join(destination, "server.js");
  const runtime = path.join(destination, "node_modules", "next");
  const schema = path.join(destination, "db", "schema.sql");
  const nativeBinding = path.join(destination, "node_modules", "better-sqlite3", "build", "Release", "better_sqlite3.node");
  for (const required of [entry, runtime, schema, nativeBinding]) {
    if (!fs.existsSync(required)) {
      throw new Error(`Packaged server is incomplete: ${required} is missing.`);
    }
  }

  console.log(`  • bundled Next.js server  ${path.relative(appOutDir, destination)}`);
};
