// src/test-events-service.ts
import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { AppConfigService } from './config/config.service';
import { EventsService } from './events/events.service';
import { IncomingEventDto } from './events/dto/incoming-event.dto';

async function testEventsService() {
  console.log('🚦 Testing EventsService for new event types...\n');

  const moduleRef = await Test.createTestingModule({
    imports: [ConfigModule.forRoot()],
    providers: [ConfigService, AppConfigService, EventsService],
  }).compile();

  const eventsService = moduleRef.get<EventsService>(EventsService);

  // Test payloads for new event types
  const testEvents = [
    {
      name: 'Content Liked',
      event: {
        metadata: {
          event_id: 'test-content-liked-' + Date.now(),
          event_type: 'content.liked',
          created_at: new Date().toISOString(),
          source: 'test-script',
          tenant_id: 'test-tenant-1',
        },
        data: {
          user_id: 'user-test-001',
          user_email: 'tegaokorare91@gmail.com',
          user_name: 'Test User',
          liker_name: 'Jane Doe',
          content_title: 'How to Use NestJS',
          content_url: 'https://example.com/content/123',
        },
      },
    },
    {
      name: 'Approval Requested',
      event: {
        metadata: {
          event_id: 'test-approval-' + Date.now(),
          event_type: 'approval.requested',
          created_at: new Date().toISOString(),
          source: 'test-script',
          tenant_id: 'test-tenant-1',
        },
        data: {
          user_id: 'user-test-001',
          user_email: 'tegaokorare91@gmail.com',
          user_name: 'Test User',
          item_name: 'Expense Report Q3',
          item_url: 'https://example.com/item/456',
          requester_name: 'Manager Joe',
          due_date: '2025-08-31',
        },
      },
    },
    {
      name: 'Status Changed',
      event: {
        metadata: {
          event_id: 'test-status-' + Date.now(),
          event_type: 'status.changed',
          created_at: new Date().toISOString(),
          source: 'test-script',
          tenant_id: 'test-tenant-1',
        },
        data: {
          user_id: 'user-test-001',
          user_email: 'tegaokorare91@gmail.com',
          user_name: 'Test User',
          item_name: 'Support Ticket #789',
          status: 'Solved',
          item_url: 'https://example.com/ticket/789',
        },
      },
    },
    {
      name: 'Deadline Approaching',
      event: {
        metadata: {
          event_id: 'test-deadline-' + Date.now(),
          event_type: 'deadline.approaching',
          created_at: new Date().toISOString(),
          source: 'test-script',
          tenant_id: 'test-tenant-1',
        },
        data: {
          user_id: 'user-test-001',
          user_email: 'tegaokorare91@gmail.com',
          user_name: 'Test User',
          task_name: 'Submit Project Report',
          due_date: '2025-08-25',
          task_url: 'https://example.com/task/321',
        },
      },
    },
    {
      name: 'Access Granted',
      event: {
        metadata: {
          event_id: 'test-access-' + Date.now(),
          event_type: 'access.granted',
          created_at: new Date().toISOString(),
          source: 'test-script',
          tenant_id: 'test-tenant-1',
        },
        data: {
          user_id: 'user-test-001',
          user_email: 'tegaokorare91@gmail.com',
          user_name: 'Test User',
          resource_name: 'Financial Report 2025',
          resource_url: 'https://example.com/resource/654',
          granted_by: 'Admin Alice',
        },
      },
    },
  ];

  for (const testEvent of testEvents) {
    console.log(`\n➡️  Testing: ${testEvent.name}`);
    try {
      await eventsService.handleEvent(testEvent.event);
      console.log(`✅ ${testEvent.name} processed successfully.`);
    } catch (error) {
      console.error(`❌ ${testEvent.name} failed:`, error.message);
    }
  }

  console.log('\n🎉 All new event type tests completed!');
}

testEventsService();
