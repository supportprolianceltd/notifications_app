// src/notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService, private gateway: NotificationsGateway) {}
  

  async createNotificationLog(notificationData: {
    tenantId: string;
    userId?: string;
    userEmail?: string;
    userName?: string;
    channel: string;
    eventType: string;
    status: string;
    subject?: string;
    body?: string;
    providerResponse?: any;
    externalId?: string;
    templateId?: string;
  }) {
    try {
      const record = await this.prisma.notification.create({ data: notificationData });

      // Emit real-time event only for in-app notifications
      try {
        if (record.userId && record.channel === 'in_app') {
          const payload = {
            id: record.id,
            tenantId: record.tenantId,
            userId: record.userId,
            eventType: record.eventType,
            subject: record.subject,
            body: record.body,
            createdAt: record.createdAt,
            isRead: false,
          };
          this.gateway.sendToUser(record.tenantId, record.userId, 'notification.created', payload);
        } else if (record.userId) {
          // Skip emitting non in-app channels (e.g., 'email') to prevent duplicate realtime messages
          // Useful for debugging — keep a debug log in case developers need to trace emits
          // Note: don't throw; this is intentional behaviour
          // console.debug(`Skipping realtime emit for notification ${record.id} with channel=${record.channel}`);
        }
      } catch (emitErr) {
        // Don't fail the DB write if emitting fails
        console.error('Failed to emit notification over gateway:', emitErr?.message || emitErr);
      }

      return record;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle known Prisma errors
        // Foreign key violation
        if (error.code === 'P2003') {
          console.error('❌ Foreign key violation:', error.meta);
          console.error(`❌ Tenant '${notificationData.tenantId}' does not exist in the database`);
          
          // Create a custom error that identifies this as a tenant issue
          const customError = new Error(`Tenant '${notificationData.tenantId}' does not exist`);
          customError.name = 'TenantNotFoundError';
          throw customError;
        }

        // Unique constraint violation
        if (error.code === 'P2002') {
          console.error('❌ Unique constraint violation:', error.meta);
          throw new Error('Duplicate record not allowed');
        }
      }

      // Log and rethrow for unknown errors
      console.error('⚠️ Unexpected Prisma error:', error);
      throw error;
    }
  }

  async markAsRead(id: string, userId: string) {
    const updated = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
    return updated.count > 0;
  }

  async markAllAsRead(tenantId: string, userId: string) {
    const updated = await this.prisma.notification.updateMany({
      where: { tenantId, userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return updated.count;
  }

  async getUnreadCount(tenantId: string, userId: string) {
    const count = await this.prisma.notification.count({ where: { tenantId, userId, isRead: false } });
    return count;
  }

  async getNotificationLogsForUser(tenantId: string, userId: string, channel?: string) {
    const where: any = { tenantId, userId };
    if (channel) where.channel = channel;
    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getNotificationLogsForTenant(tenantId: string, channel?: string) {
    const where: any = { tenantId };
    if (channel) where.channel = channel;
    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateNotificationStatus(id: string, status: string, providerResponse?: any, externalId?: string) {
    return this.prisma.notification.update({
      where: { id },
      data: {
        status,
        providerResponse,
        externalId,
        sentAt: status === 'sent' ? new Date() : undefined,
      },
    });
  }

  async checkUserPreferences(tenantId: string, userId: string, channel: string): Promise<boolean> {
    const preferences = await this.prisma.userPreference.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId,
        },
      },
    });

    if (!preferences) {
      return true; // Default to enabled if no preferences exist
    }

    switch (channel) {
      case 'email':
        return preferences.email;
      case 'sms':
        return preferences.sms;
      case 'push':
        return preferences.push;
      default:
        return true;
    }
  }
}