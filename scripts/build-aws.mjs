#!/usr/bin/env node
// Build the static export + Lambda bundle for the OWN AWS stack (aws/stack.yaml).
// Produces, under deploy/:
//   deploy/site/      -> static export (from out/), served at the ROOT of CloudFront
//   deploy/api/       -> Python Lambda (index.py + context.json)
//   deploy/api.zip    -> zipped Lambda bundle (index.py + context.json at the root)
//
// The site is served at the ROOT path, so NEXT_PUBLIC_BASE_PATH="" for this
// build (withBase() in src/lib/base.ts becomes a no-op; it is left intact for
// any sub-path deploy).
//
// Because `output: "export"` cannot coexist with the App Router `src/app/api`
// route, we TEMPORARILY move src/app/api out of the tree for the export build
// and ALWAYS restore it in a finally block (even on failure / Ctrl-C).
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const OUT = path.join(ROOT, "out");
const DEPLOY = path.join(ROOT, "deploy");
const DEPLOY_SITE = path.join(DEPLOY, "site");
const DEPLOY_API = path.join(DEPLOY, "api");
const DEPLOY_API_ZIP = path.join(DEPLOY, "api.zip");
const API_SRC = path.join(ROOT, "src", "app", "api");
const API_HIDDEN = path.join(ROOT, "src", "app", "_api.aws-build-hidden");
const PY_API = path.join(ROOT, "aws", "api");
const ADMIN_CONFIG = path.join(DEPLOY_SITE, "admin", "config.yml");

const ALLOW_PLACEHOLDERS = process.argv.includes("--allow-placeholders");

function run(cmd, env = {}) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { cwd: ROOT, stdio: "inherit", env: { ...process.env, ...env } });
}

function rmrf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

function restoreApi() {
  if (fs.existsSync(API_HIDDEN)) {
    if (fs.existsSync(API_SRC)) {
      console.warn("warning: both src/app/api and the hidden copy exist; leaving hidden copy in place.");
      return;
    }
    fs.renameSync(API_HIDDEN, API_SRC);
    console.log("restored src/app/api");
  }
}

// Replace __SITE_ORIGIN__ / __GITHUB_REPO__ in the EXPORTED admin/config.yml.
// The source public/admin/config.yml is owned by the frontend; we only rewrite
// the copy under deploy/site after the export. If the placeholders are not
// present we warn and skip (the frontend may use a different backend config).
function patchAdminConfig() {
  if (!fs.existsSync(ADMIN_CONFIG)) {
    console.warn(`note: ${ADMIN_CONFIG} not found; skipping admin config placeholder patch.`);
    return;
  }
  let text = fs.readFileSync(ADMIN_CONFIG, "utf8");
  const hasSiteOrigin = text.includes("__SITE_ORIGIN__");
  const hasRepo = text.includes("__GITHUB_REPO__");
  if (!hasSiteOrigin && !hasRepo) {
    console.warn("note: admin/config.yml has no __SITE_ORIGIN__ / __GITHUB_REPO__ placeholders; skipping.");
    return;
  }
  const siteOrigin = process.env.SITE_ORIGIN;
  const githubRepo = process.env.GITHUB_REPO;
  const missing = [];
  if (hasSiteOrigin && !siteOrigin) missing.push("SITE_ORIGIN");
  if (hasRepo && !githubRepo) missing.push("GITHUB_REPO");
  if (missing.length && !ALLOW_PLACEHOLDERS) {
    throw new Error(
      `admin/config.yml needs ${missing.join(", ")} to replace placeholders. ` +
        `Set the env var(s), or pass --allow-placeholders to leave them in.`
    );
  }
  if (missing.length) {
    console.warn(
      `warning: leaving admin placeholders unresolved (missing ${missing.join(", ")}); ` +
        `--allow-placeholders was set.`
    );
    return;
  }
  if (hasSiteOrigin) text = text.split("__SITE_ORIGIN__").join(siteOrigin);
  if (hasRepo) text = text.split("__GITHUB_REPO__").join(githubRepo);
  fs.writeFileSync(ADMIN_CONFIG, text, "utf8");
  console.log("patched admin/config.yml placeholders");
}

function zipApi() {
  // Zip the Lambda bundle with index.py + context.json at the archive root.
  rmrf(DEPLOY_API_ZIP);
  // -j would flatten; we want files at root and no tests/__pycache__.
  run(
    `cd ${JSON.stringify(DEPLOY_API)} && zip -q -r -X ${JSON.stringify(DEPLOY_API_ZIP)} . ` +
      `-x '*/__pycache__/*' '__pycache__/*' 'tests/*' '*.pyc'`
  );
  console.log(`assembled ${DEPLOY_API_ZIP}`);
}

async function main() {
  // 0) Clean slate.
  restoreApi();
  rmrf(OUT);
  rmrf(DEPLOY);

  // 1) Build the chat context JSON FIRST (the Lambda bundle needs it).
  run("node scripts/build-chat-context.mjs");

  // 2) Generate /public/flags (prebuild step), same as dev/build.
  run("node scripts/copy-flags.mjs");

  // 3) Move the Node API route out so `output: export` can run, then build.
  if (fs.existsSync(API_SRC)) {
    fs.renameSync(API_SRC, API_HIDDEN);
    console.log("moved src/app/api aside for the static export");
  }

  run("npx next build", {
    BUILD_TARGET: "aws",
    NEXT_PUBLIC_BASE_PATH: "", // served at the root
  });

  if (!fs.existsSync(OUT)) {
    throw new Error(`next build did not produce an export at ${OUT}`);
  }

  // 4) Assemble deploy/site from out/.
  fs.mkdirSync(DEPLOY, { recursive: true });
  fs.cpSync(OUT, DEPLOY_SITE, { recursive: true });
  console.log(`assembled ${DEPLOY_SITE}`);

  // 5) Rewrite the exported Decap admin config placeholders.
  patchAdminConfig();

  // 6) Assemble deploy/api from the repo's Python source (index.py + context.json).
  if (!fs.existsSync(path.join(PY_API, "index.py"))) {
    throw new Error(`missing Lambda source at ${PY_API}/index.py`);
  }
  fs.mkdirSync(DEPLOY_API, { recursive: true });
  fs.copyFileSync(path.join(PY_API, "index.py"), path.join(DEPLOY_API, "index.py"));
  const ctx = path.join(PY_API, "context.json");
  if (!fs.existsSync(ctx)) {
    throw new Error(`missing ${ctx}; run build-chat-context first`);
  }
  fs.copyFileSync(ctx, path.join(DEPLOY_API, "context.json"));
  console.log(`assembled ${DEPLOY_API}`);

  // 7) Zip the Lambda bundle.
  zipApi();

  console.log("\n\u2705 build:aws complete");
  console.log(`   static:  ${DEPLOY_SITE}`);
  console.log(`   backend: ${DEPLOY_API}`);
  console.log(`   zip:     ${DEPLOY_API_ZIP}`);
}

main()
  .catch((e) => {
    console.error("\nbuild:aws failed:", e.message);
    process.exitCode = 1;
  })
  .finally(() => {
    restoreApi();
  });

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    restoreApi();
    process.exit(1);
  });
}
