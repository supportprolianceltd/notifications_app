// src/core/core.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TemplatesService } from '../templates/templates.service';

@Global() // Make this module global so other modules can access core providers
@Module({
  providers: [PrismaService, TemplatesService],
  exports: [PrismaService, TemplatesService],
})
export class CoreModule {}