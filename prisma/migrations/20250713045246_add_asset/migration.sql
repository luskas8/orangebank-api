-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'asset_purchase';
ALTER TYPE "TransactionType" ADD VALUE 'asset_sale';

-- CreateTable
CREATE TABLE "assets" (
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "currentPrice" DOUBLE PRECISION NOT NULL,
    "dailyVariation" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("symbol")
);

-- CreateTable
CREATE TABLE "price_history" (
    "id" TEXT NOT NULL,
    "assetSymbol" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "price_history_assetSymbol_createdAt_idx" ON "price_history"("assetSymbol", "createdAt");

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_assetSymbol_fkey" FOREIGN KEY ("assetSymbol") REFERENCES "assets"("symbol") ON DELETE CASCADE ON UPDATE CASCADE;
