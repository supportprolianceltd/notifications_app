// src/events/events.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { IncomingEventDto } from './dto/incoming-event.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { TenantsService } from '../tenants/tenants.service';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectQueue('email') private readonly emailQueue: Queue, // Inject the email queue
    private readonly tenantsService: TenantsService,
  ) {}

  async handleEvent(eventData: any): Promise<void> {
    // 1. Validate the incoming event data against our DTO
    const event = plainToInstance(IncomingEventDto, eventData);
    const errors = await validate(event);

    if (errors.length > 0) {
      this.logger.error('Event validation failed', errors);
      throw new Error(`Event validation failed: ${JSON.stringify(errors)}`);
    }

    // 2. Validate tenant exists before processing
    const tenantId = event.metadata.tenant_id;
    const tenant = await this.tenantsService.getTenant(tenantId);
    if (!tenant) {
      this.logger.error(`❌ Tenant '${tenantId}' does not exist`);
      throw new BadRequestException(`Tenant '${tenantId}' does not exist`);
    }

    this.logger.log(`Received event: ${event.metadata.event_type}`);

    // 3. Route the event based on its type
    try {
      switch (event.metadata.event_type) {
        case 'user.registration.completed':
          await this.handleUserRegistration(event);
          break;

        case 'user.email.verified':
          await this.handleUserEmailVerified(event);
          break;

        case 'user.login.succeeded':
          await this.handleUserLoginSucceeded(event);
          break;

        case 'user.login.failed':
          await this.handleUserLoginFailed(event);
          break;

        case 'user.password.reset.requested':
        await this.handlePasswordReset(event);
        break;

        case 'invoice.payment.failed':
        await this.handlePaymentFailed(event);
        break;
        
        case 'task.assigned':
          await this.handleTaskAssigned(event);
          break;
        
        case 'comment.mentioned':
          await this.handleCommentMentioned(event);
          break;

        case 'content.liked':
          await this.handleContentLiked(event);
          break;

        case 'approval.requested':
          await this.handleApprovalRequested(event);
          break;

        case 'status.changed':
          await this.handleStatusChanged(event);
          break;

        case 'deadline.approaching':
          await this.handleDeadlineApproaching(event);
          break;

        case 'access.granted':
          await this.handleAccessGranted(event);
          break;

        case 'auth.2fa.code.requested':
          await this.handleTwoFactorCodeRequested(event);
          break;

        case 'auth.2fa.attempt.failed':
          await this.handleTwoFactorAttemptFailed(event);
          break;

        case 'auth.2fa.method.changed':
          await this.handleTwoFactorMethodChanged(event);
          break;

        case 'auth.2fa.backup_code.used':
          await this.handleTwoFactorBackupCodeUsed(event);
          break;
        // TODO: Add more cases for other event types
        default:
          this.logger.warn(`Unhandled event type: ${event.metadata.event_type}`);
      }
    } catch (error) {
      this.logger.error(`Failed to handle event ${event.metadata.event_type}`, error.stack);
      throw error;
    }
  }

  private async handleUserRegistration(event: IncomingEventDto): Promise<void> {
    console.log('TENANT ID IN EVENT:', event.metadata.tenant_id);
    this.logger.log(`Handling registration for user: ${event.data.user_email}`);
    
    // Add a job to the email queue instead of just logging
    await this.emailQueue.add('welcome-email', {
      to: event.data.user_email,
      subject: 'Welcome to Our Platform!',
      template: 'welcome-email', // This will be used to fetch the template later
      context: { // Data to inject into the template
        user_name: event.data.user_name,
        company_name: 'Your Company Name', // This should come from tenant branding later
      },
       tenantId: event.metadata.tenant_id,
       eventType: event.metadata.event_type,
    });

    this.logger.log(`📧 Added welcome email to queue for: ${event.data.user_email}`);
  }

  private async handleUserEmailVerified(event: IncomingEventDto): Promise<void> {
    await this.emailQueue.add('user-email-verified', {
      to: event.data.user_email,
      subject: 'Your email has been verified!',
      template: 'user-email-verified',
      context: {
        user_id: event.data.user_id,
        user_email: event.data.user_email,
      },
      tenantId: event.metadata.tenant_id,
      userId: event.data.user_id,
      eventType: event.metadata.event_type,
    });
  }

  private async handleUserLoginSucceeded(event: IncomingEventDto): Promise<void> {
    console.log('IP Address:', event.data.ip_address);
    console.log('Timestamp:', event.data.timestamp);
    console.log('Timestamp:', event.data.user_agent);
    await this.emailQueue.add('login-succeeded', {
      to: event.data.user_email,
      subject: 'Login Successful',
      template: 'login-succeeded',
      context: {
        ip_address: event.data.ip_address,
        user_agent: event.data.user_agent,
        timestamp: event.data.timestamp,
      },
      tenantId: event.metadata.tenant_id,
      eventType: event.metadata.event_type,
    });
  }

  private async handleUserLoginFailed(event: IncomingEventDto): Promise<void> {
    await this.emailQueue.add('login-failed', {
      to: event.data.user_email,
      subject: 'Login Failed',
      template: 'login-failed',
      context: {
        ip_address: event.data.ip_address,
        user_agent: event.data.user_agent,
        reason: event.data.reason,
      },
      userId: event.data.user_id,
      tenantId: event.metadata.tenant_id,
      eventType: event.metadata.event_type,
    });
  }

  private async handleUserAccountLocked(event: IncomingEventDto): Promise<void> {
    await this.emailQueue.add('account-locked', {
      to: event.data.user_email,
      subject: 'Your account has been locked',
      template: 'account-locked',
      context: {
        reason: event.data.reason,
      },
      userId: event.data.user_id,
      tenantId: event.metadata.tenant_id,
    });
  }

  private async handleSuspiciousLogin(event: IncomingEventDto): Promise<void> {
    await this.emailQueue.add('suspicious-login', {
      to: event.data.user_email,
      subject: 'Suspicious Login Detected',
      template: 'suspicious-login',
      context: {
        ip_address: event.data.ip_address,
        location: event.data.location,
        device_type: event.data.device_type,
        approve_link: event.data.approve_link,
        deny_link: event.data.deny_link,
      },
      tenantId: event.metadata.tenant_id,
    });
  }


  private async handlePasswordReset(event: IncomingEventDto): Promise<void> {
    await this.emailQueue.add('password-reset', {
      to: event.data.user_email,
      subject: 'Password Reset Request',
      template: 'password-reset',
      context: {
        user_name: event.data.user_name,
        reset_link: event.data.reset_link,
        expiry_time: '1 hour',
      },
      tenantId: event.metadata.tenant_id,
      userId: event.data.user_id,
      userName: event.data.user_name,
      eventType: event.metadata.event_type,
    });
  }

  private async handlePaymentFailed(event: IncomingEventDto): Promise<void> {
    await this.emailQueue.add('payment-failed', {
      to: event.data.user_email,
      subject: 'Payment Failed',
      template: 'payment-failed',
      context: {
        user_name: event.data.user_name,
        invoice_id: event.data.invoice_id,
        amount: event.data.invoice_amount,
        retry_link: event.data.retry_link,
      },
      tenantId: event.metadata.tenant_id,
      userId: event.data.user_id,
      userName: event.data.user_name,
      eventType: event.metadata.event_type,
    });
  }

  private async handleTaskAssigned(event: IncomingEventDto): Promise<void> {
    await this.emailQueue.add('task-assigned', {
      to: event.data.assigned_to_email,
      subject: 'New Task Assigned',
      template: 'task-assigned',
      context: {
        user_name: event.data.assigned_to_name,
        task_name: event.data.task_name,
        assigner_name: event.data.assigner_name,
        due_date: event.data.due_date,
      },
      tenantId: event.metadata.tenant_id,
      userId: event.data.assigned_to_user_id,
      userName: event.data.assigned_to_name,
      eventType: event.metadata.event_type,
    });
  }

  private async handleCommentMentioned(event: IncomingEventDto): Promise<void> {
    await this.emailQueue.add('comment-mentioned', {
      to: event.data.mentioned_user_email,
      subject: 'You were mentioned in a comment',
      template: 'comment-mentioned',
      context: {
        user_name: event.data.mentioned_user_name,
        author_name: event.data.author_name,
        comment_preview: event.data.comment_text?.substring(0, 100) + '...',
        context_url: event.data.context_url,
      },
      tenantId: event.metadata.tenant_id,
      userId: event.data.mentioned_user_id,
      userName: event.data.mentioned_user_name,
      eventType: event.metadata.event_type,
    });
  }

  private async handleContentLiked(event: IncomingEventDto): Promise<void> {
    await this.emailQueue.add('content-liked', {
      to: event.data.user_email,
      subject: 'Someone liked your post!',
      template: 'content-liked',
      context: {
        user_name: event.data.user_name,
        liker_name: event.data.liker_name,
        content_title: event.data.content_title,
        content_url: event.data.content_url,
      },
      tenantId: event.metadata.tenant_id,
      userId: event.data.user_id,
      eventType: event.metadata.event_type,
    });
  }

  private async handleApprovalRequested(event: IncomingEventDto): Promise<void> {
    await this.emailQueue.add('approval-requested', {
      to: event.data.user_email,
      subject: 'Your approval is required',
      template: 'approval-requested',
      context: {
        user_name: event.data.user_name,
        item_name: event.data.item_name,
        item_url: event.data.item_url,
        requester_name: event.data.requester_name,
        due_date: event.data.due_date,
      },
      tenantId: event.metadata.tenant_id,
      userId: event.data.user_id,
      eventType: event.metadata.event_type,
    });
  }

  private async handleStatusChanged(event: IncomingEventDto): Promise<void> {
    await this.emailQueue.add('status-changed', {
      to: event.data.user_email,
      subject: `Status changed: ${event.data.status}`,
      template: 'status-changed',
      context: {
        user_name: event.data.user_name,
        item_name: event.data.item_name,
        status: event.data.status,
        item_url: event.data.item_url,
      },
      tenantId: event.metadata.tenant_id,
      userId: event.data.user_id,
      eventType: event.metadata.event_type,
    });
  }

  private async handleDeadlineApproaching(event: IncomingEventDto): Promise<void> {
    await this.emailQueue.add('deadline-approaching', {
      to: event.data.user_email,
      subject: 'Deadline Approaching!',
      template: 'deadline-approaching',
      context: {
        user_name: event.data.user_name,
        task_name: event.data.task_name,
        due_date: event.data.due_date,
        task_url: event.data.task_url,
      },
      tenantId: event.metadata.tenant_id,
      userId: event.data.user_id,
      eventType: event.metadata.event_type,
    });
  }

  private async handleAccessGranted(event: IncomingEventDto): Promise<void> {
    await this.emailQueue.add('access-granted', {
      to: event.data.user_email,
      subject: 'Access Granted!',
      template: 'access-granted',
      context: {
        user_name: event.data.user_name,
        resource_name: event.data.resource_name,
        resource_url: event.data.resource_url,
        granted_by: event.data.granted_by,
      },
      tenantId: event.metadata.tenant_id,
      userId: event.data.user_id,
      eventType: event.metadata.event_type,
    });
  }

    private async handleTwoFactorCodeRequested(event: IncomingEventDto): Promise<void> {
      await this.emailQueue.add('2fa-code-requested', {
        to: event.data.user_email,
        subject: 'Your Two-Factor Authentication Code',
        template: '2fa-code-requested',
        context: {
          user_id: event.data.user_id,
          user_email: event.data.user_email,
          code: event.data['2fa_code'],
          method: event.data['2fa_method'],
          ip_address: event.data.ip_address,
          user_agent: event.data.user_agent,
          expires_in_seconds: event.data.expires_in_seconds,
        },
        tenantId: event.metadata.tenant_id,
        eventType: event.metadata.event_type,
      });
    }

    private async handleTwoFactorAttemptFailed(event: IncomingEventDto): Promise<void> {
      await this.emailQueue.add('2fa-attempt-failed', {
        to: event.data.user_email,
        subject: 'Failed Two-Factor Authentication Attempt',
        template: '2fa-attempt-failed',
        context: {
          user_id: event.data.user_id,
          user_email: event.data.user_email,
          ip_address: event.data.ip_address,
          timestamp: event.data.timestamp,
        },
        tenantId: event.metadata.tenant_id,
        eventType: event.metadata.event_type,
      });
    }

    private async handleTwoFactorMethodChanged(event: IncomingEventDto): Promise<void> {
      await this.emailQueue.add('2fa-method-changed', {
        to: event.data.user_email,
        subject: 'Your Two-Factor Authentication Method Was Changed',
        template: '2fa-method-changed',
        context: {
          user_id: event.data.user_id,
          user_email: event.data.user_email,
          new_method: event.data.new_method,
          changed_by_admin: event.data.changed_by_admin,
          timestamp: event.data.timestamp,
        },
        tenantId: event.metadata.tenant_id,
        eventType: event.metadata.event_type,
      });
    }

    private async handleTwoFactorBackupCodeUsed(event: IncomingEventDto): Promise<void> {
      await this.emailQueue.add('2fa-backup-code-used', {
        to: event.data.user_email,
        subject: 'Backup Code Used for Account Access',
        template: '2fa-backup-code-used',
        context: {
          user_id: event.data.user_id,
          user_email: event.data.user_email,
          ip_address: event.data.ip_address,
          remaining_backup_codes: event.data.remaining_backup_codes,
          timestamp: event.data.timestamp,
        },
        tenantId: event.metadata.tenant_id,
        eventType: event.metadata.event_type,
      });
    }
}