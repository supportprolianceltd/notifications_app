import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { TemplatesService } from './templates.service';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  async createTemplate(@Body() dto: {
    name: string;
    type: string;
    subject: string;
    body: string;
    language: string;
    isActive: boolean;
    tenantId: string;
  }) {
    return this.templatesService.createTemplate(dto);
  }

  @Get()
  async getTemplates(@Query('tenantId') tenantId: string) {
    return this.templatesService.getTemplatesForTenant(tenantId);
  }
}
