-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "hasSeenWelcome" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboardingCompletedAt" TIMESTAMP(3);
