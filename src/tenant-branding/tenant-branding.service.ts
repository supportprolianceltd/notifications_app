import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class TenantBrandingService {
    constructor(private prisma: PrismaService) {}
    async createOrUpdateBranding(tenantId: string, brandingData: any) {
        return this.prisma.tenantBrand.upsert({
        where: { tenantId },
        update: brandingData,
        create: {
            tenantId,
            ...brandingData,
        },
        });
    }

    async getBranding(tenantId: string) {
        return this.prisma.tenantBrand.findUnique({
        where: { tenantId },
        });
    }
    
}
