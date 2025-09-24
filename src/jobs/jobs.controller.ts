import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get(':jobId/status')
  async getJobStatus(@Param('jobId') jobId: string) {
    try {
      return await this.jobsService.getJobStatus(jobId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }
  }

  @Get('failed')
  async getFailedJobs(
    @Query('tenantId') tenantId?: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return await this.jobsService.getRecentFailedJobs(tenantId, limitNum);
  }
}