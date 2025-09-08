// src/test-email-service.ts
import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from './channels/email/email.service';
import { AppConfigService } from './config/config.service';
import { TemplatesService } from './templates/templates.service';
import { NotificationsService } from './notifications/notifications.service';
import { PrismaService } from './prisma/prisma.service';

async function testEmailService() {
  console.log('📧 Testing Email Service Directly...\n');

  const moduleRef = await Test.createTestingModule({
    providers: [
      ConfigService,
      AppConfigService,
      PrismaService,
      TemplatesService,
      NotificationsService,
      EmailService,
    ],
  }).compile();

  const emailService = moduleRef.get<EmailService>(EmailService);
  
  console.log('✅ Email service initialized');
  
  // Test email sending
  try {
    const result = await emailService.sendEmail({
      to: 'tegaokorare91@gmail.com',
      subject: 'Test Email',
      template: 'welcome-email',
      context: {
        user_name: 'Test User',
        company_name: 'Test Company',
      },
      tenantId: 'test-tenant-1',
      userId: 'user-test-001',
      userName: 'Test User',
      eventType: 'test.event',
    });

    console.log('✅ Email service test completed successfully');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('❌ Email service test failed:', error.message);
  }
}

testEmailService();