// app.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppConfigModule } from './config/config.module';
import { AppConfigService } from './config/config.service';
import { EventsModule } from './events/events.module';
import { EmailModule } from './channels/email/email.module';
import { CoreModule } from './core/core.module';
import { TenantsService } from './tenants/tenants.service';
import { TenantsController } from './tenants/tenants.controller';
import { TenantBrandingService } from './tenant-branding/tenant-branding.service';
import { TenantBrandingController } from './tenant-branding/tenant-branding.controller';
import { TenantConfigService } from './tenant-config/tenant-config.service';
import { TenantConfigController } from './tenant-config/tenant-config.controller';
import { TenantEmailProvidersService } from './tenant-email-providers/tenant-email-providers.service';
import { TenantEmailProvidersController } from './tenant-email-providers/tenant-email-providers.controller';
import { UserPreferencesService } from './user-preferences/user-preferences.service';
import { UserPreferencesController } from './user-preferences/user-preferences.controller';

@Module({
  imports: [
    AppConfigModule,
    CoreModule,
    BullModule.forRootAsync({
      imports: [AppConfigModule],
      useFactory: (configService: AppConfigService) => ({
        connection: {
          host: configService.redisHost,
          port: configService.redisPort,
        },
      }),
      inject: [AppConfigService],
    }),
    EventsModule,
    EmailModule,
  ],
  providers: [TenantsService, TenantBrandingService, TenantConfigService, TenantEmailProvidersService, UserPreferencesService],
  controllers: [TenantsController, TenantBrandingController, TenantConfigController, TenantEmailProvidersController, UserPreferencesController]
})
export class AppModule {}