import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

dotenv.config({
  path: process.env.NODE_ENV === "TEST" ? ".env.test" : ".env",
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
