-- CreateEnum
CREATE TYPE "TransactionCategory" AS ENUM ('deposit', 'withdrawal', 'transfer', 'investment');

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "category" "TransactionCategory" NOT NULL DEFAULT 'transfer';
