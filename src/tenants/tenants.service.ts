import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TenantsService {
    constructor(private prisma: PrismaService) {}
    async getTenant(id: string) {
        return this.prisma.tenant.findUnique({
        where: { id },
        include: {
            brand: true,
            config: {
            include: {
                emailProviders: true,
            },
            },
        },
        });
    }
    
    async createTenant(createTenantDto: { id: string, name: string, externalId: string }) {
    return this.prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          id: createTenantDto.id,
          name: createTenantDto.name,
          externalId: createTenantDto.externalId,
        },
      });
      

      // Create empty config for tenant
      await tx.tenantConfig.create({
        data: {
          tenantId: tenant.id,
        },
      });

      return tenant;
    });
  }

  async findTenantByExternalId(externalId: string) {
      return this.prisma.tenant.findUnique({
        where: { externalId },
      });
  }
  

}
