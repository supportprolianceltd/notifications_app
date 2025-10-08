import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EventsService } from './events.service';
import { Logger } from '@nestjs/common';

@Processor('events')
export class EventsProcessor extends WorkerHost {
  private readonly logger = new Logger(EventsProcessor.name);

  constructor(private readonly eventsService: EventsService) {
    super(); // Call super() to initialize the WorkerHost
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`🤖 Starting to process job ${job.id}, type: ${job.name}`);
    this.logger.log(`📋 Job payload: ${JSON.stringify(job.data, null, 2)}`);

    try {
      await this.eventsService.handleEvent(job.data);
      this.logger.log(`✅ Finished processing job ${job.id}`);
    } catch (error) {
      this.logger.error(`❌ Error processing job ${job.id}: ${error.message}`);
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job) {
    this.logger.error(`Job ${job.id} failed with reason: ${job.failedReason}`);
  }
}
