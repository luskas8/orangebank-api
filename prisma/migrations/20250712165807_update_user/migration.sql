/*
  Warnings:

  - You are about to drop the column `bithDate` on the `users` table. All the data in the column will be lost.
  - Added the required column `birthDate` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "bithDate",
ADD COLUMN     "birthDate" TIMESTAMP(3) NOT NULL;
