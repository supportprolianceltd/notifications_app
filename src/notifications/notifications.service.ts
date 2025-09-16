// src/notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}
  

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
    return this.prisma.notification.create({
      data: notificationData,
    });
  }

  async getNotificationLogsForUser(tenantId: string, userId: string) {
    return this.prisma.notification.findMany({
      where: { tenantId, userId },
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