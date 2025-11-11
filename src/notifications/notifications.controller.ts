// src/notifications/notifications.controller.ts
import { Controller, Get, Param, Query, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Query('tenantId') tenantId: string,
    @Query('userId') userId: string
  ) {
    // Default to returning only in-app notifications unless a channel is explicitly requested
    const channel = 'in_app';
    const logs = await this.notificationsService.getNotificationLogsForUser(tenantId, userId, channel);
    return logs.map(log => ({
      id: log.id,
      status: log.status,
      subject: log.subject,
      eventType: log.eventType,
      createdAt: log.createdAt,
      sentAt: log.sentAt,
      isRead: log.isRead,
      readAt: log.readAt,
      body: log.body,
    }));
  }

  @Get('tenant/:tenantId')
  async getAllNotificationsForTenant(@Param('tenantId') tenantId: string) {
    const channel = 'in_app';
    const logs = await this.notificationsService.getNotificationLogsForTenant(tenantId, channel);
    return logs.map(log => ({
      id: log.id,
      status: log.status,
      subject: log.subject,
      eventType: log.eventType,
      userId: log.userId,
      userName: log.userName,
      createdAt: log.createdAt,
      sentAt: log.sentAt,
      isRead: log.isRead,
      readAt: log.readAt,
    }));
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string, @Body('userId') userId: string) {
    const ok = await this.notificationsService.markAsRead(id, userId);
    return { success: ok };
  }

  @Post('mark-all-read')
  async markAllRead(@Body('tenantId') tenantId: string, @Body('userId') userId: string) {
    const count = await this.notificationsService.markAllAsRead(tenantId, userId);
    return { success: true, updated: count };
  }

  @Get('unread-count')
  async unreadCount(@Query('tenantId') tenantId: string, @Query('userId') userId: string) {
    const count = await this.notificationsService.getUnreadCount(tenantId, userId);
    return { unread: count };
  }
}