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
          <h2>Welcome to {{company_name}}, {{user_name}}!</h2>
          <p>Your account has been created by an administrator. You can now log in and start using our platform.</p>
          <div class="info">
            <p><strong>Email:</strong> {{user_email}}</p>
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
        subject: 'Interview Scheduled - {{full_name}} | {{job_requisition_id}}',
        body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Scheduled - Please Confirm</title>
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
      border-bottom: 2px solid #007bff;
    }
    .calendar-icon {
      font-size: 48px;
      color: #007bff;
      margin-bottom: 10px;
    }
    h1 {
      color: #007bff;
      margin: 0;
      font-size: 28px;
    }
    .interview-details {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 25px;
      border-radius: 10px;
      margin: 25px 0;
      text-align: center;
    }
    .interview-time {
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
    .important-note {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      padding: 15px;
      border-radius: 5px;
      border-left: 3px solid #f1c40f;
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
      .interview-time { font-size: 20px; }
      .detail-row { flex-direction: column; align-items: flex-start; }
      .detail-label { min-width: auto; margin-bottom: 5px; }
      .detail-value { margin-left: 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="calendar-icon">📅</div>
      <h1>Interview Scheduled</h1>
      <p style="margin: 10px 0 0 0; color: #6c757d; font-size: 18px;">Please confirm your attendance</p>
    </div>

    <div class="content">
      <p>Dear <strong>{{full_name}}</strong>,</p>
      
      <p>We are pleased to inform you that your interview has been scheduled for the position. Please find the details below:</p>

      <div class="interview-details">
        <h3 style="margin-top: 0;">📋 Interview Information</h3>
        <div class="interview-time">{{interview_start_date_time}}</div>
        <p>Duration: {{interview_start_date_time}} - {{interview_end_date_time}}</p>
        <p><strong>Timezone:</strong> {{timezone}}</p>
      </div>

      <div class="meeting-info">
        <h4 style="margin-top: 0; color: #007bff;">🎯 Meeting Details</h4>
        
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
          <span class="detail-value"><strong style="color: #007bff; text-transform: capitalize;">{{status}}</strong></span>
        </div>
        
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
      </div>

      {{#if message}}
      <div class="important-note">
        <h4 style="margin-top: 0; color: #856404;">📝 Additional Message</h4>
        <p style="margin-bottom: 0;">{{message}}</p>
      </div>
      {{/if}}

      <div class="important-note">
        <h4 style="margin-top: 0; color: #856404;">⚠️ Important Reminders</h4>
        <ul style="margin-bottom: 0; padding-left: 20px;">
          <li>Please confirm your attendance by replying to this email</li>
          <li>Join the meeting 5-10 minutes early if virtual, or arrive 15 minutes early if in-person</li>
          <li>Prepare questions about the role and our company</li>
          <li>Have copies of your resume and any relevant documents ready</li>
        </ul>
      </div>

      <p>We look forward to meeting with you and learning more about your qualifications. If you need to reschedule or have any questions, please contact our HR team as soon as possible.</p>

      <p style="margin-top: 30px;">
        Best regards,<br>
        <strong>{{company_name}} HR Team</strong>
      </p>
    </div>

    <div class="footer">
      <p>This is an automated interview scheduling notification.</p>
      <p>Please reply to confirm your attendance or contact HR if you need to reschedule.</p>
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
        subject: 'Congratulations! You have been shortlisted - Additional Information Required',
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

    console.log('\n🔄 Duplicating new templates for existing tenants...');

    // Get all non-global tenants
    const existingTenants = await prisma.tenant.findMany({
      where: { id: { not: 'global' } },
    });

    for (const tenant of existingTenants) {
      // Get templates this tenant doesn't have yet
      const existingTemplateNames = await prisma.template.findMany({
        where: { tenantId: tenant.id },
        select: { name: true, language: true },
      });

      const existingKeys = new Set(
        existingTemplateNames.map(t => `${t.name}-${t.language}`)
      );

      const newGlobalTemplates = await prisma.template.findMany({
        where: { tenantId: 'global', isActive: true },
      });

      const templatesToCreate = newGlobalTemplates.filter(
        template => !existingKeys.has(`${template.name}-${template.language}`)
      );

      if (templatesToCreate.length > 0) {
        const tenantTemplates = templatesToCreate.map((template) => ({
          name: template.name,
          description: template.description,
          type: template.type,
          subject: template.subject,
          body: template.body,
          language: template.language,
          isActive: template.isActive,
          tenantId: tenant.id,
        }));

        await prisma.template.createMany({
          data: tenantTemplates,
        });

        console.log(`   ✅ Added ${templatesToCreate.length} new templates for ${tenant.id}`);
      }
    }

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
      // {
      //   event_type: 'user.login.succeeded', 
      //   data: { user_id: 'user-test-001', user_email: 'tegaokorare91@gmail.com', ip_address: '192.168.1.1', user_agent: 'Chrome', timestamp: new Date().toISOString() }
      // },
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
      //     full_name: 'Jane Doe',
      //     email: 'tegaokorare91@gmail.com',
      //     job_requisition_id: 'job-67890',
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