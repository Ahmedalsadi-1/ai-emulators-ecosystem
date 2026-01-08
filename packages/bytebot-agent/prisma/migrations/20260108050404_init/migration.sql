/*
  Warnings:

  - You are about to drop the column `modelData` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `modelId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the `Model` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `model` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Task" DROP COLUMN "modelData",
DROP COLUMN "modelId",
ADD COLUMN     "model" JSONB NOT NULL;

-- DropTable
DROP TABLE "public"."Model";
