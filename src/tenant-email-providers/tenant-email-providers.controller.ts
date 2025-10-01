import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { TenantEmailProvidersService } from './tenant-email-providers.service';

@Controller('tenants/:tenantId/email-providers')
export class TenantEmailProvidersController {
    constructor(
    private readonly emailProvidersService: TenantEmailProvidersService,
  ) {}
    @Post()
    async createEmailProvider(
        @Param('tenantId') tenantId: string,
        @Body() providerData: any
    ) {
        return this.emailProvidersService.createEmailProvider(tenantId, providerData);
    }

    @Get()
    async getEmailProviders(@Param('tenantId') tenantId: string) {
        return this.emailProvidersService.getEmailProviders(tenantId);
    }

    @Get('default')
    async getDefaultEmailProvider(@Param('tenantId') tenantId: string) {
        return this.emailProvidersService.getDefaultEmailProvider(tenantId);
    }

    @Put(':providerId')
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
