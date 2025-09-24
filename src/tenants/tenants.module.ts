import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { CoreModule } from '../core/core.module';

@Module({
  imports: [CoreModule], // For PrismaService
  providers: [TenantsService],
  controllers: [TenantsController],
  exports: [TenantsService], // Export so other modules can use it
})
export class TenantsModule {}