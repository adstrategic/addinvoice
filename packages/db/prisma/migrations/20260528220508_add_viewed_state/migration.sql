-- AlterEnum
ALTER TYPE "AdvanceStatus" ADD VALUE 'VIEWED';

-- AlterEnum
ALTER TYPE "ProposalStatus" ADD VALUE 'VIEWED';

-- AlterTable
ALTER TABLE "advances" ADD COLUMN     "viewedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "estimates" ADD COLUMN     "viewedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "proposals" ADD COLUMN     "viewedAt" TIMESTAMP(3);
