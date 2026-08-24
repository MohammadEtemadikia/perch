#!/usr/bin/env node
/**
 * Removes previously packaged installers (dmg/exe/AppImage) before a new
 * `electron-builder` run, so old versions don't pile up in dist/.
 */
import { rmSync, existsSync } from "fs";
import path from "path";

const distDir = path.join(process.cwd(), "dist");
if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true, force: true });
  console.log(`removed ${distDir}`);
} else {
  console.log("dist/ does not exist, nothing to clean");
}
