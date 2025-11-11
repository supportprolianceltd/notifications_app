// app.module.ts
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { BullModule } from '@nestjs/bullmq';
import { AppConfigModule } from './config/config.module';
import { AppConfigService } from './config/config.service';
import { EventsModule } from './events/events.module';
import { EmailModule } from './channels/email/email.module';
import { CoreModule } from './core/core.module';
import { TenantsModule } from './tenants/tenants.module';
import { JobsModule } from './jobs/jobs.module';
import { TenantBrandingService } from './tenant-branding/tenant-branding.service';
import { TenantBrandingController } from './tenant-branding/tenant-branding.controller';
import { TenantConfigService } from './tenant-config/tenant-config.service';
import { TenantConfigController } from './tenant-config/tenant-config.controller';
import { TenantEmailProvidersService } from './tenant-email-providers/tenant-email-providers.service';
import { TenantEmailProvidersController } from './tenant-email-providers/tenant-email-providers.controller';
import { UserPreferencesService } from './user-preferences/user-preferences.service';
import { UserPreferencesController } from './user-preferences/user-preferences.controller';
import { NotificationsController } from './notifications/notifications.controller';
import { NotificationsService } from './notifications/notifications.service';
import { TemplatesController } from './templates/templates.controller';
import { TemplatesService } from './templates/templates.service';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [
    // Serve files in ./public at /static
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/static',
    }),
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
  // Notifications (in-app) module
  require('./notifications/notifications.module').NotificationsModule,
    EmailModule,
    MetricsModule,
    TenantsModule,
    JobsModule,
  ],
  providers: [TenantBrandingService, TenantConfigService, TenantEmailProvidersService, UserPreferencesService, TemplatesService],
  controllers: [TenantBrandingController, TenantConfigController, TenantEmailProvidersController, UserPreferencesController, TemplatesController]
})
export class AppModule {}