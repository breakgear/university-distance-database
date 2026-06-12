import { execFileSync } from "node:child_process";

const rootDir = process.cwd();

if (process.env.SUPABASE_BUILD_SYNC === "true") {
  console.log("Pulling the latest Supabase data before the production build...");
  execFileSync(
    process.execPath,
    ["--no-warnings", "--experimental-strip-types", "scripts/pull-supabase-to-csv.ts"],
    { cwd: rootDir, env: process.env, stdio: "inherit" }
  );
}

execFileSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["next", "build"],
  { cwd: rootDir, env: process.env, stdio: "inherit" }
);
