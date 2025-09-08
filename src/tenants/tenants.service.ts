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
    
    async createTenant(createTenantDto: { name: string }) {
    return this.prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: createTenantDto.name,
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

}
