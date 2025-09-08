// src/test-queue.ts (run this once with `npx ts-node src/test-queue.ts`)
import { Queue } from 'bullmq';
import { AppConfigService } from './config/config.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
async function test() {
  // Load config
  const configModule = ConfigModule.forRoot();
  const configService = new AppConfigService(new ConfigService());

  // Create a queue instance
  const queue = new Queue('events', {
    connection: {
      host: configService.redisHost,
      port: configService.redisPort,
    },
  });

  // Add a job
  await queue.add('test-event', {
    metadata: {
      event_id: 'test-1',
      event_type: 'user.registration.completed',
      created_at: new Date().toISOString(),
      source: 'test-script',
      tenant_id: 'test-tenant',
    },
    data: {
      user_id: 'test-user-1',
      user_email: 'tegaokorare91@gmail.com',
      user_name: 'Test User',
    },
  });

  console.log('Added test job to the "events" queue!');
  process.exit(0);
}

test();