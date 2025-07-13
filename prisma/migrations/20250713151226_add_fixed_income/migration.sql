-- CreateEnum
CREATE TYPE "FixedIncomeType" AS ENUM ('cdb', 'tesouro_direto');

-- CreateEnum
CREATE TYPE "FixedIncomeRateType" AS ENUM ('pre', 'pos');

-- CreateTable
CREATE TABLE "fixed_incomes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "rateType" TEXT NOT NULL,
    "maturity" TIMESTAMP(3) NOT NULL,
    "minimumInvestment" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixed_incomes_pkey" PRIMARY KEY ("id")
);
