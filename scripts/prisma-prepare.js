/**
 * Dynamic Prisma Schema Provider Configurator
 * Ensures seamless compatibility between:
 * - Railway PostgreSQL (production / staging)
 * - Local SQLite / PostgreSQL development
 */

const fs = require("fs");
const path = require("path");

const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Attempt to read from .env if present
  const envPath = path.join(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    const match = content.match(/^DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/m);
    if (match) {
      return match[1];
    }
  }

  return null;
}

function determineProvider() {
  // 1. Explicit CLI argument: node scripts/prisma-prepare.js [postgresql|sqlite]
  const arg = process.argv[2]?.toLowerCase();
  if (arg === "postgresql" || arg === "postgres") return "postgresql";
  if (arg === "sqlite") return "sqlite";

  // 2. Explicit environment variable override
  if (process.env.PRISMA_DB_PROVIDER) {
    const envProv = process.env.PRISMA_DB_PROVIDER.toLowerCase();
    if (envProv === "postgresql" || envProv === "postgres") return "postgresql";
    if (envProv === "sqlite") return "sqlite";
  }

  // 3. Railway / Cloud detection
  if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_STATIC_URL || process.env.RAILWAY_SERVICE_ID) {
    return "postgresql";
  }

  // 4. Auto-detect from DATABASE_URL
  const dbUrl = getDatabaseUrl();
  if (dbUrl) {
    if (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://")) {
      return "postgresql";
    }
    if (dbUrl.startsWith("file:") || dbUrl.startsWith("sqlite:")) {
      return "sqlite";
    }
  }

  // Default fallback is sqlite for local dev unless overridden
  return "sqlite";
}

function updateSchema() {
  if (!fs.existsSync(schemaPath)) {
    console.error(`[Prisma Prepare] Error: schema file not found at ${schemaPath}`);
    process.exit(1);
  }

  const targetProvider = determineProvider();
  const currentContent = fs.readFileSync(schemaPath, "utf-8");

  // Regex to match provider = "..." in datasource db block
  const providerRegex = /(datasource\s+db\s*\{[\s\S]*?provider\s*=\s*)"[^"]+"([\s\S]*?\})/;

  if (!providerRegex.test(currentContent)) {
    console.warn("[Prisma Prepare] Warning: Could not locate datasource db provider block in schema.");
    return;
  }

  const updatedContent = currentContent.replace(providerRegex, `$1"${targetProvider}"$2`);

  if (currentContent !== updatedContent) {
    fs.writeFileSync(schemaPath, updatedContent, "utf-8");
    console.log(`[Prisma Prepare] Updated Prisma provider to: "${targetProvider}"`);
  } else {
    console.log(`[Prisma Prepare] Prisma provider is already: "${targetProvider}"`);
  }
}

updateSchema();

