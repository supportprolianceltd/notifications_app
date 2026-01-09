// src/test-all-templates.ts
// 🚨 DEVELOPMENT MODE: This script will UPDATE existing tenant templates
// 🚨 For PRODUCTION: Change upsert update to {} and remove tenant template updates

import { PrismaClient } from '@prisma/client';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { AppConfigService } from './config/config.service';

async function testAllTemplates() {
  console.log('🚀 Creating ALL Missing Templates and Testing Events...\n');
  console.log('🚨 DEVELOPMENT MODE: Will update existing tenant templates\n');
  
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✅ Connected to database successfully');

    // Load configuration for Redis
    const configModule = await ConfigModule.forRoot();
    const configService = new ConfigService();
    const appConfigService = new AppConfigService(configService);

    const redisConfig = {
      url: appConfigService.redisUrl,
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
        tenantId: 'global',
      },
      {
        id: 'template-user-account-created',
        name: 'user-account-created',
        type: 'email',
        subject: 'Your Account Has Been Created!',
        body: `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .container { background: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.07); }
          h2 { color: #007bff; }
          .info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .btn { background: #007bff; color: #fff; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block; margin-top: 15px; }
          .footer { color: #888; font-size: 13px; margin-top: 30px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Welcome to {{company_name}}!</h2>
          <p>Your account has been created by an administrator. You can now log in and start using our platform.</p>
          <div class="info">
            {{#if login_email}}
            <p><strong>Email:</strong> {{login_email}}</p>
            {{/if}}
            {{#if username}}
            <p><strong>Username:</strong> {{username}}</p>
            {{/if}}
            {{#if temp_password}}
            <p><strong>Temporary Password:</strong> {{temp_password}}</p>
            {{/if}}
            <p><strong>Login Link:</strong> <a href="{{login_link}}" class="btn">Log In</a></p>
          </div>
          <p>If you have any questions or need help, please contact support.</p>
          <div class="footer">
            &copy; {{company_name}} {{year}}
          </div>
        </div>
      </body>
      </html>`,
        language: 'en',
        isActive: true,
        tenantId: 'global',
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6fb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); overflow: hidden; }
    .header { background: {{primary_color}}; color: #fff; padding: 32px 24px 20px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 2rem; letter-spacing: 1px; }
    .content { padding: 32px 24px 24px 24px; }
    .details { background: #f7f9fc; border-radius: 8px; padding: 18px 20px; margin: 24px 0; }
    .details li { margin-bottom: 8px; }
    .footer { background: #f4f6fb; color: #888; text-align: center; font-size: 13px; padding: 18px 24px; border-top: 1px solid #eaeaea; }
    @media (max-width: 600px) {
      .container, .content, .header, .footer { padding-left: 10px; padding-right: 10px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Login Successful</h1>
    </div>
    <div class="content">
      <p style="font-size: 1.1rem;">Hello <strong>{{user_name}}</strong>,</p>
      <p>Your account was just accessed. Here are the details:</p>
      <ul class="details">
        <li><strong>Time:</strong> {{timestamp}}</li>
        <li><strong>IP Address:</strong> {{ip_address}}</li>
        <li><strong>Device:</strong> {{user_agent}}</li>
      </ul>
      <p style="color: #d9534f; margin-top: 18px;">If this wasn't you, please <a href="{{security_link}}" style="color: #d9534f; text-decoration: underline;">secure your account</a> immediately.</p>
      <p style="margin-top: 32px;">Best regards,<br><strong>The {{company_name}} Team</strong></p>
    </div>
    <div class="footer">
      &copy; {{current_year}} {{company_name}}. All rights reserved.
    </div>
  </div>
</body>
</html>`,
        language: 'en',
        isActive: true,
        tenantId: 'global',
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
        tenantId: 'global',
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
        tenantId: 'global',
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
        tenantId: 'global',
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
        tenantId: 'global',
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
        tenantId: 'global',
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
        tenantId: 'global',
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
        tenantId: 'global',
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
        tenantId: 'global',
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
        tenantId: 'global',
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
        tenantId: 'global',
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6fb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); overflow: hidden; }
    .header { background: {{primary_color}}; color: #fff; padding: 32px 24px 20px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 2rem; letter-spacing: 1px; }
    .content { padding: 32px 24px 24px 24px; }
    .code-box { background: #f7f9fc; border-radius: 8px; padding: 18px 0; margin: 24px 0; text-align: center; }
    .code { font-size: 2.2rem; letter-spacing: 6px; color: #2d7ff9; font-weight: bold; }
    .details { background: #f7f9fc; border-radius: 8px; padding: 14px 20px; margin: 18px 0; }
    .details li { margin-bottom: 8px; }
    .footer { background: #f4f6fb; color: #888; text-align: center; font-size: 13px; padding: 18px 24px; border-top: 1px solid #eaeaea; }
    @media (max-width: 600px) {
      .container, .content, .header, .footer { padding-left: 10px; padding-right: 10px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Verification Code</h1>
    </div>
    <div class="content">
      <p style="font-size: 1.1rem;">Hello,</p>
      <p>Your verification code is:</p>
      <div class="code-box">
        <span class="code">{{code}}</span>
      </div>
      <p>This code will expire in <strong>{{expires_in_seconds}}</strong> seconds.</p>
      <ul class="details">
        <li><strong>IP Address:</strong> {{ip_address}}</li>
        <li><strong>Device:</strong> {{user_agent}}</li>
      </ul>
      <p style="color: #d9534f; margin-top: 18px;">If you did not request this code, please <a href="{{security_link}}" style="color: #d9534f; text-decoration: underline;">secure your account</a> immediately.</p>
      <p style="margin-top: 32px;">Best regards,<br><strong>The {{company_name}} Security Team</strong></p>
    </div>
    <div class="footer">
      &copy; {{current_year}} {{company_name}}. All rights reserved.
    </div>
  </div>
</body>
</html>`,
        language: 'en',
        isActive: true,
        tenantId: 'global',
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
        tenantId: 'global',
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
        tenantId: 'global',
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
        tenantId: 'global',
      },

      // Candidate Shortlisted Template
      {
        id: 'template-candidate-shortlisted',
        name: 'candidate-shortlisted',
        type: 'email',
        subject: 'Congratulations! You have been shortlisted - {{full_name}}',
        body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Congratulations! You've Been Shortlisted</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8f9fa;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #28a745;
    }
    .success-icon {
      font-size: 48px;
      color: #28a745;
      margin-bottom: 10px;
    }
    h1 {
      color: #28a745;
      margin: 0;
      font-size: 28px;
    }
    .details-box {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #28a745;
    }
    .detail-row {
      margin: 10px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
    }
    .detail-label {
      font-weight: 600;
      color: #495057;
      min-width: 140px;
    }
    .detail-value {
      color: #212529;
      flex: 1;
      margin-left: 10px;
    }
    .score-highlight {
      background: #28a745;
      color: white;
      padding: 5px 15px;
      border-radius: 20px;
      font-weight: bold;
      display: inline-block;
    }
    .next-steps {
      background: #e7f3ff;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #007bff;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #dee2e6;
      color: #6c757d;
      font-size: 14px;
    }
    @media (max-width: 600px) {
      body { padding: 10px; }
      .container { padding: 20px; }
      h1 { font-size: 24px; }
      .detail-row { flex-direction: column; align-items: flex-start; }
      .detail-label { min-width: auto; margin-bottom: 5px; }
      .detail-value { margin-left: 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="success-icon">🎉</div>
      <h1>Congratulations!</h1>
      <p style="margin: 10px 0 0 0; color: #6c757d; font-size: 18px;">You've Been Shortlisted</p>
    </div>

    <div class="content">
      <p>Dear <strong>{{full_name}}</strong>,</p>
      
      <p>We are excited to inform you that your application has been successfully shortlisted for the position! Based on our initial screening process, your profile shows great potential for this role.</p>

      <div class="details-box">
        <h3 style="margin-top: 0; color: #28a745;">📋 Application Details</h3>
        
        <div class="detail-row">
          <span class="detail-label">Application ID:</span>
          <span class="detail-value"><code>{{application_id}}</code></span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Job Requisition:</span>
          <span class="detail-value"><code>{{job_requisition_id}}</code></span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Current Status:</span>
          <span class="detail-value"><strong style="color: #28a745; text-transform: capitalize;">{{status}}</strong></span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Screening Score:</span>
          <span class="detail-value"><span class="score-highlight">{{score}}/100</span></span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Document Reviewed:</span>
          <span class="detail-value" style="text-transform: capitalize;">{{document_type}}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Screening Status:</span>
          <span class="detail-value" style="text-transform: capitalize;">{{screening_status}}</span>
        </div>
      </div>

      <div class="next-steps">
        <h3 style="margin-top: 0; color: #007bff;">🚀 What's Next?</h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Our HR team will contact you within the next 2-3 business days</li>
          <li>Be prepared to discuss your experience and qualifications in detail</li>
          <li>Keep an eye on your email for interview scheduling information</li>
          <li>Feel free to research our company culture and values</li>
        </ul>
      </div>

      <p>We look forward to learning more about you and how you can contribute to our team. Thank you for your interest in joining our organization!</p>

      <p style="margin-top: 30px;">
        Best regards,<br>
        <strong>{{company_name}} Recruitment Team</strong>
      </p>
    </div>

    <div class="footer">
      <p>This is an automated message regarding your job application.</p>
      <p>If you have any questions, please contact our HR department.</p>
    </div>
  </div>
</body>
</html>`,
        language: 'en',
        isActive: true,
        tenantId: 'global',
      },

      // Interview Scheduled Template
      {
        id: 'template-interview-scheduled',
        name: 'interview-scheduled',
        type: 'email',
        subject: 'Interview Invitation - {{job_requisition_title}}',
        body: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Invitation</title>
  <style>
    /* Reset */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; }

    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .email-wrapper { width: 100%; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 32px 40px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0; opacity: 0.9; font-size: 16px; }
    .content { padding: 40px; color: #334155; line-height: 1.6; }
    .greeting { font-size: 18px; margin-bottom: 24px; color: #1e293b; }
    .intro { margin-bottom: 32px; font-size: 16px; color: #475569; }
    .interview-card { background: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #3b82f6; }
    .interview-title { font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 16px; }
    .detail-item { margin-bottom: 12px; display: flex; }
    .detail-label { color: #64748b; font-weight: 500; min-width: 120px; font-size: 14px; }
    .detail-value { color: #1e293b; font-weight: 500; font-size: 14px; }
    .action-section { background: #f0f9ff; border-radius: 8px; padding: 24px; margin: 32px 0; text-align: center; border: 1px solid #e0f2fe; }
    .action-title { font-size: 16px; font-weight: 600; color: #0369a1; margin-bottom: 16px; }
    .btn { display: inline-block; padding: 14px 32px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; transition: all 0.2s ease; }
    .btn:hover { background: #2563eb; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
    .secondary-btn { background: #64748b; margin-left: 12px; }
    .secondary-btn:hover { background: #475569; }
    .location-section, .virtual-section { background: #fff7ed; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f97316; }
    .section-title { font-size: 16px; font-weight: 600; color: #c2410c; margin-bottom: 12px; }
    .instructions { background: #f1f5f9; border-radius: 6px; padding: 16px; margin: 24px 0; font-size: 14px; color: #475569; }
    .footer { padding: 32px 40px; background: #1e293b; color: #94a3b8; font-size: 14px; text-align: center; }
    .footer a { color: #cbd5e1; text-decoration: none; }
    .footer a:hover { color: #ffffff; }
    .company-name { color: #ffffff; font-weight: 600; margin-bottom: 8px; }

    @media screen and (max-width: 480px) {
      .header { padding: 24px 20px; }
      .header h1 { font-size: 20px; }
      .content { padding: 24px; }
      .detail-item { flex-direction: column; }
      .detail-label { min-width: auto; margin-bottom: 4px; }
      .secondary-btn { margin-left: 0; }
    }
  </style>
</head>
<body>
  <div style="padding: 20px; background: #f8fafc;">
    <div class="email-wrapper">
      <div class="header">
        <h1>You're Invited to Interview!</h1>
        <p>We're excited to learn more about you</p>
      </div>
      
      <div class="content">
        <p class="greeting">Hello {{full_name}},</p>
        
        <p class="intro">Thank you for your interest in joining our team! We were impressed by your application and would like to invite you to interview for the position of <strong>{{job_requisition_title}}</strong>.</p>
        
        <div class="interview-card">
          <div class="interview-title">Interview Details</div>
          
          <div class="detail-item">
            <div class="detail-label">Date & Time:</div>
            <div class="detail-value">{{interview_start_date_time}} - {{interview_end_date_time}} ({{timezone}})</div>
          </div>
          
          <div class="detail-item">
            <div class="detail-label">Position:</div>
            <div class="detail-value">{{job_requisition_title}}</div>
          </div>
          
          <div class="detail-item">
            <div class="detail-label">Application ID:</div>
            <div class="detail-value">{{application_id}}</div>
          </div>
        </div>

        {{#if has_meeting_link}}
        <div class="virtual-section">
          <div class="section-title">Virtual Interview</div>
          <p style="margin: 0 0 16px 0; color: #475569;">This will be a virtual interview. Click the button below to join the meeting:</p>
          <div style="text-align: center;">
            <a href="{{meeting_link}}" class="btn">Join Virtual Interview</a>
          </div>
          <p style="margin: 12px 0 0 0; font-size: 13px; color: #64748b; text-align: center;">
            You can also use this link: <a href="{{meeting_link}}" style="color: #3b82f6; word-break: break-all;">{{meeting_link}}</a>
          </p>
        </div>
        {{/if}}

        {{#if has_address}}
        <div class="location-section">
          <div class="section-title">In-Person Interview</div>
          <p style="margin: 0 0 12px 0; color: #475569; font-weight: 500;">Location:</p>
          <p style="margin: 0; color: #1e293b; font-size: 15px; background: white; padding: 12px; border-radius: 4px;">{{interview_address}}</p>
        </div>
        {{/if}}

        {{#if message}}
        <div class="instructions">
          <strong>Additional Instructions:</strong><br>
          {{message}}
        </div>
        {{/if}}

        <div class="action-section">
          <div class="action-title">Manage Your Interview</div>
          <p style="margin: 0 0 20px 0; color: #475569; font-size: 14px;">View your application details or reschedule if needed</p>
          <a href="{{dashboard_url}}" class="btn">View Application Dashboard</a>
        </div>

        <p style="margin: 32px 0 16px 0; color: #475569; font-size: 14px;">
          We look forward to speaking with you!<br>
          <strong>Best regards,</strong><br>
          The {{company_name}} Hiring Team
        </p>
      </div>
      
      <div class="footer">
        <div class="company-name">{{company_name}}</div>
        <p style="margin: 8px 0; font-size: 13px;">
          This is an automated message. If you have any questions or need to reschedule,<br>
          please contact <a href="mailto:{{support_email}}">{{support_email}}</a>
        </p>
        <p style="margin: 16px 0 0 0; font-size: 12px; color: #64748b;">
          Application ID: {{application_id}} • Schedule ID: {{schedule_id}}
        </p>
      </div>
    </div>
  </div>
</body>
</html>`,
        language: 'en',
        isActive: true,
        tenantId: 'global',
      },

      // Add this template to your allTemplates array in test-all-templates.ts
      {
        id: 'template-candidate-shortlisted-gaps',
        name: 'candidate-shortlisted-gaps',
        type: 'email',
        subject:
          'Congratulations! You have been shortlisted - Additional Information Required',
        body: `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Shortlisted - Employment Gap Information Required</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #28a745;
          }
          .success-icon {
            font-size: 48px;
            color: #28a745;
            margin-bottom: 10px;
          }
          h1 {
            color: #28a745;
            margin: 0;
            font-size: 28px;
          }
          .details-box {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #28a745;
          }
          .gaps-section {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #f1c40f;
            margin: 20px 0;
          }
          .gap-item {
            background: white;
            padding: 15px;
            margin: 10px 0;
            border-radius: 6px;
            border-left: 3px solid #e74c3c;
          }
          .detail-row {
            margin: 10px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
          }
          .detail-label {
            font-weight: 600;
            color: #495057;
            min-width: 140px;
          }
          .detail-value {
            color: #212529;
            flex: 1;
            margin-left: 10px;
          }
          .score-highlight {
            background: #28a745;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            display: inline-block;
          }
          .gaps-highlight {
            background: #f39c12;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            display: inline-block;
          }
          .action-required {
            background: #e7f3ff;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #007bff;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
            font-size: 14px;
          }
          @media (max-width: 600px) {
            body { padding: 10px; }
            .container { padding: 20px; }
            h1 { font-size: 24px; }
            .detail-row { flex-direction: column; align-items: flex-start; }
            .detail-label { min-width: auto; margin-bottom: 5px; }
            .detail-value { margin-left: 0; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">🎉</div>
            <h1>Congratulations!</h1>
            <p style="margin: 10px 0 0 0; color: #6c757d; font-size: 18px;">You've Been Shortlisted</p>
          </div>

          <div class="content">
            <p>Dear <strong>{{full_name}}</strong>,</p>
            
            <p>We are excited to inform you that your application has been successfully shortlisted for the position! Your profile shows great potential, and we would like to move forward with your candidacy.</p>

            <div class="details-box">
              <h3 style="margin-top: 0; color: #28a745;">📋 Application Details</h3>
              
              <div class="detail-row">
                <span class="detail-label">Application ID:</span>
                <span class="detail-value"><code>{{application_id}}</code></span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Job Requisition:</span>
                <span class="detail-value"><code>{{job_requisition_id}}</code></span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Current Status:</span>
                <span class="detail-value"><strong style="color: #28a745; text-transform: capitalize;">{{status}}</strong></span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Screening Score:</span>
                <span class="detail-value"><span class="score-highlight">{{score}}/100</span></span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Employment Gaps Found:</span>
                <span class="detail-value"><span class="gaps-highlight">{{gaps_count}} gaps ({{total_gap_duration}})</span></span>
              </div>
            </div>

            <div class="gaps-section">
              <h3 style="margin-top: 0; color: #f39c12;">⚠️ Employment Gaps Identified</h3>
              <p>During our review of your application, we identified the following employment gaps that we'd like to discuss with you:</p>
              
              {{#each employment_gaps}}
              <div class="gap-item">
                <div class="detail-row">
                  <span class="detail-label">Gap Period:</span>
                  <span class="detail-value"><strong>{{start_date}} to {{end_date}}</strong></span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Duration:</span>
                  <span class="detail-value">{{duration}}</span>
                </div>
              </div>
              {{/each}}
              
              <p><strong>Total Gap Duration:</strong> {{total_gap_duration}}</p>
            </div>

            <div class="action-required">
              <h3 style="margin-top: 0; color: #007bff;">📝 Next Steps - Action Required</h3>
              <p>To proceed with your application, we need you to provide brief explanations for the employment gaps identified above. This is a standard part of our screening process.</p>
              
              <p><strong>Please prepare to discuss:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>What you were doing during each gap period</li>
                <li>Any relevant activities (education, travel, family care, freelancing, etc.)</li>
                <li>Skills or experiences gained during these periods</li>
                <li>Any challenges or circumstances that contributed to the gaps</li>
              </ul>
              
              <p><strong>Timeline:</strong> Our HR team will contact you within the next 2-3 business days to schedule a brief discussion about these gaps.</p>
            </div>

            <p>We understand that career paths can have various twists and turns, and we're committed to hearing your full story. Employment gaps don't disqualify candidates - we simply want to understand your complete professional journey.</p>

            <p>Thank you for your interest in joining our organization, and we look forward to learning more about your experiences!</p>

            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>{{company_name}} Recruitment Team</strong>
            </p>
          </div>

          <div class="footer">
            <p>This is an automated message regarding your job application.</p>
            <p>If you have any questions about the employment gaps or this process, please contact our HR department.</p>
          </div>
        </div>
      </body>
      </html>`,
        language: 'en',
        isActive: true,
        tenantId: 'global',
      },
      // Add this template to your allTemplates array in test-all-templates.ts
      {
        id: 'template-interview-rescheduled',
        name: 'interview-rescheduled',
        type: 'email',
        subject: 'Interview Rescheduled - New Date and Time',
        body: `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Interview Rescheduled - Important Update</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #ffc107;
          }
          .update-icon {
            font-size: 48px;
            color: #ffc107;
            margin-bottom: 10px;
          }
          .cancelled-header {
            border-bottom: 2px solid #dc3545;
          }
          .cancelled-icon {
            color: #dc3545;
          }
          h1 {
            color: #ffc107;
            margin: 0;
            font-size: 28px;
          }
          .cancelled-title {
            color: #dc3545;
          }
          .alert-box {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #ffc107;
            margin: 20px 0;
          }
          .cancelled-alert {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            border-left: 4px solid #dc3545;
          }
          .new-schedule {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 25px;
            border-radius: 10px;
            margin: 25px 0;
            text-align: center;
          }
          .cancelled-schedule {
            background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
          }
          .schedule-time {
            font-size: 24px;
            font-weight: bold;
            margin: 10px 0;
          }
          .meeting-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #007bff;
          }
          .meeting-link {
            background: #007bff;
            color: white;
            padding: 12px 25px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
            margin: 10px 0;
            font-weight: bold;
          }
          .meeting-link:hover {
            background: #0056b3;
            color: white;
          }
          .reason-box {
            background: #e9ecef;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
            border-left: 3px solid #6c757d;
          }
          .important-note {
            background: #d1ecf1;
            border: 1px solid #bee5eb;
            padding: 15px;
            border-radius: 5px;
            border-left: 3px solid #17a2b8;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
            font-size: 14px;
          }
          .detail-row {
            margin: 10px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
          }
          .detail-label {
            font-weight: 600;
            color: #495057;
            min-width: 120px;
          }
          .detail-value {
            color: #212529;
            flex: 1;
            margin-left: 10px;
          }
          @media (max-width: 600px) {
            body { padding: 10px; }
            .container { padding: 20px; }
            h1 { font-size: 24px; }
            .schedule-time { font-size: 20px; }
            .detail-row { flex-direction: column; align-items: flex-start; }
            .detail-label { min-width: auto; margin-bottom: 5px; }
            .detail-value { margin-left: 0; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header {{#if is_cancelled}}cancelled-header{{/if}}">
            <div class="update-icon {{#if is_cancelled}}cancelled-icon{{/if}}">
              {{#if is_cancelled}}❌{{else}}🔄{{/if}}
            </div>
            <h1 {{#if is_cancelled}}class="cancelled-title"{{/if}}>
              {{#if is_cancelled}}Interview Cancelled{{else}}Interview Rescheduled{{/if}}
            </h1>
            <p style="margin: 10px 0 0 0; color: #6c757d; font-size: 18px;">
              {{#if is_cancelled}}We apologize for the inconvenience{{else}}Please note the new date and time{{/if}}
            </p>
          </div>

          <div class="content">
            <p>Dear <strong>{{full_name}}</strong>,</p>
            
            {{#if is_cancelled}}
            <p>We regret to inform you that your scheduled interview has been cancelled. We sincerely apologize for any inconvenience this may cause.</p>
            {{else}}
            <p>We need to reschedule your interview due to unforeseen circumstances. Please find the new interview details below:</p>
            {{/if}}

            {{#unless is_cancelled}}
            <div class="new-schedule">
              <h3 style="margin-top: 0;">📅 New Interview Schedule</h3>
              <div class="schedule-time">{{interview_start_date_time}}</div>
              <p>Duration: {{interview_start_date_time}} - {{interview_end_date_time}}</p>
              <p><strong>Timezone:</strong> {{timezone}}</p>
            </div>
            {{/unless}}

            {{#if is_cancelled}}
            <div class="new-schedule cancelled-schedule">
              <h3 style="margin-top: 0;">❌ Interview Cancelled</h3>
              <p style="font-size: 18px; margin: 0;">We will contact you shortly to reschedule</p>
            </div>
            {{/if}}

            <div class="meeting-info">
              <h4 style="margin-top: 0; color: #007bff;">📋 Interview Details</h4>
              
              <div class="detail-row">
                <span class="detail-label">Application ID:</span>
                <span class="detail-value"><code>{{application_id}}</code></span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Schedule ID:</span>
                <span class="detail-value"><code>{{schedule_id}}</code></span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Job Requisition:</span>
                <span class="detail-value"><code>{{job_requisition_id}}</code></span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value"><strong style="text-transform: capitalize; {{#if is_cancelled}}color: #dc3545;{{else}}color: #ffc107;{{/if}}">{{status}}</strong></span>
              </div>
              
              {{#unless is_cancelled}}
              <div class="detail-row">
                <span class="detail-label">Meeting Mode:</span>
                <span class="detail-value" style="text-transform: capitalize;"><strong>{{meeting_mode}}</strong></span>
              </div>

              {{#if meeting_link}}
              <div style="text-align: center; margin: 20px 0;">
                <p><strong>Join the interview:</strong></p>
                <a href="{{meeting_link}}" class="meeting-link">Join Virtual Meeting</a>
              </div>
              {{/if}}

              {{#if interview_address}}
              <div class="detail-row">
                <span class="detail-label">Address:</span>
                <span class="detail-value">{{interview_address}}</span>
              </div>
              {{/if}}
              {{/unless}}
            </div>

            {{#if cancellation_reason}}
            <div class="reason-box">
              <h4 style="margin-top: 0; color: #6c757d;">📝 Reason for {{#if is_cancelled}}Cancellation{{else}}Reschedule{{/if}}</h4>
              <p style="margin-bottom: 0;">{{cancellation_reason}}</p>
            </div>
            {{/if}}

            {{#if message}}
            <div class="alert-box {{#if is_cancelled}}cancelled-alert{{/if}}">
              <h4 style="margin-top: 0; color: {{#if is_cancelled}}#721c24{{else}}#856404{{/if}};">💬 Additional Message</h4>
              <p style="margin-bottom: 0;">{{message}}</p>
            </div>
            {{/if}}

            {{#unless is_cancelled}}
            <div class="important-note">
              <h4 style="margin-top: 0; color: #0c5460;">⚠️ Important Reminders</h4>
              <ul style="margin-bottom: 0; padding-left: 20px;">
                <li>Please confirm your attendance for the new time slot</li>
                <li>Update your calendar with the new interview time</li>
                <li>Join the meeting 5-10 minutes early if virtual, or arrive 15 minutes early if in-person</li>
                <li>Contact us immediately if the new time doesn't work for you</li>
              </ul>
            </div>
            {{/unless}}

            {{#if is_cancelled}}
            <div class="important-note">
              <h4 style="margin-top: 0; color: #0c5460;">📞 Next Steps</h4>
              <ul style="margin-bottom: 0; padding-left: 20px;">
                <li>Our HR team will contact you within 24-48 hours to reschedule</li>
                <li>Please reply to this email if you have any urgent questions</li>
                <li>We remain interested in your candidacy and apologize for the inconvenience</li>
              </ul>
            </div>
            {{/if}}

            <p>{{#if is_cancelled}}We sincerely apologize for this inconvenience and appreciate your understanding. We remain committed to moving forward with your application.{{else}}We apologize for any inconvenience caused by this schedule change and appreciate your flexibility.{{/if}}</p>

            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>{{company_name}} HR Team</strong>
            </p>
          </div>

          <div class="footer">
            <p>This is an automated interview {{#if is_cancelled}}cancellation{{else}}rescheduling{{/if}} notification.</p>
            <p>Please contact HR if you have any questions or concerns.</p>
          </div>
        </div>
      </body>
      </html>`,
        language: 'en',
        isActive: true,
        tenantId: 'global',
      },
      {
        id: 'template-application-submitted',
        name: 'application-submitted',
        description:
          'Notification sent when a candidate submits a job application',
        type: 'email',
        subject: 'Application Submitted - {{job_requisition_title}}',
        body: `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Submitted</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
          <h1 style="color: #2c3e50; margin-bottom: 20px;">Application Submitted Successfully</h1>
          
          <p>Dear {{full_name}},</p>
          
          <p>Thank you for your interest in the <strong>{{job_requisition_title}}</strong> position. We have successfully received your application.</p>
          
          <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Application Details:</strong></p>
            <ul style="margin: 10px 0;">
              <li><strong>Application ID:</strong> {{application_id}}</li>
              <li><strong>Position:</strong> {{job_requisition_title}}</li>
              <li><strong>Status:</strong> {{status}}</li>
            </ul>
          </div>
          
          <p>Our recruitment team will review your application and contact you if your qualifications match our requirements. This process typically takes 5-10 business days.</p>
          
          <p>In the meantime, you can:</p>
          <ul>
            <li>Check your application status at any time</li>
            <li>Update your profile information</li>
            <li>Browse other open positions</li>
          </ul>
          
          <p>We appreciate your interest in joining our team and look forward to potentially working with you.</p>
          
          <p>Best regards,<br>
          The Recruitment Team</p>
        </div>
      </body>
      </html>`,
        language: 'en',
        isActive: true,
        tenantId: 'global',
      },
      // Document Expiry Template
      {
        id: 'template-document-expiry',
        name: 'document-expiry',
        description:
          'Generic notification sent when any document is about to expire',
        type: 'email',
        subject: 'Document Renewal Reminder - {{days_left}} Days',
        body: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
      body { 
        font-family: Arial, sans-serif; 
        line-height: 1.6; 
        color: #333; 
        max-width: 600px; 
        margin: 0 auto; 
        padding: 20px; 
      }
      .container { 
        background: #fff; 
        padding: 30px; 
        border: 1px solid #ddd; 
        border-radius: 5px; 
      }
      .header { 
        border-bottom: 1px solid #eee; 
        padding-bottom: 15px; 
        margin-bottom: 20px; 
      }
      .details { 
        background: #f9f9f9; 
        padding: 15px; 
        border-radius: 3px; 
        margin: 15px 0; 
      }
    </style>
</head>
<body>
    <div class="container">
      <div class="header">
        <h2>Document Renewal Reminder</h2>
      </div>
      
      <p>Dear {{full_name}},</p>
      
      <p>Your {{document_type}} will expire in {{days_left}} days. Please arrange for renewal at your earliest convenience.</p>
      
      <div class="details">
        <p><strong>Document:</strong> {{document_name}}</p>
        <p><strong>Expiry Date:</strong> {{expiry_date}}</p>
        <p><strong>Days Remaining:</strong> {{days_left}}</p>
      </div>
      
      {{#if message}}
      <p><strong>Note:</strong> {{message}}</p>
      {{/if}}
      
      <p>Please contact the relevant department to begin the renewal process.</p>
      
      <p>Best regards,<br>HR Team</p>
    </div>
</body>
</html>`,
        language: 'en',
        isActive: true,
        tenantId: 'global',
      },

      // Document Expired Template - NEW
      {
        id: 'template-document-expired',
        name: 'document-expired',
        description: 'Notification sent when a document has already expired',
        type: 'email',
        subject: 'EXPIRED: {{document_type}} - Immediate Action Required',
        body: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
      body { 
        font-family: Arial, sans-serif; 
        line-height: 1.6; 
        color: #333; 
        max-width: 600px; 
        margin: 0 auto; 
        padding: 20px; 
      }
      .container { 
        background: #fff; 
        padding: 30px; 
        border: 1px solid #dc3545; 
        border-radius: 5px; 
      }
      .header { 
        border-bottom: 2px solid #dc3545; 
        padding-bottom: 15px; 
        margin-bottom: 20px; 
        text-align: center;
      }
      .expired-badge {
        background: #dc3545;
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: bold;
        display: inline-block;
        margin-bottom: 10px;
      }
      .details { 
        background: #f8d7da; 
        padding: 20px; 
        border-radius: 5px; 
        margin: 20px 0; 
        border-left: 4px solid #dc3545;
      }
      .urgent-action {
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        padding: 20px;
        border-radius: 5px;
        border-left: 4px solid #ffc107;
        margin: 20px 0;
      }
      .action-list {
        background: #d1ecf1;
        padding: 15px;
        border-radius: 5px;
        margin: 15px 0;
      }
    </style>
</head>
<body>
    <div class="container">
      <div class="header">
        <div class="expired-badge">⚠️ EXPIRED</div>
        <h2 style="color: #dc3545; margin: 0;">Document Has Expired</h2>
      </div>
      
      <p>Dear {{full_name}},</p>
      
      <p><strong>IMPORTANT:</strong> Your {{document_type}} has expired and requires immediate attention.</p>
      
      <div class="details">
        <h4 style="color: #721c24; margin-top: 0;">📋 Expired Document Details</h4>
        <p><strong>Document:</strong> {{document_name}}</p>
        <p><strong>Document Type:</strong> {{document_type}}</p>
        <p><strong>Expired Date:</strong> {{expiry_date}}</p>
        <p><strong>Days Since Expiry:</strong> {{days_expired}} days ago</p>
        <p><strong>Timezone:</strong> {{timezone}}</p>
      </div>
      
      {{#if message}}
      <div class="urgent-action">
        <h4 style="color: #856404; margin-top: 0;">💬 Important Message</h4>
        <p style="margin-bottom: 0;">{{message}}</p>
      </div>
      {{/if}}
      
      <div class="action-list">
        <h4 style="color: #0c5460; margin-top: 0;">📝 Immediate Actions Required</h4>
        <ul>
          <li><strong>Contact the relevant department immediately</strong> to report the expired document</li>
          <li><strong>Begin the renewal process urgently</strong> to avoid further complications</li>
          <li><strong>Gather all required documentation</strong> for expedited processing</li>
          <li><strong>Inform your supervisor/HR</strong> of the expired status</li>
          <li><strong>Submit renewal application</strong> as soon as possible</li>
        </ul>
      </div>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;"><strong>⏰ Time Sensitive:</strong> Please take action immediately to avoid any service interruptions or compliance issues.</p>
      </div>
      
      <p>If you have already submitted a renewal application, please contact the relevant department to confirm receipt and processing status.</p>
      
      <p style="color: #dc3545;"><strong>This requires your immediate attention.</strong></p>
      
      <p>Best regards,<br>
      <strong>HR Team</strong></p>
    </div>
</body>
</html>`,
        language: 'en',
        isActive: true,
        tenantId: 'global',
      },

      // Rostering
      {
        id: 'carer-assigned-to-cluster',
        name: 'carer-assigned-to-cluster',
        description:
          'Notification sent when a carer has been assigned to a new cluster',
        type: 'email',
        subject: 'New cluster assignment',
        body: `<html>
              <head>
                  <meta charset="utf-8">
                  <style>
                    body { 
                      font-family: Arial, sans-serif; 
                      line-height: 1.6; 
                      color: #333; 
                      max-width: 600px; 
                      margin: 0 auto; 
                      padding: 20px; 
                    }
                    .container { 
                      background: #fff; 
                      padding: 30px; 
                      border: 1px solid #00A300; 
                      border-radius: 5px; 
                    }
                    .header { 
                      border-bottom: 2px solid #00A300; 
                      padding-bottom: 15px; 
                      margin-bottom: 20px; 
                      text-align: center;
                    }
                    .details { 
                      background: #B8FFB8; 
                      padding: 20px; 
                      border-radius: 5px; 
                      margin: 20px 0; 
                      border-left: 4px solid #004700;
                    }
                    .urgent-action {
                      background: #fff3cd;
                      border: 1px solid #ffeaa7;
                      padding: 20px;
                      border-radius: 5px;
                      border-left: 4px solid #ffc107;
                      margin: 20px 0;
                    }
                    .action-list {
                      background: #d1ecf1;
                      padding: 15px;
                      border-radius: 5px;
                      margin: 15px 0;
                    }
                  </style>
              </head>
              <body>
                  <div class="container">
                    <div class="header">
                      <h2 style="color: #00A300; margin: 0;">New Cluster Assignmet</h2>
                    </div>
                    
                    <p>Dear {{carer_name}},</p>
                    
                    <p><strong>This is to notify you that you have been assigned to a new cluster, below are the details of your new cluster.</p>
                    
                    <div class="details">
                      <h4 style="color: #004700; margin-top: 0;">Cluster Details</h4>
                      <p><strong>Cluster name:</strong> {{cluster_name}}</p>
                      <p><strong>Cluster Location:</strong> {{cluster_location}}</p>
                      <p><strong>Cluster Postcode:</strong> {{cluster_postcode}}</p>
                    </div>
                    
                    {{#if message}}
                    <div class="urgent-action">
                      <h4 style="color: #856404; margin-top: 0;">💬 Important Message</h4>
                      <p style="margin-bottom: 0;">{{message}}</p>
                    </div>
                    {{/if}}
                    
                    <p>Best regards,<br>
                    <strong>HR Team</strong></p>
                  </div>
              </body>
              </html>`,
        language: 'en',
        isActive: true,
        tenantId: 'global',
      },
    ];

    // Create all templates
    for (const templateData of allTemplates) {
      const template = await prisma.template.upsert({
        where: { id: templateData.id },
        update: {
          name: templateData.name,
          description: templateData.description,
          type: templateData.type,
          subject: templateData.subject,
          body: templateData.body,
          language: templateData.language,
          isActive: templateData.isActive,
        },
        create: templateData,
      });
      console.log(`   ✅ Created/Updated global template: ${template.name}`);
    }

    console.log(`\n🎉 Created ${allTemplates.length} templates successfully!`);

    console.log('\n🔄 Updating/Creating tenant templates from global templates...');

    // Get all non-global tenants
    const existingTenants = await prisma.tenant.findMany({
      where: { id: { not: 'global' } },
    });

    // Get all current global templates
    const allGlobalTemplates = await prisma.template.findMany({
      where: { tenantId: 'global', isActive: true },
    });

    for (const tenant of existingTenants) {
      console.log(`\n   📝 Processing templates for tenant: ${tenant.id}`);
      
      for (const globalTemplate of allGlobalTemplates) {
        // Try to find existing tenant template
        const existingTenantTemplate = await prisma.template.findFirst({
          where: {
            tenantId: tenant.id,
            name: globalTemplate.name,
            language: globalTemplate.language,
          },
        });

        if (existingTenantTemplate) {
          // Update existing tenant template with global template content
          await prisma.template.update({
            where: { id: existingTenantTemplate.id },
            data: {
              description: globalTemplate.description,
              type: globalTemplate.type,
              subject: globalTemplate.subject,
              body: globalTemplate.body,
              isActive: globalTemplate.isActive,
            },
          });
          console.log(`      ✅ Updated existing template: ${globalTemplate.name} for ${tenant.id}`);
        } else {
          // Create new tenant template
          await prisma.template.create({
            data: {
              name: globalTemplate.name,
              description: globalTemplate.description,
              type: globalTemplate.type,
              subject: globalTemplate.subject,
              body: globalTemplate.body,
              language: globalTemplate.language,
              isActive: globalTemplate.isActive,
              tenantId: tenant.id,
            },
          });
          console.log(`      ✅ Created new template: ${globalTemplate.name} for ${tenant.id}`);
        }
      }
    }

    // Test the events queue
    console.log('\n📨 Testing events queue...');
    const eventsQueue = new Queue('events', { connection: redisConfig });
    await eventsQueue.waitUntilReady();

    // Test events for each template
    const testEvents = [
      // {
      //   event_type: 'user.email.verified',
      //   data: { user_id: 'user-test-001', user_email: 'tonna.ezugwu@prolianceltd.com', user_name: 'Test User' }
      // },
      {
        event_type: 'user.login.succeeded', 
        data: { user_id: 'user-test-001', user_email: 'tegaokorare91@gmail.com', ip_address: '192.168.1.1', user_agent: 'Chrome', timestamp: new Date().toISOString() }
      },
      // {
      //   event_type: 'auth.2fa.code.requested',
      //   data: { user_id: 'user-test-001', user_email: 'tegaokorare91@gmail.com', '2fa_code': '123456', '2fa_method': 'email', ip_address: '192.168.1.1', user_agent: 'Chrome', expires_in_seconds: 300 }
      // },
       // Add recruitment template tests
      // {
      //   event_type: 'candidate.shortlisted',
      //   data: {
      //     application_id: 'app-test-12345',
      //     full_name: 'John Smith',
      //     email: 'tegaokorare91@gmail.com',
      //     job_requisition_id: 'job-67890',
      //     status: 'shortlisted',
      //     score: 85.5,
      //     screening_status: 'processed',
      //     document_type: 'resume'
      //   }
      // },
      // {
      //   event_type: 'interview.scheduled',
      //   data: {
      //     application_id: 'app-test-67890',
      //     dashboard_url: 'https://inboxquality.com',
      //     full_name: 'Jane Doe',
      //     email: 'support@prolianceltd.com',
      //     job_requisition_id: 'job-67890',
      //     job_requisition_title: 'HR Personel',
      //     status: 'scheduled',
      //     interview_start_date_time: '2025-09-19T10:00:00+01:00',
      //     interview_end_date_time: '2025-09-19T11:00:00+01:00',
      //     meeting_mode: 'virtual',
      //     meeting_link: 'https://zoom.us/j/123456789',
      //     message: 'Please join 5 minutes early',
      //     timezone: 'Africa/Lagos',
      //     schedule_id: 'schedule-test-999'
      //   }
      // },
      // {
      //   event_type: 'user.document.expiry.warning',
      //   data: {
      //     user_email: 'tonna.ezugwu@prolianceltd.com',
      //     full_name: 'John Doe',
      //     document_type: 'Right to Work Permit',
      //     document_name: 'UK Work Visa',
      //     expiry_date: '2025-01-27',
      //     days_left: '7',
      //     message: 'Your work authorization is expiring soon. Please renew immediately to avoid employment disruption.',
      //     timezone: 'GMT'
      //   }
      // },
      // Add this test event to your testEvents array in test-all-templates.ts
      // {
      //   event_type: 'candidate.shortlisted.gaps',
      //   data: {
      //     application_id: 'app-test-33333',
      //     full_name: 'Sarah Johnson',
      //     email: 'tegaokorare91@gmail.com',
      //     job_requisition_id: 'job-67890',
      //     status: 'shortlisted',
      //     score: 78.5,
      //     screening_status: 'processed',
      //     employment_gaps: [
      //       {
      //         start_date: '2020-03-01',
      //         end_date: '2020-12-31',
      //         duration: '10 months'
      //       },
      //       {
      //         start_date: '2022-06-01',
      //         end_date: '2023-01-31',
      //         duration: '8 months'
      //       }
      //     ],
      //     document_type: 'resume'
      //   }
      // },
];

    for (const testEvent of testEvents) {
      const job = await eventsQueue.add(testEvent.event_type, {
        metadata: {
          event_id: 'test-' + Date.now(),
          event_type: testEvent.event_type,
          created_at: new Date().toISOString(),
          source: 'test-script',
          tenant_id: 'global',
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