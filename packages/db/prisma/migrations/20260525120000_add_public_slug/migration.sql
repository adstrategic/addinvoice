-- AlterTable
ALTER TABLE "invoices" ADD COLUMN "publicSlug" TEXT;

-- AlterTable
ALTER TABLE "estimates" ADD COLUMN "publicSlug" TEXT;

-- AlterTable
ALTER TABLE "proposals" ADD COLUMN "publicSlug" TEXT;

-- Backfill existing rows with unique public slugs
UPDATE "invoices" SET "publicSlug" = 'inv-' || gen_random_uuid()::text WHERE "publicSlug" IS NULL;
UPDATE "estimates" SET "publicSlug" = 'est-' || gen_random_uuid()::text WHERE "publicSlug" IS NULL;
UPDATE "proposals" SET "publicSlug" = 'prop-' || gen_random_uuid()::text WHERE "publicSlug" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "invoices_publicSlug_key" ON "invoices"("publicSlug");

-- CreateIndex
CREATE INDEX "invoices_publicSlug_idx" ON "invoices"("publicSlug");

-- CreateIndex
CREATE UNIQUE INDEX "estimates_publicSlug_key" ON "estimates"("publicSlug");

-- CreateIndex
CREATE INDEX "estimates_publicSlug_idx" ON "estimates"("publicSlug");

-- CreateIndex
CREATE UNIQUE INDEX "proposals_publicSlug_key" ON "proposals"("publicSlug");

-- CreateIndex
CREATE INDEX "proposals_publicSlug_idx" ON "proposals"("publicSlug");
