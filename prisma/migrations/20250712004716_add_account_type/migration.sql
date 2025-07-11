/*
  Warnings:

  - Added the required column `type` to the `accounts` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('current_account', 'investment_account');

-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "type" "AccountType" NOT NULL;
