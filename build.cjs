// build.cjs — bundles all source JS/JSX into one minified app.bundle.js so the
// browser doesn't have to run Babel at runtime. Run with: node build.cjs (or npm run build).
//
// Why this exists:
//   Without this bundle, every page load makes the browser download Babel
//   standalone (~3 MB), then re-compile 7+ JSX files on the fly. That uses
//   15-25 MB of RAM and takes 5-15 s on entry-level phones, often triggering
//   Chrome's "Unable to complete previous operation due to low memory" warning.
//
//   With this bundle, the browser downloads one ~150 KB pre-compiled JS file
//   and executes it directly. Memory use drops to 3-5 MB and load time to 1-2 s.

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const HERE = __dirname;

// IMPORTANT: order matters. Plain JS deps first (data.js sets up EcoData, etc.)
// then JSX components (each exposes its exports via `window.X = X` so other
// IIFEs can reach them), finally app.jsx which mounts React.
const SOURCES = [
  // data layer (plain JS, no JSX)
  'data.js',
  'cloud-sync.js',
  'ai-client.js',
  // React components (JSX)
  'tweaks-panel.jsx',
  'components.jsx',
  'mobile-view.jsx',
  'bigscreen-view.jsx',
  'admin-view.jsx',
  'ai-scan-view.jsx',
  'reward-corner-view.jsx',
  // entry point — must come last
  'app.jsx',
];

async function build() {
  // Wrap each file in its own IIFE so top-level `const` declarations
  // (especially `const { useState, ... } = React;`) don't collide across files.
  // Each file is expected to expose its public symbols by assigning to
  // `window.X` (which the existing source already does).
  const parts = SOURCES.map(file => {
    const fullPath = path.join(HERE, file);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Source file not found: ${file}`);
    }
    const src = fs.readFileSync(fullPath, 'utf8');
    return `/* ===== ${file} ===== */\n;(function(){\n${src}\n})();\n`;
  });

  const combined = parts.join('\n');

  const result = await esbuild.transform(combined, {
    loader: 'jsx',
    minify: true,
    target: ['chrome70', 'safari13', 'firefox70'],
    legalComments: 'none',
    sourcefile: 'eco-warrior-bundle.jsx',
  });

  const outPath = path.join(HERE, 'app.bundle.js');
  const header = `/*! 环保小兵 · Eco Warrior League — bundled ${new Date().toISOString()} */\n`;
  fs.writeFileSync(outPath, header + result.code, 'utf8');

  const sizeKB = (Buffer.byteLength(result.code, 'utf8') / 1024).toFixed(1);
  const srcCount = SOURCES.length;
  console.log(`✅ Wrote app.bundle.js  (${sizeKB} KB, from ${srcCount} source files)`);

  if (result.warnings && result.warnings.length) {
    console.warn('⚠️ esbuild warnings:');
    for (const w of result.warnings) console.warn(' -', w.text);
  }
}

async function watch() {
  console.log('👀 Watch mode — rebuilding on changes. Ctrl+C to stop.');
  await build();
  fs.watch(HERE, { recursive: false }, async (event, filename) => {
    if (!filename) return;
    if (!SOURCES.includes(filename)) return;
    console.log(`🔄 ${filename} changed, rebuilding…`);
    try {
      await build();
    } catch (e) {
      console.error('❌ Build error:', e.message);
    }
  });
}

const isWatch = process.argv.includes('--watch') || process.argv.includes('-w');
const run = isWatch ? watch : build;

run().catch(err => {
  console.error('❌ Build failed:', err.message);
  process.exit(1);
});
