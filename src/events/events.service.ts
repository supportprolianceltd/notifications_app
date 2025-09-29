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

  async handleEvent(eventData: any): Promise<string[]> {
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
          },
          tenantId: event.metadata.tenant_id,
          userId: event.data.application_id, // Using application_id as userId for tracking
          userName: event.data.full_name,
          eventType: event.metadata.event_type,
        });

        this.logger.log(`📧 Added interview scheduled email to queue for: ${event.data.email}`);
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