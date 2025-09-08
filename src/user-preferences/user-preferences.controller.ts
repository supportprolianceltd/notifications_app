import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UserPreferencesService } from './user-preferences.service';

@Controller('user-preferences')
export class UserPreferencesController {
    constructor(private readonly userPreferencesService: UserPreferencesService) {}

    @Post()
    async createOrUpdatePreferences(
        @Param('tenantId') tenantId: string,
        @Body() preferencesData: { userId: string; email?: boolean; sms?: boolean; push?: boolean }
    ) {
        return this.userPreferencesService.createOrUpdatePreferences(tenantId, preferencesData);
    }

    @Get(':userId')
    async getPreferences(
        @Param('tenantId') tenantId: string,
        @Param('userId') userId: string
    ) {
        return this.userPreferencesService.getPreferences(tenantId, userId);
    }
}
