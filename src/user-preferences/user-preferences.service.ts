import { Injectable } from '@nestjs/common';

@Injectable()
export class UserPreferencesService {
    getPreferences(tenantId: string, userId: string) {
        throw new Error('Method not implemented.');
    }
    createOrUpdatePreferences(tenantId: string, preferencesData: { userId: string; email?: boolean; sms?: boolean; push?: boolean; }) {
        throw new Error('Method not implemented.');
    }
}
