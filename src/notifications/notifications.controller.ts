// src/notifications/notifications.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Query('tenantId') tenantId: string,
    @Query('userId') userId: string
  ) {
    const logs = await this.notificationsService.getNotificationLogsForUser(tenantId, userId);
    return logs.map(log => ({
        id: log.id,
        status: log.status,
        subject: log.subject,
        eventType: log.eventType,
        createdAt: log.createdAt,
        sentAt: log.sentAt,
    }));
  }
}