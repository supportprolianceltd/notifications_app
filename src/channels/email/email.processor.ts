import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, WorkerOptions } from 'bullmq';
import { EmailService } from './email.service';
import { Logger } from '@nestjs/common';
import { jobsProcessedCounter } from '../../metrics/metrics.controller';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';

const emailLimiter = new RateLimiterMemory({
  points: parseInt(process.env.EMAIL_RATE_LIMIT || '10'), // 10 emails
  duration: parseInt(process.env.EMAIL_RATE_DURATION || '1'),
});

// BullMQ built-in limiter config
export const emailWorkerOptions: WorkerOptions = {
  // Redis connection is required by BullMQ WorkerOptions.
  // Provide connection details via environment variables (fallbacks provided).
  connection: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    // password: process.env.REDIS_PASSWORD, // uncomment if needed
  } as any,
  limiter: {
    max: parseInt(process.env.EMAIL_WORKER_MAX || '10'), // max jobs per duration
    duration: parseInt(process.env.EMAIL_WORKER_DURATION || '1000'), // duration in ms
  },
};

@Processor('email', emailWorkerOptions)
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
      await emailLimiter.consume('global'); // consume 1 point
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
      } else if(error instanceof RateLimiterRes) {
         // Too many emails sent, re-queue or log
        this.logger.warn('Email rate limit exceeded, delaying job');
        // Optionally: re-queue or delay the job
        throw new Error('Email rate limit exceeded, try again later.');
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