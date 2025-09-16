// src/metrics/metrics.controller.ts
import { Controller, Get, Res } from '@nestjs/common';

import * as client from 'prom-client';
client.collectDefaultMetrics();

export const emailsSentCounter = new client.Counter({
  name: 'notifications_emails_sent_total',
  help: 'Total number of emails sent',
});

export const jobsProcessedCounter = new client.Counter({
  name: 'notifications_jobs_processed_total',
  help: 'Total number of jobs processed',
});

@Controller('metrics')
export class MetricsController {
  @Get()
  async getMetrics(@Res() res) {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  }
}
