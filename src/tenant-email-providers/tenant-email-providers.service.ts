import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantEmailProvidersService {
  constructor(private prisma: PrismaService) {}

  async createEmailProvider(tenantId: string, providerData: any) {
    // Get or create tenant config
    let tenantConfig = await this.prisma.tenantConfig.findUnique({
      where: { tenantId },
      include: { emailProviders: true }
    });

    if (!tenantConfig) {
      await this.prisma.tenantConfig.create({
        data: { tenantId },
      });
      // Fetch again to get the full object with emailProviders
      tenantConfig = await this.prisma.tenantConfig.findUnique({
        where: { tenantId },
        include: { emailProviders: true }
      });
    }

    if (!tenantConfig) {
      throw new NotFoundException(`Tenant config could not be created for tenant: ${tenantId}`);
    }

    // Check if tenant already has an email provider
    if (tenantConfig.emailProviders.length > 0) {
      // Update existing email provider instead of creating a new one
      const existingProvider = tenantConfig.emailProviders[0];
      return this.prisma.tenantEmailProvider.update({
        where: { id: existingProvider.id },
        data: {
          ...providerData,
          isDefault: true // Ensure it remains the default (and only) provider
        }
      });
    }

    // Create new email provider (first one for this tenant)
    return this.prisma.tenantEmailProvider.create({
      data: {
        tenantConfigId: tenantConfig.id,
        ...providerData,
        isDefault: true // First provider is always default
      }
    });
  }

  async getEmailProviders(tenantId: string) {
    const tenantConfig = await this.prisma.tenantConfig.findUnique({
      where: { tenantId },
      include: {
        emailProviders: true
      }
    });

    if (!tenantConfig) {
      throw new NotFoundException(`Tenant config not found for tenant: ${tenantId}`);
    }

    // Return the single email provider (or empty array if none exists)
    return tenantConfig.emailProviders;
  }

  async getDefaultEmailProvider(tenantId: string) {
    const tenantConfig = await this.prisma.tenantConfig.findUnique({
      where: { tenantId },
      include: {
        emailProviders: true
      }
    });

    if (!tenantConfig || tenantConfig.emailProviders.length === 0) {
      console.log(`⚠️ No email provider found for tenant: ${tenantId}, trying fallback tenant: test-tenant-1`);
      
      // Fallback to test-tenant-1 configuration
      const fallbackConfig = await this.prisma.tenantConfig.findUnique({
        where: { tenantId: 'test-tenant-1' },
        include: {
          emailProviders: true
        }
      });

      if (!fallbackConfig || fallbackConfig.emailProviders.length === 0) {
        console.log(`⚠️ No fallback email provider found either, returning null to use system default`);
        return null;
      }

      console.log(`✅ Using fallback email provider from tenant: test-tenant-1 for tenant: ${tenantId}`);
      return fallbackConfig.emailProviders[0];
    }

    // Return the single email provider for this tenant
    return tenantConfig.emailProviders[0];
  }

  async updateEmailProvider(providerId: string, updateData: any) {
    // Since each tenant has only one email provider, we don't need to manage multiple defaults
    return this.prisma.tenantEmailProvider.update({
      where: { id: providerId },
      data: {
        ...updateData,
        isDefault: true // Always keep it as default since it's the only one
      }
    });
  }

  async deleteEmailProvider(providerId: string) {
    return this.prisma.tenantEmailProvider.delete({
      where: { id: providerId }
    });
  }
}