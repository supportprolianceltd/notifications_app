/*
  Warnings:

  - You are about to drop the column `emailProvider` on the `tenant_configurations` table. All the data in the column will be lost.
  - You are about to drop the column `fromEmail` on the `tenant_configurations` table. All the data in the column will be lost.
  - You are about to drop the column `fromName` on the `tenant_configurations` table. All the data in the column will be lost.
  - You are about to drop the column `sendgridApiKey` on the `tenant_configurations` table. All the data in the column will be lost.
  - You are about to drop the column `sesAccessKeyId` on the `tenant_configurations` table. All the data in the column will be lost.
  - You are about to drop the column `sesSecretAccessKey` on the `tenant_configurations` table. All the data in the column will be lost.
  - You are about to drop the column `smsProvider` on the `tenant_configurations` table. All the data in the column will be lost.
  - You are about to drop the column `twilioAccountSid` on the `tenant_configurations` table. All the data in the column will be lost.
  - You are about to drop the column `twilioAuthToken` on the `tenant_configurations` table. All the data in the column will be lost.
  - You are about to drop the column `twilioFromNumber` on the `tenant_configurations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."tenant_configurations" DROP COLUMN "emailProvider",
DROP COLUMN "fromEmail",
DROP COLUMN "fromName",
DROP COLUMN "sendgridApiKey",
DROP COLUMN "sesAccessKeyId",
DROP COLUMN "sesSecretAccessKey",
DROP COLUMN "smsProvider",
DROP COLUMN "twilioAccountSid",
DROP COLUMN "twilioAuthToken",
DROP COLUMN "twilioFromNumber";

-- CreateTable
CREATE TABLE "public"."tenant_email_providers" (
    "id" TEXT NOT NULL,
    "tenantConfigId" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "secure" BOOLEAN NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fromEmail" TEXT,
    "fromName" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_email_providers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."tenant_email_providers" ADD CONSTRAINT "tenant_email_providers_tenantConfigId_fkey" FOREIGN KEY ("tenantConfigId") REFERENCES "public"."tenant_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
