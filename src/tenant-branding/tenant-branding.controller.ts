import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TenantBrandingService } from './tenant-branding.service';

@Controller('tenants/:tenantId/branding')
export class TenantBrandingController {
    constructor(private readonly tenantBrandingService: TenantBrandingService) {}

    @Post()
    async createOrUpdateBranding(
        @Param('tenantId') tenantId: string,
        @Body() brandingData: any
    ) {
        return this.tenantBrandingService.createOrUpdateBranding(tenantId, brandingData);
    }

    @Get()
    async getBranding(@Param('tenantId') tenantId: string) {
        return this.tenantBrandingService.getBranding(tenantId);
    }
}
