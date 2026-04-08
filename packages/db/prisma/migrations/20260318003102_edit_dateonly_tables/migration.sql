-- AlterTable
ALTER TABLE "estimates" ALTER COLUMN "timelineEndDate" SET DATA TYPE DATE,
ALTER COLUMN "timelineStartDate" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "expenses" ALTER COLUMN "expenseDate" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "invoices" ALTER COLUMN "issueDate" SET DATA TYPE DATE,
ALTER COLUMN "dueDate" SET DATA TYPE DATE;
