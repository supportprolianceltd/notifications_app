import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TenantsService } from './tenants.service';

@Controller('tenants')
export class TenantsController {
    constructor(private readonly tenantsService: TenantsService) {}

    @Post()
    async createTenant(@Body() createTenantDto: { name: string, externalId: string }) {
        return this.tenantsService.createTenant(createTenantDto);
    }

    @Get(':id')
    async getTenant(@Param('id') id: string) {
        return this.tenantsService.getTenant(id);
    }
}
