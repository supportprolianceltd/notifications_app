import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EmailService } from './email.service';
import { Logger } from '@nestjs/common';
import { jobsProcessedCounter } from '../../metrics/metrics.controller';

@Processor('email')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);
  private maxRetries = 3;

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job): Promise<any> {
    const { attemptsMade } = job;
    this.logger.log(`📧 Processing email job ${job.id} (attempt ${attemptsMade + 1}/${this.maxRetries + 1})`);

    try {
      await this.emailService.sendEmail(job.data);
      jobsProcessedCounter.inc();
      this.logger.log(`✅ Email sent for job ${job.id}`);
      return { success: true };
    } catch (error) {
      // Handle tenant-specific errors - don't retry these
      if (error.name === 'TenantNotFoundError' || error.message?.includes('Tenant') && error.message?.includes('does not exist')) {
        this.logger.error(`❌ Job ${job.id} failed - Tenant does not exist: ${error.message}`);
        this.logger.error(`🚫 Not retrying job ${job.id} - tenant validation error`);
        jobsProcessedCounter.inc({ status: 'failed', reason: 'tenant_not_found' });
        return { success: false, error: error.message, reason: 'tenant_not_found', retry: false };
      }

      this.logger.error(`❌ Failed email job ${job.id}: ${error.message}`);
      
      if (attemptsMade < this.maxRetries) {
        this.logger.warn(`🔄 Retrying job ${job.id} in ${this.getRetryDelay(attemptsMade)}ms`);
        throw error; // BullMQ will automatically retry
      }
      
      this.logger.error(`💥 Job ${job.id} failed after ${this.maxRetries} attempts`);
      jobsProcessedCounter.inc({ status: 'failed', reason: 'max_retries_exceeded' });
      return { success: false, error: error.message };
    }
  }

  private getRetryDelay(attemptsMade: number): number {
    // Exponential backoff: 5s, 20s, 45s
    return Math.pow(attemptsMade + 1, 2) * 5000;
  }
}