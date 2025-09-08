// src/core/core.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TemplatesService } from '../templates/templates.service';
import { NotificationsService } from '../notifications/notifications.service';

@Global() // Make this module global so all other modules can access its providers
@Module({
  providers: [PrismaService, TemplatesService, NotificationsService],
  exports: [PrismaService, TemplatesService, NotificationsService],
})
export class CoreModule {}