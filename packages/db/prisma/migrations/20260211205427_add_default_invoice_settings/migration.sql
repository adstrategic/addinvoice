-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "defaultNotes" TEXT,
ADD COLUMN     "defaultTaxMode" TEXT,
ADD COLUMN     "defaultTaxName" TEXT,
ADD COLUMN     "defaultTaxPercentage" DECIMAL(65,30),
ADD COLUMN     "defaultTerms" TEXT;

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "transactionId" DROP NOT NULL;
