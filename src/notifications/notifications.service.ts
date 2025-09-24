// src/notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

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
    try {
      return await this.prisma.notification.create({
        data: notificationData,
      });
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