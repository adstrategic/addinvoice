import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { defineConfig, env } from "prisma/config";

// Get the directory where this config file is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from packages/db directory
dotenv.config({
  path: resolve(__dirname, ".env"),
  override: true,
});

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
