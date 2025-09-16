/*
  Warnings:

  - A unique constraint covering the columns `[externalId]` on the table `tenants` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."tenants" ADD COLUMN     "externalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "tenants_externalId_key" ON "public"."tenants"("externalId");
