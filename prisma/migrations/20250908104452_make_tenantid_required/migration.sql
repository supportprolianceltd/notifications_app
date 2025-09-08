/*
  Warnings:

  - Made the column `tenantId` on table `templates` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."templates" ALTER COLUMN "tenantId" SET NOT NULL;
