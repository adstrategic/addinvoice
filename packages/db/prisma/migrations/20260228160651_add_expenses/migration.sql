-- CreateTable
CREATE TABLE "merchants" (
    "id" SERIAL NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_categories" (
    "id" SERIAL NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" SERIAL NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "merchantId" INTEGER NOT NULL,
    "workCategoryId" INTEGER,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2),
    "description" TEXT,
    "image" TEXT,
    "sequence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "merchants_workspaceId_idx" ON "merchants"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "merchants_workspaceId_sequence_key" ON "merchants"("workspaceId", "sequence");

-- CreateIndex
CREATE INDEX "work_categories_workspaceId_idx" ON "work_categories"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "work_categories_workspaceId_sequence_key" ON "work_categories"("workspaceId", "sequence");

-- CreateIndex
CREATE INDEX "expenses_workspaceId_idx" ON "expenses"("workspaceId");

-- CreateIndex
CREATE INDEX "expenses_expenseDate_idx" ON "expenses"("expenseDate");

-- CreateIndex
CREATE INDEX "expenses_merchantId_idx" ON "expenses"("merchantId");

-- CreateIndex
CREATE INDEX "expenses_workCategoryId_idx" ON "expenses"("workCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_workspaceId_sequence_key" ON "expenses"("workspaceId", "sequence");

-- AddForeignKey
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_categories" ADD CONSTRAINT "work_categories_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_workCategoryId_fkey" FOREIGN KEY ("workCategoryId") REFERENCES "work_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
