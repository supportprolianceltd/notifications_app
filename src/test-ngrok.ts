// src/test-ngrok.ts
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

async function testNgrok() {
  console.log('🚀 Testing via ngrok...\n');

  // Use your local Redis (make sure it's running)
  const redisConfig = {
    host: 'localhost',
    port: 6379,
  };

  const eventsQueue = new Queue('events', { connection: redisConfig });
  await eventsQueue.waitUntilReady();
  console.log('✅ Connected to local Redis');

  const testEvent = {
    metadata: {
      event_id: 'ngrok-test-' + Date.now(),
      event_type: 'user.registration.completed',
      created_at: new Date().toISOString(),
      source: 'ngrok-test-client',
      tenant_id: 'test-tenant-1',
    },
    data: {
      user_id: 'ngrok-user-001',
      user_email: 'test@example.com',
      user_name: 'Ngrok Test User',
    },
  };

  console.log('\n📨 Adding test event via ngrok...');
  const job = await eventsQueue.add(testEvent.metadata.event_type, testEvent);
  console.log(`   ✅ Added test event (Job ID: ${job.id})`);
  console.log(`   🌐 Your ngrok URL: https://6eb3c6036ed6.ngrok-free.app`);
  console.log(`   👀 Check your local NestJS logs for processing`);

  await eventsQueue.close();
}

testNgrok().catch(console.error);