-- CreateEnum
CREATE TYPE "AgentLanguage" AS ENUM ('es', 'en', 'fr', 'pt', 'de');

-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN     "language" "AgentLanguage" NOT NULL DEFAULT 'en';
