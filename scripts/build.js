// Precompiles the app's JSX entry points into plain JS so the browser can
// just run them, instead of shipping raw JSX + @babel/standalone and
// re-parsing/re-transpiling the whole thing client-side on every page load
// (studlin-app.jsx alone is 26k+ lines -- that live transpile is what was
// making sign-in -> app feel slow). Output goes in build/, which is
// git-ignored: Vercel runs this script during deploy (see vercel.json's
// buildCommand), and locally `npm run build:watch` keeps it fresh while
// editing.
//
// Uses esbuild's JSX-only transform (loader:"jsx", no bundling/format) so
// each output file is a drop-in replacement for the matching *.jsx file --
// same top-level/global scope, same reliance on React/Firebase/etc already
// being on `window` from other <script> tags on the page. This is the same
// transform tests/harness.js already runs against studlin-app.jsx, so it's
// proven against this exact file.
const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "build");
const ENTRIES = ["studlin-app.jsx", "onboarding.jsx", "signin.jsx"];

function compileOne(name, { dev = false } = {}) {
  const srcPath = path.join(ROOT, name);
  const src = fs.readFileSync(srcPath, "utf8");
  const { code, warnings } = esbuild.transformSync(src, {
    loader: "jsx",
    jsx: "transform",
    // Inline sourcemaps roughly triple file size (base64-encoded source
    // embedded in the output) -- fine for local debugging, not something
    // we want on every production page load, so only dev/watch mode gets
    // one.
    sourcemap: dev ? "inline" : false,
    sourcefile: name,
    // NOT minified, even in prod. esbuild's minifier introduced a real
    // "Cannot access 'h' before initialization" TDZ ReferenceError inside
    // App() on the live site (confirmed 2026-08-10 by reproducing it
    // directly against the deployed bundle) -- almost certainly a variable-
    // lifetime mis-analysis across some closure, not something worth
    // debugging blind against a minifier's internals. The actual goal here
    // is skipping the live in-browser Babel transpile, not shaving extra
    // bytes off an already-cached file; minification was a bonus that
    // isn't worth the correctness risk.
    minify: false,
  });
  for (const w of warnings) console.warn(`[build] ${name}: ${w.text}`);
  const outPath = path.join(OUT_DIR, name.replace(/\.jsx$/, ".js"));
  fs.writeFileSync(outPath, code);
  console.log(`[build] ${name} -> ${path.relative(ROOT, outPath)} (${(code.length / 1024).toFixed(0)}kb)`);
}

function buildAll({ dev = false } = {}) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const entry of ENTRIES) compileOne(entry, { dev });
}

function watch() {
  buildAll({ dev: true });
  console.log("[build] watching for changes...");
  for (const entry of ENTRIES) {
    let pending = false;
    fs.watch(path.join(ROOT, entry), () => {
      if (pending) return;
      pending = true;
      setTimeout(() => {
        pending = false;
        try {
          compileOne(entry, { dev: true });
        } catch (e) {
          console.error(`[build] ${entry} failed:`, e.message);
        }
      }, 100);
    });
  }
}

if (require.main === module) {
  if (process.argv.includes("--watch")) watch();
  else buildAll();
}
