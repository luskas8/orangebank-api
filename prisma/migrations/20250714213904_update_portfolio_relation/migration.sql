/*
  Warnings:

  - A unique constraint covering the columns `[portfolioId]` on the table `accounts` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "portfolioId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "accounts_portfolioId_key" ON "accounts"("portfolioId");