/*
  Warnings:

  - Made the column `eventNumber` on table `Event` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "activatedAt" TIMESTAMP(3),
ADD COLUMN     "paymentAmount" DECIMAL(65,30),
ADD COLUMN     "paymentMethod" TEXT,
ALTER COLUMN "eventNumber" SET NOT NULL;
