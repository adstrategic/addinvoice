-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN     "onboardingAnswers" JSONB,
ADD COLUMN     "onboardingCompletedAt" TIMESTAMP(3);
