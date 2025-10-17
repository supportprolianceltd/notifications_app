import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { TenantEmailProvidersService } from './tenant-email-providers.service';

@Controller('tenants/:tenantId/email-providers')
export class TenantEmailProvidersController {
    constructor(
    private readonly emailProvidersService: TenantEmailProvidersService,
  ) {}
    @Post()
    async createOrUpdateEmailProvider(
        @Param('tenantId') tenantId: string,
        @Body() providerData: any
    ) {
        return this.emailProvidersService.createEmailProvider(tenantId, providerData);
    }

    @Get()
    async getEmailProvider(@Param('tenantId') tenantId: string) {
        const providers = await this.emailProvidersService.getEmailProviders(tenantId);
        // Return the single provider or null if none exists
        return providers.length > 0 ? providers[0] : null;
    }

    @Get('default')
    async getDefaultEmailProvider(@Param('tenantId') tenantId: string) {
        return this.emailProvidersService.getDefaultEmailProvider(tenantId);
    }

    @Patch(':providerId')
    async updateEmailProvider(
        @Param('providerId') providerId: string,
        @Body() updateData: any
    ) {
        return this.emailProvidersService.updateEmailProvider(providerId, updateData);
    }

    @Delete(':providerId')
    async deleteEmailProvider(
        @Param('providerId') providerId: string
    ) {
        return this.emailProvidersService.deleteEmailProvider(providerId);
    }
}
