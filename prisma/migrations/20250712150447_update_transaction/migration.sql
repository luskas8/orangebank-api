/*
  Warnings:

  - The values [transfer,deposit,withdrawal,sell_investment,buy_investment,fee] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TransactionType_new" AS ENUM ('internal', 'external');
ALTER TABLE "transactions" ALTER COLUMN "type" TYPE "TransactionType_new" USING ("type"::text::"TransactionType_new");
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "TransactionType_old";
COMMIT;

-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "pendingTransaction" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "active" SET DEFAULT true,
ALTER COLUMN "balance" SET DEFAULT 0;
