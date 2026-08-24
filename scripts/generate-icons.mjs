#!/usr/bin/env node
/**
 * Rasterizes build/icon-source.svg into every size electron-builder needs,
 * then assembles a macOS .iconset (for `iconutil`) and the top-level PNGs
 * used for Windows/Linux icon packing.
 */
import sharp from "sharp";
import pngToIco from "png-to-ico";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";

const root = process.cwd();
const svgPath = path.join(root, "build", "icon-source.svg");
const iconsetDir = path.join(root, "build", "icon.iconset");

mkdirSync(iconsetDir, { recursive: true });

// name -> pixel size, per Apple's iconset naming convention
const macSizes = {
  "icon_16x16.png": 16,
  "icon_16x16@2x.png": 32,
  "icon_32x32.png": 32,
  "icon_32x32@2x.png": 64,
  "icon_128x128.png": 128,
  "icon_128x128@2x.png": 256,
  "icon_256x256.png": 256,
  "icon_256x256@2x.png": 512,
  "icon_512x512.png": 512,
  "icon_512x512@2x.png": 1024,
};

for (const [name, size] of Object.entries(macSizes)) {
  await sharp(svgPath, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(path.join(iconsetDir, name));
  console.log(`iconset/${name} (${size}px)`);
}

// Plain top-level PNGs — used directly by Linux packaging, and as source
// frames for the Windows .ico packer.
const flatSizes = [16, 32, 48, 64, 128, 256, 512, 1024];
for (const size of flatSizes) {
  await sharp(svgPath, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(path.join(root, "build", `icon-${size}.png`));
  console.log(`build/icon-${size}.png`);
}

// electron-builder's generic fallback icon
await sharp(svgPath, { density: 384 }).resize(1024, 1024).png().toFile(path.join(root, "build", "icon.png"));
console.log("build/icon.png (1024px)");

// Windows .ico — packs the standard 16/32/48/256 frames into one file.
const icoSizes = [16, 32, 48, 256];
const icoBuffer = await pngToIco(icoSizes.map((size) => path.join(root, "build", `icon-${size}.png`)));
writeFileSync(path.join(root, "build", "icon.ico"), icoBuffer);
console.log("build/icon.ico");
