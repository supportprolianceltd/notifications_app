// src/templates/templates.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  async findTemplate(tenantId: string, name: string, type: string = 'email') {
    // First try to find template for the specific tenant
    const tenantTemplate = await this.prisma.template.findFirst({
      where: {
        tenantId,
        name,
        type,
        isActive: true,
      },
    });

    if (tenantTemplate) {
      return tenantTemplate;
    }

    // If not found, try global templates (tenantId === 'global')
    const globalTemplate = await this.prisma.template.findFirst({
      where: {
        tenantId: 'global', // Global templates
        name,
        type,
        isActive: true,
      },
    });

    if (!globalTemplate) {
      throw new NotFoundException(`Template not found: ${name}`);
    }

    return globalTemplate;
  }

  async getTenantBranding(tenantId: string) {
    console.log('TENANT ID IN GET BRANDING:', tenantId); // ← Debug
    try {
      const branding = await this.prisma.tenantBrand.findUnique({
        where: { tenantId },
      });
      
      if (!branding) {
        return {
          companyName: 'Default Company',
          logoUrl: null,
          primaryColor: '#000000',
          supportEmail: 'notification@temp.artstraining.co.uk',
        };
      }
      
      return branding ?? {
          companyName: 'Default Company',
          logoUrl: null,
          primaryColor: '#000000',
          supportEmail: 'notification@temp.artstraining.co.uk',
        };
    } catch (error) {
      throw new Error(`Failed to get tenant branding: ${error.message}`);
    }
  }
  async createTemplate(dto: {
    name: string;
    type: string;
    subject: string;
    body: string;
    language: string;
    isActive: boolean;
    tenantId: string;
  }) {
    return this.prisma.template.create({ data: dto });
  }

  async getTemplatesForTenant(tenantId: string) {
    return this.prisma.template.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
