// scripts/inapp-listener.js
// Run: node scripts/inapp-listener.js <tenantId> <userId> [baseUrl]
// Example: node scripts/inapp-listener.js global test-user http://localhost:3001

const { io } = require('socket.io-client');
const { URL } = require('url');
const http = require('http');
const https = require('https');

const tenantId = process.argv[2] || 'global';
const userId = process.argv[3] || 'test-user';

// Support two calling styles for backwards compatibility:
// 1) node inapp-listener.js <tenantId> <userId> <baseUrl>
// 2) node inapp-listener.js <tenantId> <userId> <channel> <baseUrl>
const rawArg4 = process.argv[4];
let channel = 'in_app';
let base = process.argv[5] || process.env.NOTIF_URL_BASE || 'http://localhost:3001';
if (rawArg4) {
  if (/^https?:\/\//.test(rawArg4)) {
    // arg4 is the base URL
    base = rawArg4;
  } else {
    // arg4 is treated as channel
    channel = rawArg4;
    base = process.argv[5] || process.env.NOTIF_URL_BASE || 'http://localhost:3001';
  }
}

const namespace = `${base.replace(/\/$/, '')}/notifications`;

console.log(`In-app listener starting. Namespace: ${namespace}`);
console.log(`Will join room: ${tenantId}:${userId}`);
console.log('Run this and then POST an event to your /events endpoint (example JSON below).');
console.log(`Filtering initial fetch by channel: ${channel}`);
console.log('\nPOST to: ' + base + '/events (Content-Type: application/json)');
console.log('\nListener will also attempt an initial HTTP GET of existing in-app notifications to help you see current state.');

// Try to fetch current in-app notifications once (best-effort)
function fetchCurrentNotifications() {
  try {
    const u = new URL(`${base.replace(/\/$/, '')}/notifications?tenantId=${encodeURIComponent(tenantId)}&userId=${encodeURIComponent(userId)}&channel=${encodeURIComponent(channel)}`);
    const lib = u.protocol === 'https:' ? https : http;
    const opts = { method: 'GET', headers: { 'Accept': 'application/json' } };
    const req = lib.request(u, opts, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('\nExisting in-app notifications (most recent first):');
          console.log(JSON.stringify(json, null, 2));
          console.log('\nWaiting for new notifications...');
        } catch (e) {
          console.log('Could not parse existing notifications response:', e.message);
        }
      });
    });
    req.on('error', (err) => {
      console.log('Initial notifications fetch failed:', err.message);
    });
    req.end();
  } catch (e) {
    console.log('Skipping initial notifications fetch:', e.message);
  }
}

fetchCurrentNotifications();

const socket = io(namespace, { transports: ['websocket'], reconnectionAttempts: 5, timeout: 10000 });

socket.on('connect', () => {
  console.log('Socket connected, id=', socket.id);
  socket.emit('join', { tenantId, userId });
});

socket.on('joined', (p) => {
  console.log('Joined room ack:', p);
});

socket.on('notification.created', (payload) => {
  console.log('\n=== notification.created ===');
  console.log(JSON.stringify(payload, null, 2));
  console.log('============================\n');
});

socket.on('connect_error', (err) => {
  console.error('Socket connect_error:', err.message || err);
});

socket.on('reconnect_attempt', (n) => {
  console.log('Reconnection attempt', n);
});

socket.on('reconnect_failed', () => {
  console.error('Reconnect failed');
});

socket.on('disconnect', (reason) => {
  console.log('Socket disconnected:', reason);
});

// Keep process alive
process.on('SIGINT', () => {
  console.log('\nShutting down listener...');
  try { socket.close(); } catch (e) {}
  process.exit(0);
});
