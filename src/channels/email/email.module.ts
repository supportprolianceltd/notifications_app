import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq'; // Import BullModule
import { EmailService } from './email.service';
import { EmailProcessor } from './email.processor';
import { TemplatesService } from 'src/templates/templates.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { PrismaService } from 'nestjs-prisma';
import { TenantEmailProvidersService } from 'src/tenant-email-providers/tenant-email-providers.service';


@Module({
  imports: [
    // Register the 'email' queue
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
  providers: [EmailService, EmailProcessor, TemplatesService, NotificationsService,  TenantEmailProvidersService, PrismaService],
  exports: [BullModule],
})
export class EmailModule {}