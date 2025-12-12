// src/events/events.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { IncomingEventDto } from './dto/incoming-event.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { TenantsService } from '../tenants/tenants.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectQueue('email') private readonly emailQueue: Queue, // Inject the email queue
    private readonly tenantsService: TenantsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async handleEvent(eventData: any): Promise<string[]> {
    this.logger.log(`📦 Received event payload: ${JSON.stringify(eventData, null, 2)}`);
    
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
    let usedTenantId = tenantId;
    let tenantToUse = tenant;
    if (!tenant) {
      this.logger.warn(`⚠️ Tenant '${tenantId}' does not exist, falling back to global tenant.`);
      tenantToUse = await this.tenantsService.getTenant('global');
      usedTenantId = 'global';
      if (!tenantToUse) {
        this.logger.error(`❌ Global tenant does not exist. Cannot process event.`);
        throw new BadRequestException(`Tenant '${tenantId}' does not exist and no global tenant fallback available`);
      }
      // Update event metadata so all downstream logic uses the global tenant
      if (event && event.metadata) {
        event.metadata.tenant_id = 'global';
      }
    }

    this.logger.log(`🎯 Processing event: ${event.metadata.event_type} for tenant: ${usedTenantId}`);
    this.logger.log(`📊 Event data summary: ${JSON.stringify({
      event_type: event.metadata.event_type,
      tenant_id: usedTenantId,
      created_at: event.metadata.created_at,
      data_keys: Object.keys(event.data || {}),
      recipient_email: event.data?.email || event.data?.user_email || 'N/A'
    }, null, 2)}`);
    // Optionally, update event.metadata.tenant_id = usedTenantId if you want downstream to see the fallback

    // 3. Route the event based on its type
    let jobIds: string[] = [];
    try {
      switch (event.metadata.event_type) {
        case 'user.registration.completed':
          jobIds = await this.handleUserRegistration(event);
          break;

        case 'user.account.created':
          jobIds = await this.handleUserAccountCreated(event);
          break;

        case 'user.email.verified':
          jobIds = await this.handleUserEmailVerified(event);
          break;

        case 'user.login.succeeded':
          jobIds = await this.handleUserLoginSucceeded(event);
          break;

        case 'user.login.failed':
          jobIds = await this.handleUserLoginFailed(event);
          break;

        case 'user.password.reset.requested':
          jobIds = await this.handlePasswordReset(event);
          break;

        case 'invoice.payment.failed':
          jobIds = await this.handlePaymentFailed(event);
          break;
        
        case 'task.assigned':
          jobIds = await this.handleTaskAssigned(event);
          break;
        
        case 'comment.mentioned':
          jobIds = await this.handleCommentMentioned(event);
          break;

        case 'content.liked':
          jobIds = await this.handleContentLiked(event);
          break;

        case 'approval.requested':
          jobIds = await this.handleApprovalRequested(event);
          break;

        case 'status.changed':
          jobIds = await this.handleStatusChanged(event);
          break;

        case 'deadline.approaching':
          jobIds = await this.handleDeadlineApproaching(event);
          break;

        case 'access.granted':
          jobIds = await this.handleAccessGranted(event);
          break;

        case 'auth.2fa.code.requested':
          jobIds = await this.handleTwoFactorCodeRequested(event);
          break;

        case 'auth.2fa.attempt.failed':
          jobIds = await this.handleTwoFactorAttemptFailed(event);
          break;

        case 'auth.2fa.method.changed':
          jobIds = await this.handleTwoFactorMethodChanged(event);
          break;

        case 'auth.2fa.backup_code.used':
          jobIds = await this.handleTwoFactorBackupCodeUsed(event);
          break;

        case 'candidate.shortlisted':
          jobIds = await this.handleCandidateShortlisted(event);
          break;

        case 'interview.scheduled':
          jobIds = await this.handleInterviewScheduled(event);
          break;

        case 'interview.rescheduled':
          jobIds = await this.handleInterviewRescheduled(event);
          break;

        case 'candidate.shortlisted.gaps':
          jobIds = await this.handleCandidateShortlistedWithGaps(event);
          break;

        case 'application.submitted':
          jobIds = await this.handleApplicationSubmitted(event);
          break;

        case 'user.document.expiry.warning':
          jobIds = await this.handleDocumentExpiry(event);
          break;

        case 'user.document.expired':
          jobIds = await this.handleDocumentExpired(event);
          break;

        case 'rostering.cluster.created':
          jobIds = await this.handleRosteringClusterCreted(event);
          break;

        case 'rostering.request.received':
          jobIds = await this.handleRosteringRequestReceived(event);
          break;

        case 'rostering.careplan.created':
          jobIds = await this.handleRoasteringCareplanCreated(event);
          break;

        // Additional rostering / care events
        case 'rostering.careplan.updated':
          jobIds = await this.handleCareplanUpdated(event);
          break;

        case 'rostering.cluster.updated':
          jobIds = await this.handleClusterUpdated(event);
          break;

        case 'rostering.careplan.deleted':
          jobIds = await this.handleCareplanDeleted(event);
          break;

        case 'rostering.cluster.deleted':
          jobIds = await this.handleClusterDeleted(event);
          break;

        case 'rostering.carer.assigned':
          jobIds = await this.handleCarerAssignedToCluster(event);
          break;

        case 'rostering.client.assigned':
          jobIds = await this.handleClientAssignedToCluster(event);
          break;

        case 'rostering.caretask.created':
          jobIds = await this.handleCareTaskCreated(event);
          break;

        case 'rostering.caretask.updated':
          jobIds = await this.handleCareTaskUpdated(event);
          break;

        case 'rostering.caretask.deleted':
          jobIds = await this.handleCareTaskDeleted(event);
          break;

        // TODO: Add more cases for other event types
        default:
          this.logger.warn(`Unhandled event type: ${event.metadata.event_type}`);
          jobIds = [];
      }
      return jobIds;
    } catch (error) {
      this.logger.error(`Failed to handle event ${event.metadata.event_type}`, error.stack);
      throw error;
    }
  }

  private async handleUserRegistration(event: IncomingEventDto): Promise<string[]> {
    console.log('TENANT ID IN EVENT:', event.metadata.tenant_id);
    this.logger.log(`Handling registration for user: ${event.data.user_email}`);
    
    // Add a job to the email queue instead of just logging
    const job = await this.emailQueue.add('welcome-email', {
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
    return job.id ? [job.id] : [];
  }

  private async handleUserAccountCreated(event: IncomingEventDto): Promise<string[]> {
    const job = await this.emailQueue.add('user-account-created', {
      to: event.data.user_email,
      subject: 'Your Account Has Been Created',
      template: 'user-account-created',
      context: {
        user_name: event.data.user_name,
        company_name: event.data.company_name,
        temp_password: event.data.temp_password, // if applicable
        login_link: event.data.login_link,
      },
      tenantId: event.metadata.tenant_id,
      eventType: event.metadata.event_type,
    });
    return job.id ? [job.id] : [];
  }

  private async handleUserEmailVerified(event: IncomingEventDto): Promise<string[]> {
    const job = await this.emailQueue.add('user-email-verified', {
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
    return job.id ? [job.id] : [];
  }

  private async handleUserLoginSucceeded(event: IncomingEventDto): Promise<string[]> {
    console.log('IP Address:', event.data.ip_address);
    console.log('Timestamp:', event.data.timestamp);
    console.log('Timestamp:', event.data.user_agent);
    const job = await this.emailQueue.add('login-succeeded', {
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
    // Create in-app notification
    try {
      await this.notificationsService.createNotificationLog({
        tenantId: event.metadata.tenant_id,
        userId: event.data.user_id,
        userEmail: event.data.user_email,
        userName: event.data.user_name,
        channel: 'in_app',
        eventType: event.metadata.event_type,
        status: 'queued',
        subject: 'Login successful',
        body: `A login to your account occurred at ${event.data.timestamp} from ${event.data.ip_address}`,
        templateId: 'template-login-succeeded',
      });
    } catch (err) {
      this.logger.error('Failed to create in-app notification for login succeeded', err.stack || err.message);
    }

    return job.id ? [job.id] : [];
  }

  private async handleUserLoginFailed(event: IncomingEventDto): Promise<string[]> {
    const job = await this.emailQueue.add('login-failed', {
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
    return job.id ? [job.id] : [];
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


  private async handlePasswordReset(event: IncomingEventDto): Promise<string[]> {
    const job = await this.emailQueue.add('password-reset', {
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
    return job.id ? [job.id] : [];
  }

  private async handlePaymentFailed(event: IncomingEventDto): Promise<string[]> {
    const job = await this.emailQueue.add('payment-failed', {
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
    return job.id ? [job.id] : [];
  }

  private async handleTaskAssigned(event: IncomingEventDto): Promise<string[]> {
    const job = await this.emailQueue.add('task-assigned', {
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
    return job.id ? [job.id] : [];
  }

  private async handleCommentMentioned(event: IncomingEventDto): Promise<string[]> {
    const job = await this.emailQueue.add('comment-mentioned', {
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
    return job.id ? [job.id] : [];
  }

  private async handleContentLiked(event: IncomingEventDto): Promise<string[]> {
    const job = await this.emailQueue.add('content-liked', {
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
    return job.id ? [job.id] : [];
  }

  private async handleApprovalRequested(event: IncomingEventDto): Promise<string[]> {
    const job = await this.emailQueue.add('approval-requested', {
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
    return job.id ? [job.id] : [];
  }

  private async handleStatusChanged(event: IncomingEventDto): Promise<string[]> {
    const job = await this.emailQueue.add('status-changed', {
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
    return job.id ? [job.id] : [];
  }

  private async handleDeadlineApproaching(event: IncomingEventDto): Promise<string[]> {
    const job = await this.emailQueue.add('deadline-approaching', {
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
    return job.id ? [job.id] : [];
  }

  private async handleAccessGranted(event: IncomingEventDto): Promise<string[]> {
    const job = await this.emailQueue.add('access-granted', {
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
    return job.id ? [job.id] : [];
  }

    private async handleTwoFactorCodeRequested(event: IncomingEventDto): Promise<string[]> {
      const job = await this.emailQueue.add('2fa-code-requested', {
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
      return job.id ? [job.id] : [];
    }

    // --- Rostering / care event handlers (stubs) ---

    private async handleRosteringClusterCreted(event: IncomingEventDto): Promise<string[]> {
      this.logger.log(`Handling rostering cluster created ${event.metadata.tenant_id}`);
      // Implement logic: enqueue notifications or audit logs as needed
      return [];
    }
    private async handleRosteringRequestReceived(event: IncomingEventDto): Promise<string[]> {
      this.logger.log(`Handling rostering request received ${event.metadata.tenant_id}`);
      // Implement logic: enqueue notifications or audit logs as needed
      return [];
    }
    private async handleRoasteringCareplanCreated(event: IncomingEventDto): Promise<string[]> {
      this.logger.log(`Handling careplan created ${event.metadata.tenant_id}`);
      const job = await this.emailQueue.add('2fa-attempt-failed', {
        to: event.data.staff_email,
        subject: 'Care plan created',
        template: 'rostering-careplan-created',
        context: {
          client_email: event.data.client_email,
          staff_email: event.data.staff_email,
          client_name: event.data.client_name,
          user_id: event.data.user_id,
        },
        tenantId: event.metadata.tenant_id,
        eventType: event.metadata.event_type,
      });
      return job.id ? [job.id] : [];
      // Implement logic: enqueue notifications or audit logs as needed
      return [];
    }
    private async handleCareplanUpdated(event: IncomingEventDto): Promise<string[]> {
      this.logger.log(`Handling careplan updated for tenant ${event.metadata.tenant_id}`);
      // Implement logic: enqueue notifications or audit logs as needed
      const job = await this.emailQueue.add('2fa-attempt-failed', {
        to: event.data.staff_email,
        subject: 'Care plan updated',
        template: 'rostering-careplan-updated',
        context: {
          client_email: event.data.client_email,
          staff_email: event.data.staff_email,
          client_name: event.data.client_name,
          user_id: event.data.user_id,
        },
        tenantId: event.metadata.tenant_id,
        eventType: event.metadata.event_type,
      });
      return job.id ? [job.id] : [];
    }

    private async handleClusterUpdated(event: IncomingEventDto): Promise<string[]> {
      this.logger.log(`Handling cluster updated for tenant ${event.metadata.tenant_id}`);
      return [];
    }

    private async handleCareplanDeleted(event: IncomingEventDto): Promise<string[]> {
      this.logger.log(`Handling careplan deleted for tenant ${event.metadata.tenant_id}`);
      return [];
    }

    private async handleClusterDeleted(event: IncomingEventDto): Promise<string[]> {
      this.logger.log(`Handling cluster deleted for tenant ${event.metadata.tenant_id}`);
      return [];
    }

    private async handleCarerAssignedToCluster(event: IncomingEventDto): Promise<string[]> {
      this.logger.log(`Handling carer assigned to cluster for tenant ${event.metadata.tenant_id}`);
      const job = await this.emailQueue.add('2fa-code-requested', {
        to: event.data.user_email,
        subject: 'You have been assigned to a new cluster',
        template: 'carer-assigned-to-cluster',
        context: {
          user_id: event.data.user_id,
          user_email: event.data.user_email,
          cluster_name: event.data.cluster_name,
          carer_name: event.data.carer_name,
        },
        tenantId: event.metadata.tenant_id,
        eventType: event.metadata.event_type,
      });
      return job.id ? [job.id] : [];
    }

    private async handleClientAssignedToCluster(event: IncomingEventDto): Promise<string[]> {
      this.logger.log(`Handling client assigned to cluster for tenant ${event.metadata.tenant_id}`);
      return [];
    }

    private async handleCareTaskCreated(event: IncomingEventDto): Promise<string[]> {
      this.logger.log(`Handling care task created for tenant ${event.metadata.tenant_id}`);
      return [];
    }

    private async handleCareTaskUpdated(event: IncomingEventDto): Promise<string[]> {
      this.logger.log(`Handling care task updated for tenant ${event.metadata.tenant_id}`);
      return [];
    }

    private async handleCareTaskDeleted(event: IncomingEventDto): Promise<string[]> {
      this.logger.log(`Handling care task deleted for tenant ${event.metadata.tenant_id}`);
      return [];
    }

    private async handleTwoFactorAttemptFailed(event: IncomingEventDto): Promise<string[]> {
      const job = await this.emailQueue.add('2fa-attempt-failed', {
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
      return job.id ? [job.id] : [];
    }

    private async handleTwoFactorMethodChanged(event: IncomingEventDto): Promise<string[]> {
      const job = await this.emailQueue.add('2fa-method-changed', {
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
      return job.id ? [job.id] : [];
    }

    private async handleTwoFactorBackupCodeUsed(event: IncomingEventDto): Promise<string[]> {
      const job = await this.emailQueue.add('2fa-backup-code-used', {
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
      return job.id ? [job.id] : [];
    }

    private async handleCandidateShortlisted(event: IncomingEventDto): Promise<string[]> {
        this.logger.log(`Handling candidate shortlisted for: ${event.data.email}`);
        
        const job = await this.emailQueue.add('candidate-shortlisted', {
          to: event.data.email,
          subject: 'Congratulations! You have been shortlisted',
          template: 'candidate-shortlisted',
          context: {
            full_name: event.data.full_name,
            job_requisition_id: event.data.job_requisition_id,
            score: event.data.score,
            screening_status: event.data.screening_status,
            employment_gaps: event.data.employment_gaps,
            document_type: event.data.document_type,
            application_id: event.data.application_id,
            status: event.data.status,
          },
          tenantId: event.metadata.tenant_id,
          userId: event.data.application_id, // Using application_id as userId for tracking
          userName: event.data.full_name,
          eventType: event.metadata.event_type,
        });

        this.logger.log(`📧 Added candidate shortlisted email to queue for: ${event.data.email}`);
        // Create in-app notification
        try {
          await this.notificationsService.createNotificationLog({
            tenantId: event.metadata.tenant_id,
            userId: event.data.application_id,
            userEmail: event.data.email,
            userName: event.data.full_name,
            channel: 'in_app',
            eventType: event.metadata.event_type,
            status: 'queued',
            subject: 'You have been shortlisted',
            body: `Congratulations! You have been shortlisted for ${event.data.job_requisition_id}`,
            templateId: 'template-candidate-shortlisted',
          });
        } catch (err) {
          this.logger.error('Failed to create in-app notification for shortlisted candidate', err.stack || err.message);
        }

        return job.id ? [job.id] : [];
      }

    private async handleInterviewScheduled(event: IncomingEventDto): Promise<string[]> {
        this.logger.log(`Handling interview scheduled for: ${event.data.email}`);
        
        const job = await this.emailQueue.add('interview-scheduled', {
          to: event.data.email,
          subject: 'Interview Scheduled - Please Confirm Your Availability',
          template: 'interview-scheduled',
          context: {
            full_name: event.data.full_name,
            job_requisition_id: event.data.job_requisition_id,
            job_requisition_title: event.data.job_requisition_title,
            application_id: event.data.application_id,
            dashboard_url: event.data.dashboard_url,
            status: event.data.status,
            interview_start_date_time: event.data.interview_start_date_time,
            interview_end_date_time: event.data.interview_end_date_time,
            meeting_mode: event.data.meeting_mode,
            meeting_link: event.data.meeting_link,
            interview_address: event.data.interview_address,
            message: event.data.message,
            timezone: event.data.timezone,
            schedule_id: event.data.schedule_id,
          },
          tenantId: event.metadata.tenant_id,
          userId: event.data.application_id, // Using application_id as userId for tracking
          userName: event.data.full_name,
          eventType: event.metadata.event_type,
        });

        this.logger.log(`📧 Added interview scheduled email to queue for: ${event.data.email}`);
        // Create in-app notification
        try {
          await this.notificationsService.createNotificationLog({
            tenantId: event.metadata.tenant_id,
            userId: event.data.application_id,
            userEmail: event.data.email,
            userName: event.data.full_name,
            channel: 'in_app',
            eventType: event.metadata.event_type,
            status: 'queued',
            subject: 'Interview scheduled',
            body: `Your interview for ${event.data.job_requisition_title} is scheduled on ${event.data.interview_start_date_time}`,
            templateId: 'template-interview-scheduled',
          });
        } catch (err) {
          this.logger.error('Failed to create in-app notification for interview scheduled', err.stack || err.message);
        }

        return job.id ? [job.id] : [];
      }

      private async handleInterviewRescheduled(event: IncomingEventDto): Promise<string[]> {
        this.logger.log(`Handling interview rescheduled for: ${event.data.email}`);
        
        const job = await this.emailQueue.add('interview-rescheduled', {
          to: event.data.email,
          subject: 'Interview Rescheduled - New Date and Time',
          template: 'interview-rescheduled',
          context: {
            full_name: event.data.full_name,
            job_requisition_id: event.data.job_requisition_id,
            application_id: event.data.application_id,
            status: event.data.status,
            interview_start_date_time: event.data.interview_start_date_time,
            interview_end_date_time: event.data.interview_end_date_time,
            meeting_mode: event.data.meeting_mode,
            meeting_link: event.data.meeting_link,
            interview_address: event.data.interview_address,
            message: event.data.message,
            timezone: event.data.timezone,
            schedule_id: event.data.schedule_id,
            cancellation_reason: event.data.cancellation_reason,
            is_cancelled: event.data.status === 'cancelled',
          },
          tenantId: event.metadata.tenant_id,
          userId: event.data.application_id,
          userName: event.data.full_name,
          eventType: event.metadata.event_type,
        });

        this.logger.log(`📧 Added interview rescheduled email to queue for: ${event.data.email}`);
        return job.id ? [job.id] : [];
      }

      private async handleCandidateShortlistedWithGaps(event: IncomingEventDto): Promise<string[]> {
        this.logger.log(`Handling candidate shortlisted with gaps for: ${event.data.email}`);
        
        const job = await this.emailQueue.add('candidate-shortlisted-gaps', {
          to: event.data.email,
          subject: 'Congratulations! You have been shortlisted - Additional Information Required',
          template: 'candidate-shortlisted-gaps',
          context: {
            full_name: event.data.full_name,
            job_requisition_id: event.data.job_requisition_id,
            score: event.data.score,
            screening_status: event.data.screening_status,
            employment_gaps: event.data.employment_gaps, // Array of gap objects
            document_type: event.data.document_type,
            application_id: event.data.application_id,
            status: event.data.status,
            gaps_count: event.data.employment_gaps?.length || 0,
            total_gap_duration: this.calculateTotalGapDuration(event.data.employment_gaps),
          },
          tenantId: event.metadata.tenant_id,
          userId: event.data.application_id,
          userName: event.data.full_name,
          eventType: event.metadata.event_type,
        });

        this.logger.log(`📧 Added candidate shortlisted with gaps email to queue for: ${event.data.email}`);
        return job.id ? [job.id] : [];
      }

      private async handleApplicationSubmitted(event: IncomingEventDto): Promise<string[]> {
        this.logger.log(`Handling application submitted for: ${event.data.email}`);

        const job = await this.emailQueue.add('application-submitted', {
          to: event.data.email,
          subject: 'Application Submitted Successfully',
          template: 'application-submitted',
          context: {
            full_name: event.data.full_name,
            job_requisition_id: event.data.job_requisition_id,
            job_requisition_title: event.data.job_requisition_title,
            application_id: event.data.application_id,
            status: event.data.status,
          },
          tenantId: event.metadata.tenant_id,
          userId: event.data.application_id,
          userName: event.data.full_name,
          eventType: event.metadata.event_type,
        });

        this.logger.log(`📧 Added application submitted email to queue for: ${event.data.email}`);
        return job.id ? [job.id] : [];
      }

      private async handleDocumentExpiry(event: IncomingEventDto): Promise<string[]> {
        const {user_email, full_name, document_type, document_name, expiry_date, days_left, message, timezone } = event.data;

        this.logger.log(
          `Handling ${document_type} expiry warning for: ${user_email} (${days_left} days left)`
        );
        
        let subject = 'Document Expiry Reminder';
        const daysLeft = parseInt(days_left);

        
        if (daysLeft <= 1) subject = 'FINAL WARNING: Document Expires Tomorrow';
        else if (daysLeft <= 3) subject = `CRITICAL: Document Expires in ${daysLeft} Days`;
        else if (daysLeft <= 7) subject = `URGENT: Document Expires in ${daysLeft} Days`;
        else if (daysLeft <= 14) subject = `Document Expiry Alert - ${daysLeft} Days Remaining`;
        else subject = `Document Expiry Reminder - ${daysLeft} Days Remaining`;

        const job = await this.emailQueue.add('document-expiry', {
          to: user_email,
          subject: subject,
          template: 'document-expiry',
          context: {
            full_name,
            document_type,
            document_name,
            expiry_date,
            days_left,
            message,
            timezone,
          },
          tenantId: event.metadata.tenant_id,
          userId: user_email,
          userName: event.data.full_name,
          eventType: event.metadata.event_type,
        });

        this.logger.log(`📧 Added document expiry email to queue for: ${user_email}`);
        // Create in-app notification
        try {
          await this.notificationsService.createNotificationLog({
            tenantId: event.metadata.tenant_id,
            userId: user_email, // if userId unknown, store email as userId for tracking or keep userId empty
            userEmail: user_email,
            userName: full_name,
            channel: 'in_app',
            eventType: event.metadata.event_type,
            status: 'queued',
            subject,
            body: `Your ${document_type} will expire on ${expiry_date}`,
            templateId: 'template-document-expiry',
          });
        } catch (err) {
          this.logger.error('Failed to create in-app notification for document expiry', err.stack || err.message);
        }

        return job.id ? [job.id] : [];
      }

      private async handleDocumentExpired(event: IncomingEventDto): Promise<string[]> {
        const {user_email, full_name, document_type, document_name, expiry_date, days_expired, message, timezone } = event.data;

        this.logger.log(
          `Handling ${document_type} expired notification for: ${user_email} (expired ${days_expired} days ago)`
        );
        
        const subject = `EXPIRED: ${document_type} - Immediate Action Required`;

        const job = await this.emailQueue.add('document-expired', {
          to: user_email,
          subject: subject,
          template: 'document-expired',
          context: {
            full_name,
            document_type,
            document_name,
            expiry_date,
            days_expired,
            message,
            timezone,
          },
          tenantId: event.metadata.tenant_id,
          userId: user_email,
          userName: full_name,
          eventType: event.metadata.event_type,
        });

        this.logger.log(`📧 Added document expired email to queue for: ${user_email}`);
        return job.id ? [job.id] : [];
      }



      // Helper method to calculate total gap duration
      private calculateTotalGapDuration(gaps: any[]): string {
        if (!gaps || gaps.length === 0) return '0 months';
        
        let totalMonths = 0;
        gaps.forEach(gap => {
          // Extract months from duration string like "6 months" or "1.5 years"
          const duration = gap.duration.toLowerCase();
          if (duration.includes('year')) {
            const years = parseFloat(duration.match(/[\d.]+/)[0]);
            totalMonths += years * 12;
          } else if (duration.includes('month')) {
            const months = parseFloat(duration.match(/[\d.]+/)[0]);
            totalMonths += months;
          }
        });
        
        if (totalMonths >= 12) {
          const years = Math.floor(totalMonths / 12);
          const remainingMonths = totalMonths % 12;
          return remainingMonths > 0 ? `${years} years ${remainingMonths} months` : `${years} years`;
        }
        return `${totalMonths} months`;
      }
    
}