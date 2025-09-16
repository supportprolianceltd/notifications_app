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


    // If setting as default, unset any existing default
    if (providerData.isDefault) {
      await this.prisma.tenantEmailProvider.updateMany({
        where: { tenantConfigId: tenantConfig.id, isDefault: true },
        data: { isDefault: false }
      });
    }

    return this.prisma.tenantEmailProvider.create({
      data: {
        tenantConfigId: tenantConfig.id,
        ...providerData
      }
    });
  }

  async getEmailProviders(tenantId: string) {
    const tenantConfig = await this.prisma.tenantConfig.findUnique({
      where: { tenantId },
      include: {
        emailProviders: {
          orderBy: { isDefault: 'desc' }
        }
      }
    });

    if (!tenantConfig) {
      throw new NotFoundException(`Tenant config not found for tenant: ${tenantId}`);
    }

    return tenantConfig.emailProviders;
  }

  async getDefaultEmailProvider(tenantId: string) {
    const tenantConfig = await this.prisma.tenantConfig.findUnique({
      where: { tenantId },
      include: {
        emailProviders: {
          where: { isDefault: true },
          take: 1
        }
      }
    });

    if (!tenantConfig || tenantConfig.emailProviders.length === 0) {
      throw new NotFoundException(`No default email provider found for tenant: ${tenantId}`);
    }

    return tenantConfig.emailProviders[0];
  }

  async updateEmailProvider(providerId: string, updateData: any) {
    // If setting as default, unset any existing default first
    if (updateData.isDefault) {
      const provider = await this.prisma.tenantEmailProvider.findUnique({
        where: { id: providerId }
      });

      if (provider) {
        await this.prisma.tenantEmailProvider.updateMany({
          where: { 
            tenantConfigId: provider.tenantConfigId, 
            isDefault: true,
            id: { not: providerId }
          },
          data: { isDefault: false }
        });
      }
    }

    return this.prisma.tenantEmailProvider.update({
      where: { id: providerId },
      data: updateData
    });
  }

  async deleteEmailProvider(providerId: string) {
    return this.prisma.tenantEmailProvider.delete({
      where: { id: providerId }
    });
  }
}