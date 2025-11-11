// scripts/e2e-inapp-test.js
// End-to-end test: connect to notifications gateway, join room, post an event, wait for notification.created
// Usage:
//  node scripts/e2e-inapp-test.js <tenantId> <userId> [eventType]
// Example:
//  node scripts/e2e-inapp-test.js global test-user interview.scheduled

const { io } = require('socket.io-client');
const http = require('http');
const { URL } = require('url');

const tenantId = process.argv[2] || 'global';
const userId = process.argv[3] || 'test-user';
const eventType = process.argv[4] || 'interview.scheduled';
const serverBase = process.env.NOTIF_URL_BASE || 'http://localhost:3001';
const notifNamespace = serverBase + '/notifications';
const eventsEndpoint = serverBase + '/events';

const socket = io(notifNamespace, { transports: ['websocket'] });
let received = false;

console.log(`Connecting to ${notifNamespace} and joining room ${tenantId}:${userId}`);

socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
  socket.emit('join', { tenantId, userId });
});

socket.on('joined', (payload) => {
  console.log('Joined room ack:', payload);
  // After join, post the event
  postEvent();
});

socket.on('notification.created', (payload) => {
  console.log('\n=== notification.created received ===');
  console.log(JSON.stringify(payload, null, 2));
  console.log('====================================\n');
  received = true;
  cleanupAndExit(0);
});

socket.on('connect_error', (err) => {
  console.error('Socket connect_error', err.message || err);
});

socket.on('error', (err) => {
  console.error('Socket error', err);
});

function postEvent() {
  const payload = {
    metadata: {
      event_id: `e2e-${Date.now()}`,
      event_type: eventType,
      created_at: new Date().toISOString(),
      source: 'e2e-test',
      tenant_id: tenantId,
    },
    data: {
      application_id: userId, // EventsService uses application_id as userId for interviews
      email: 'test@example.com',
      full_name: 'E2E Test User',
      job_requisition_id: 'job-123',
      job_requisition_title: 'E2E Job',
      dashboard_url: 'https://example.com/dashboard',
      status: 'scheduled',
      interview_start_date_time: new Date(Date.now() + 3600 * 1000).toISOString(),
      interview_end_date_time: new Date(Date.now() + 5400 * 1000).toISOString(),
      meeting_mode: 'online',
      meeting_link: 'https://meet.example.com/abc',
      interview_address: null,
      message: 'Please join the meeting',
      timezone: 'UTC',
      schedule_id: 'sched-1',
    },
  };

  const parsed = new URL(eventsEndpoint);
  const body = JSON.stringify(payload);

  const opts = {
    hostname: parsed.hostname,
    port: parsed.port || 80,
    path: parsed.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  };

  console.log('Posting event to', eventsEndpoint);

  const req = http.request(opts, (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      console.log('Event POST response status', res.statusCode);
      try {
        console.log('Response body:', data);
      } catch (e) {}
    });
  });

  req.on('error', (err) => {
    console.error('Failed to POST event', err.message || err);
    cleanupAndExit(2);
  });

  req.write(body);
  req.end();

  // Timeout: if no notification within X ms, exit with failure
  const TIMEOUT_MS = parseInt(process.env.E2E_TIMEOUT_MS || '10000', 10);
  setTimeout(() => {
    if (!received) {
      console.error(`Did not receive notification within ${TIMEOUT_MS}ms`);
      cleanupAndExit(3);
    }
  }, TIMEOUT_MS + 100);
}

function cleanupAndExit(code) {
  try { socket.close(); } catch (e) {}
  process.exit(code);
}

// Safety: exit after 20s in case something hangs
setTimeout(() => {
  if (!received) {
    console.error('E2E script timed out after 20s');
    cleanupAndExit(4);
  }
}, 20000);
