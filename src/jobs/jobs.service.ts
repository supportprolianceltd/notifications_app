import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue('email') private readonly emailQueue: Queue,
  ) {}

  async getJobStatus(jobId: string) {
    try {
      // Try to find the job in the email queue
      const job = await this.emailQueue.getJob(jobId);
      
      if (!job) {
        throw new NotFoundException(`Job with ID ${jobId} not found`);
      }

      // Get job state and details
      const state = await job.getState();
      const progress = job.progress;
      const processedOn = job.processedOn;
      const finishedOn = job.finishedOn;
      const failedReason = job.failedReason;
      const attempts = job.attemptsMade;
      const maxAttempts = job.opts.attempts || 1;

      // Parse the job data to get context
      const jobData = job.data;

      return {
        jobId: job.id,
        status: state,
        progress: progress,
        data: {
          eventType: jobData.eventType,
          tenantId: jobData.tenantId,
          to: jobData.to,
          subject: jobData.subject,
          template: jobData.template,
        },
        timestamps: {
          createdAt: new Date(job.timestamp),
          processedAt: processedOn ? new Date(processedOn) : null,
          finishedAt: finishedOn ? new Date(finishedOn) : null,
        },
        attempts: {
          made: attempts,
          max: maxAttempts,
          remaining: Math.max(0, maxAttempts - attempts),
        },
        error: failedReason || null,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to get job status: ${error.message}`);
    }
  }

  async getRecentFailedJobs(tenantId?: string, limit: number = 10) {
    try {
      const failedJobs = await this.emailQueue.getFailed(0, limit - 1);
      
      let filteredJobs = failedJobs;
      if (tenantId) {
        filteredJobs = failedJobs.filter(job => job.data.tenantId === tenantId);
      }

      return filteredJobs.map(job => ({
        jobId: job.id,
        status: 'failed',
        data: {
          eventType: job.data.eventType,
          tenantId: job.data.tenantId,
          to: job.data.to,
          subject: job.data.subject,
          template: job.data.template,
        },
        timestamps: {
          createdAt: new Date(job.timestamp),
          failedAt: job.finishedOn ? new Date(job.finishedOn) : null,
        },
        attempts: {
          made: job.attemptsMade,
          max: job.opts.attempts || 1,
        },
        error: job.failedReason,
      }));
    } catch (error) {
      throw new Error(`Failed to get failed jobs: ${error.message}`);
    }
  }
}