#!/usr/bin/env node
/**
 * Collects production artifacts into a clean desktop_dist/ folder,
 * mirroring the delivery style of a normal Windows app:
 *
 *   desktop_dist/
 *     Streakosaurus Setup 0.1.0.exe   <- the installer (double-click to install)
 *     Streakosaurus 0.1.0.exe         <- the standalone application exe
 *
 * The official Tauri artifacts in src-tauri/target/release/... are left
 * untouched — this only copies them under friendly names.
 *
 * Usage: node scripts/make-dist.mjs   (after `tauri build`)
 */

import { readFileSync, copyFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;

const releaseDir = join(root, 'src-tauri', 'target', 'release');
const sources = {
  setup: join(releaseDir, 'bundle', 'nsis', `Streakosaurus_${version}_x64-setup.exe`),
  app: join(releaseDir, 'app.exe'),
};

for (const [key, src] of Object.entries(sources)) {
  if (!existsSync(src)) {
    console.error(`Missing ${key} artifact: ${src}`);
    console.error('Run the production build first:  npm run tauri:build');
    process.exit(1);
  }
}

const distDir = join(root, 'desktop_dist');
mkdirSync(distDir, { recursive: true });

const outputs = [
  [sources.setup, join(distDir, `Streakosaurus Setup ${version}.exe`)],
  [sources.app, join(distDir, `Streakosaurus ${version}.exe`)],
];

console.log(`desktop_dist/ (version ${version}):`);
for (const [src, dest] of outputs) {
  copyFileSync(src, dest);
  const mb = (statSync(dest).size / (1024 * 1024)).toFixed(1);
  console.log(`  ${dest.slice(root.length + 1)}  (${mb} MB)`);
}
