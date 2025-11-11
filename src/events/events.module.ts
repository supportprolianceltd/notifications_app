import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq'; // Import BullModule
import { EventsService } from './events.service';
import { EventsProcessor } from './events.processor';
import { EmailModule } from 'src/channels/email/email.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { EventsController } from './events.controller';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [
    // Register the 'events' queue
    BullModule.registerQueue({
      name: 'events',
    }),
    EmailModule,
  NotificationsModule,
    TenantsModule
  ],
  providers: [EventsService, EventsProcessor],
  exports: [BullModule],
  controllers: [EventsController],
})
export class EventsModule {}