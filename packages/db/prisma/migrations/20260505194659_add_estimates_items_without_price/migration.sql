-- CreateTable
CREATE TABLE "estimate_descriptive_items" (
    "id" SERIAL NOT NULL,
    "estimateId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estimate_descriptive_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "estimate_descriptive_items_estimateId_idx" ON "estimate_descriptive_items"("estimateId");

-- CreateIndex
CREATE INDEX "estimate_descriptive_items_estimateId_sortOrder_idx" ON "estimate_descriptive_items"("estimateId", "sortOrder");

-- AddForeignKey
ALTER TABLE "estimate_descriptive_items" ADD CONSTRAINT "estimate_descriptive_items_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
