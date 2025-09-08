// src/config/config.module.ts
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfigService } from './config.service';

@Global() // Makes this module available everywhere without importing
@Module({
  imports: [ConfigModule.forRoot()], // Loads .env file
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}