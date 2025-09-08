// src/test-all-templates.ts
import { PrismaClient } from '@prisma/client';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { AppConfigService } from './config/config.service';

async function testAllTemplates() {
  console.log('🚀 Creating ALL Missing Templates and Testing Events...\n');
  
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✅ Connected to database successfully');

    // Load configuration for Redis
    const configModule = await ConfigModule.forRoot();
    const configService = new ConfigService();
    const appConfigService = new AppConfigService(configService);

    const redisConfig = {
      host: appConfigService.redisHost,
      port: appConfigService.redisPort,
    };

    // Create all missing templates
    console.log('\n📝 Creating all missing templates...');
    
    const allTemplates = [
      // Authentication Templates
      {
        id: 'template-user-email-verified',
        name: 'user-email-verified',
        type: 'email',
        subject: 'Email Verified Successfully!',
        body: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }</style>
</head>
<body>
    <h2>Hello {{user_name}}!</h2>
    <p>Your email address <strong>{{user_email}}</strong> has been successfully verified!</p>
    <p>You can now access all features of your account.</p>
    <p>If you did not request this verification, please contact support immediately.</p>
    <br>
    <p>Best regards,<br>The {{company_name}} Team</p>
</body>
</html>`,
        language: 'en',
        isActive: true,
        tenantId: 'test-tenant-1',
      },
      {
        id: 'template-login-succeeded',
        name: 'login-succeeded',
        type: 'email',
        subject: 'Successful Login Notification',
        body: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }</style>
</head>
<body>
    <h2>Hello {{user_name}}!</h2>
    <p>Your account was successfully accessed:</p>
    <ul>
        <li><strong>Time:</strong> {{timestamp}}</li>
        <li><strong>IP Address:</strong> {{ip_address}}</li>
        <li><strong>Device:</strong> {{user_agent}}</li>
    </ul>
    <p>If this was not you, please secure your account immediately.</p>
    <br>
    <p>Best regards,<br>The {{company_name}} Team</p>
</body>
</html>`,
        language: 'en',
        isActive: true,
        tenantId: 'test-tenant-1',
      },
      {
        id: 'template-login-failed',
        name: 'login-failed',
        type: 'email',
        subject: 'Failed Login Attempt',
        body: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }</style>
</head>
<body>
    <h2>Login Attempt Failed</h2>
    <p>There was a failed login attempt to your account:</p>
    <ul>
        <li><strong>Time:</strong> {{timestamp}}</li>
        <li><strong>IP Address:</strong> {{ip_address}}</li>
        <li><strong>Reason:</strong> {{reason}}</li>
    </ul>
    <p>If this was not you, no action is needed.</p>
    <br>
    <p>Best regards,<br>The {{company_name}} Team</p>
</body>
</html>`,
        language: 'en',
        isActive: true,
        tenantId: 'test-tenant-1',
      },
      {
        id: 'template-account-locked',
        name: 'account-locked',
        type: 'email',
        subject: 'Account Temporarily Locked',
        body: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }</style>
</head>
<body>
    <h2>Account Security Notice</h2>
    <p>Your account has been temporarily locked due to: <strong>{{reason}}</strong></p>
    <p>This is a security measure to protect your account from unauthorized access.</p>
    <p>Your account will be automatically unlocked in 30 minutes, or you can contact support for immediate assistance.</p>
    <br>
    <p>Best regards,<br>The {{company_name}} Security Team</p>
</body>
</html>`,
        language: 'en',
        isActive: true,
        tenantId: 'test-tenant-1',
      },
      {
        id: 'template-suspicious-login',
        name: 'suspicious-login',
        type: 'email',
        subject: 'Suspicious Login Attempt Detected',
        body: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }</style>
</head>
<body>
    <h2>Suspicious Activity Detected</h2>
    <p>A login attempt from an unrecognized device/location:</p>
    <ul>
        <li><strong>Location:</strong> {{location}}</li>
        <li><strong>IP Address:</strong> {{ip_address}}</li>
        <li><strong>Device:</strong> {{device_type}}</li>
    </ul>
    <p>If this was you, <a href="{{approve_link}}">approve this login</a></p>
    <p>If this was NOT you, <a href="{{deny_link}}">deny and secure your account</a></p>
    <br>
    <p>Best regards,<br>The {{company_name}} Security Team</p>
</body>
</html>`,
        language: 'en',
        isActive: true,
        tenantId: 'test-tenant-1',
      },

      // Application Workflow Templates
      {
        id: 'template-task-assigned',
        name: 'task-assigned',
        type: 'email',
        subject: 'New Task Assigned: {{task_name}}',
        body: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }</style>
</head>
<body>
    <h2>Hello {{user_name}}!</h2>
    <p>You have been assigned a new task:</p>
    <h3>{{task_name}}</h3>
    <p><strong>Assigned by:</strong> {{assigner_name}}</p>
    <p><strong>Due date:</strong> {{due_date}}</p>
    <p>Please review the task and update your progress regularly.</p>
    <br>
    <p>Best regards,<br>The {{company_name}} Team</p>
</body>
</html>`,
        language: 'en',
        isActive: true,
        tenantId: 'test-tenant-1',
      },
      {
        id: 'template-comment-mentioned',
        name: 'comment-mentioned',
        type: 'email',
        subject: 'You were mentioned in a comment',
        body: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }</style>
</head>
<body>
    <h2>Hello {{user_name}}!</h2>
    <p><strong>{{author_name}}</strong> mentioned you in a comment:</p>
    <blockquote style="background: #f9f9f9; padding: 15px; border-left: 4px solid #ccc;">
        "{{comment_preview}}"
    </blockquote>
    <p><a href="{{context_url}}">View the conversation</a></p>
    <br>
    <p>Best regards,<br>The {{company_name}} Team</p>
</body>
</html>`,
        language: 'en',
        isActive: true,
        tenantId: 'test-tenant-1',
      },
      {
        id: 'template-content-liked',
        name: 'content-liked',
        type: 'email',
        subject: '{{liker_name}} liked your content!',
        body: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }</style>
</head>
<body>
    <h2>Hello {{user_name}}!</h2>
    <p><strong>{{liker_name}}</strong> liked your content: <strong>{{content_title}}</strong></p>
    <p><a href="{{content_url}}">View your content</a></p>
    <br>
    <p>Best regards,<br>The {{company_name}} Team</p>
</body>
</html>`,
        language: 'en',
        isActive: true,
        tenantId: 'test-tenant-1',
      },
      {
        id: 'template-approval-requested',
        name: 'approval-requested',
        type: 'email',
        subject: 'Approval Required: {{item_name}}',
        body: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }</style>
</head>
<body>
    <h2>Hello {{user_name}}!</h2>
    <p><strong>{{requester_name}}</strong> is requesting your approval for:</p>
    <h3>{{item_name}}</h3>
    <p><strong>Due by:</strong> {{due_date}}</p>
    <p><a href="{{item_url}}">Review and take action</a></p>
    <br>
    <p>Best regards,<br>The {{company_name}} Team</p>
</body>
</html>`,
        language: 'en',
        isActive: true,
        tenantId: 'test-tenant-1',
      },
      {
        id: 'template-status-changed',
        name: 'status-changed',
        type: 'email',
        subject: 'Status Updated: {{item_name}} is now {{status}}',
        body: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }</style>
</head>
<body>
    <h2>Hello {{user_name}}!</h2>
    <p>The status of <strong>{{item_name}}</strong> has been changed to: <strong>{{status}}</strong></p>
    <p><a href="{{item_url}}">View details</a></p>
    <br>
    <p>Best regards,<br>The {{company_name}} Team</p>
</body>
</html>`,
        language: 'en',
        isActive: true,
        tenantId: 'test-tenant-1',
      },
      {
        id: 'template-deadline-approaching',
        name: 'deadline-approaching',
        type: 'email',
        subject: 'Deadline Approaching: {{task_name}}',
        body: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }</style>
</head>
<body>
    <h2>Hello {{user_name}}!</h2>
    <p>This is a reminder that the deadline for <strong>{{task_name}}</strong> is approaching:</p>
    <p><strong>Due date:</strong> {{due_date}}</p>
    <p><a href="{{task_url}}">View task and update progress</a></p>
    <br>
    <p>Best regards,<br>The {{company_name}} Team</p>
</body>
</html>`,
        language: 'en',
        isActive: true,
        tenantId: 'test-tenant-1',
      },
      {
        id: 'template-access-granted',
        name: 'access-granted',
        type: 'email',
        subject: 'Access Granted: {{resource_name}}',
        body: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }</style>
</head>
<body>
    <h2>Hello {{user_name}}!</h2>
    <p>You have been granted access to: <strong>{{resource_name}}</strong></p>
    <p><strong>Granted by:</strong> {{granted_by}}</p>
    <p><a href="{{resource_url}}">Access the resource</a></p>
    <br>
    <p>Best regards,<br>The {{company_name}} Team</p>
</body>
</html>`,
        language: 'en',
        isActive: true,
        tenantId: 'test-tenant-1',
      },

      // 2FA Security Templates
      {
        id: 'template-2fa-code-requested',
        name: '2fa-code-requested',
        type: 'email',
        subject: 'Your Verification Code: {{code}}',
        body: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }</style>
</head>
<body>
    <h2>Verification Code</h2>
    <p>Your verification code is: <strong style="font-size: 24px; letter-spacing: 3px;">{{code}}</strong></p>
    <p>This code will expire in {{expires_in_seconds}} seconds.</p>
    <p><strong>Login attempt details:</strong></p>
    <ul>
        <li>IP Address: {{ip_address}}</li>
        <li>Device: {{user_agent}}</li>
    </ul>
    <p>If you did not request this code, please secure your account immediately.</p>
    <br>
    <p>Best regards,<br>The {{company_name}} Security Team</p>
</body>
</html>`,
        language: 'en',
        isActive: true,
        tenantId: 'test-tenant-1',
      },
      {
        id: 'template-2fa-attempt-failed',
        name: '2fa-attempt-failed',
        type: 'email',
        subject: 'Failed Verification Attempt',
        body: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }</style>
</head>
<body>
    <h2>Security Notice</h2>
    <p>There was a failed verification attempt on your account:</p>
    <ul>
        <li><strong>Time:</strong> {{timestamp}}</li>
        <li><strong>IP Address:</strong> {{ip_address}}</li>
    </ul>
    <p>If this was not you, no action is needed.</p>
    <br>
    <p>Best regards,<br>The {{company_name}} Security Team</p>
</body>
</html>`,
        language: 'en',
        isActive: true,
        tenantId: 'test-tenant-1',
      },
      {
        id: 'template-2fa-method-changed',
        name: '2fa-method-changed',
        type: 'email',
        subject: 'Two-Factor Authentication Method Changed',
        body: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }</style>
</head>
<body>
    <h2>Security Settings Updated</h2>
    <p>Your two-factor authentication method has been changed to: <strong>{{new_method}}</strong></p>
    <p><strong>Changed by:</strong> {{changed_by_admin ? 'Administrator' : 'You'}}</p>
    <p><strong>Time:</strong> {{timestamp}}</p>
    <p>If you did not make this change, please contact support immediately.</p>
    <br>
    <p>Best regards,<br>The {{company_name}} Security Team</p>
</body>
</html>`,
        language: 'en',
        isActive: true,
        tenantId: 'test-tenant-1',
      },
      {
        id: 'template-2fa-backup-code-used',
        name: '2fa-backup-code-used',
        type: 'email',
        subject: 'Backup Code Used for Account Access',
        body: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }</style>
</head>
<body>
    <h2>Backup Code Used</h2>
    <p>A backup code was used to access your account:</p>
    <ul>
        <li><strong>Time:</strong> {{timestamp}}</li>
        <li><strong>IP Address:</strong> {{ip_address}}</li>
    </ul>
    <p><strong>Remaining backup codes:</strong> {{remaining_backup_codes}}</p>
    <p>If this was not you, please secure your account immediately.</p>
    <br>
    <p>Best regards,<br>The {{company_name}} Security Team</p>
</body>
</html>`,
        language: 'en',
        isActive: true,
        tenantId: 'test-tenant-1',
      },
    ];

    // Create all templates
    for (const templateData of allTemplates) {
      const template = await prisma.template.upsert({
        where: { id: templateData.id },
        update: {},
        create: templateData,
      });
      console.log(`   ✅ Created template: ${template.name}`);
    }

    console.log(`\n🎉 Created ${allTemplates.length} templates successfully!`);

    // Test the events queue
    console.log('\n📨 Testing events queue...');
    const eventsQueue = new Queue('events', { connection: redisConfig });
    await eventsQueue.waitUntilReady();

    // Test events for each template
    const testEvents = [
      {
        event_type: 'user.email.verified',
        data: { user_id: 'user-test-001', user_email: 'tegaokorare91@gmail.com', user_name: 'Test User' }
      },
      {
        event_type: 'user.login.succeeded', 
        data: { user_id: 'user-test-001', user_email: 'tegaokorare91@gmail.com', ip_address: '192.168.1.1', user_agent: 'Chrome', timestamp: new Date().toISOString() }
      },
      {
        event_type: 'auth.2fa.code.requested',
        data: { user_id: 'user-test-001', user_email: 'tegaokorare91@gmail.com', '2fa_code': '123456', '2fa_method': 'email', ip_address: '192.168.1.1', user_agent: 'Chrome', expires_in_seconds: 300 }
      }
    ];

    for (const testEvent of testEvents) {
      const job = await eventsQueue.add(testEvent.event_type, {
        metadata: {
          event_id: 'test-' + Date.now(),
          event_type: testEvent.event_type,
          created_at: new Date().toISOString(),
          source: 'test-script',
          tenant_id: 'test-tenant-1',
        },
        data: testEvent.data,
      });
      console.log(`   ✅ Added test event: ${testEvent.event_type} (Job ID: ${job.id})`);
    }

    console.log('\n👀 Now check your NestJS application logs to see if all templates work!');
    console.log('⏳ Waiting 5 seconds for processing...');

    await new Promise(resolve => setTimeout(resolve, 5000));
    await eventsQueue.close();

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('\n✅ Database connection closed');
    console.log('\n🎉 All templates created! Your notification service is now fully equipped!');
  }
}

testAllTemplates();