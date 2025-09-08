// src/config/config.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(public configService: ConfigService) {}

  get redisHost(): string {
    const host = this.configService.get<string>('REDIS_HOST');
    if (!host) {
      throw new Error('REDIS_HOST is not defined in environment variables');
    }
    return host;
  }

  get redisPort(): number {
    const port = this.configService.get<number>('REDIS_PORT');
    if (port === undefined) {
      throw new Error('REDIS_PORT is not defined in environment variables');
    }
    return port;
  }

  get databaseUrl(): string {
    const url = this.configService.get<string>('DATABASE_URL');
    if (!url) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }
    return url;
  }

  // Add validation (simple example)
  get sendgridApiKey(): string {
    const key = this.configService.get<string>('SENDGRID_API_KEY');
    if (!key) {
      throw new Error('SENDGRID_API_KEY is not defined in environment variables');
    }
    return key;
  }
}