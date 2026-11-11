const { spawnSync } = require("child_process");
const path = require("path");

try {
  const prismaPkg = require.resolve("prisma/package.json");
  const prismaBin = path.join(path.dirname(prismaPkg), "build", "index.js");
  const args = process.argv.slice(2);

  const res = spawnSync(process.execPath, [prismaBin, ...args], {
    stdio: "inherit",
    env: process.env,
  });

  process.exit(res.status !== null ? res.status : 0);
} catch (err) {
  console.error("[Prisma Runner Error]:", err);
  process.exit(1);
}
