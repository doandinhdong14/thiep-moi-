const { spawnSync } = require("child_process");
const path = require("path");

try {
  const tsxPkg = require.resolve("tsx/package.json");
  const tsxBin = path.join(path.dirname(tsxPkg), "dist", "cli.mjs");

  const res = spawnSync(process.execPath, [tsxBin, "prisma/seed.ts"], {
    stdio: "inherit",
    env: process.env,
  });

  process.exit(res.status !== null ? res.status : 0);
} catch (err) {
  console.error("[Seed Runner Error]:", err);
  process.exit(1);
}
