// src/test-complete-flow.ts
import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { AppConfigService } from './config/config.service';

async function testCompleteFlow() {
  console.log('🚀 Testing Complete Notification Flow...\n');

  // Load configuration
  const configModule = await ConfigModule.forRoot();
  const configService = new ConfigService();
  const appConfigService = new AppConfigService(configService);

  const redisConfig = {
    url: appConfigService.redisUrl,
  };

  console.log('📊 Configuration loaded:');
  console.log(`   - Redis: ${redisConfig.url}`);
  console.log(`   - Database: ${appConfigService.databaseUrl ? 'Connected' : 'Missing'}`);
  console.log('');

  // Test events queue
  const eventsQueue = new Queue('events', { connection: redisConfig });
  await eventsQueue.waitUntilReady();
  console.log('✅ Connected to Redis events queue');

  // Test email queue
  const emailQueue = new Queue('email', { connection: redisConfig });
  await emailQueue.waitUntilReady();
  console.log('✅ Connected to Redis email queue');

  // Test different event types
  const testEvents = [
    {
      name: 'User Registration',
      event: {
        metadata: {
          event_id: 'test-reg-' + Date.now(),
          event_type: 'user.registration.completed',
          created_at: new Date().toISOString(),
          source: 'test-script',
          tenant_id: 'test-tenant-1',
        },
        data: {
          user_id: 'user-test-001',
          user_email: 'tegaokorare91@gmail.com',
          user_name: 'Test User',
        },
      },
    },
    {
      name: 'Password Reset',
      event: {
        metadata: {
          event_id: 'test-pwd-' + Date.now(),
          event_type: 'user.password.reset.requested',
          created_at: new Date().toISOString(),
          source: 'test-script',
          tenant_id: 'test-tenant-1',
        },
        data: {
          user_id: 'user-test-001',
          user_email: 'tegaokorare91@gmail.com',
          user_name: 'Test User',
          reset_link: 'https://app.example.com/reset?token=abc123',
        },
      },
    },
    {
      name: 'Payment Failed',
      event: {
        metadata: {
          event_id: 'test-pay-' + Date.now(),
          event_type: 'invoice.payment.failed',
          created_at: new Date().toISOString(),
          source: 'test-script',
          tenant_id: 'test-tenant-2',
        },
        data: {
          user_id: 'user-test-002',
          user_email: 'tegaokorare91@gmail.com',
          user_name: 'Billing Manager',
          invoice_id: 'INV-2023-1001',
          invoice_amount: 299.99,
          retry_link: 'https://app.example.com/payment/retry',
        },
      },
    },
  ];

  console.log('\n📨 Adding test events to queue...');
  
  for (const testEvent of testEvents) {
    const job = await eventsQueue.add(testEvent.event.metadata.event_type, testEvent.event);
    console.log(`   ✅ Added ${testEvent.name} event (Job ID: ${job.id})`);
  }

  console.log('\n👀 Now check your NestJS application logs to see:');
  console.log('   1. Events being processed from the queue');
  console.log('   2. Email jobs being created');
  console.log('   3. Emails being sent (or simulated)');
  console.log('   4. Database entries being created');
  console.log('\n⏳ Waiting 10 seconds for processing...');

  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Check queue status
  const eventsCount = await eventsQueue.getCompletedCount();
  const emailCount = await emailQueue.getCompletedCount();
  
  console.log('\n📊 Queue Status:');
  console.log(`   - Events processed: ${eventsCount}`);
  console.log(`   - Emails sent: ${emailCount}`);

  // Clean up
  await eventsQueue.close();
  await emailQueue.close();
  
  console.log('\n🎉 Test completed! Check your application logs for detailed results.');
  process.exit(0);
}

testCompleteFlow().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});