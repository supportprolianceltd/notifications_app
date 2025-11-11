// scripts/test-inapp-notification.js
// Lightweight test client to connect to the Notifications Gateway
// Usage:
// 1) npm i socket.io-client
// 2) node scripts/test-inapp-notification.js <tenantId> <userId>

const { io } = require('socket.io-client');

const tenantId = process.argv[2] || 'global';
const userId = process.argv[3] || 'test-user';
// Default to the app's port (3001) used in src/main.ts unless overridden
const url = process.env.NOTIF_URL || 'http://localhost:3001/notifications';

console.log(`Connecting to ${url} and joining room ${tenantId}:${userId}`);

const socket = io(url, {
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('Connected, id=', socket.id);
  socket.emit('join', { tenantId, userId });
});

socket.on('joined', (payload) => {
  console.log('Joined room ack:', payload);
});

socket.on('notification.created', (payload) => {
  console.log('\n=== notification.created received ===');
  console.log(JSON.stringify(payload, null, 2));
  console.log('====================================\n');
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});

socket.on('connect_error', (err) => {
  console.error('Connection error', err.message);
});
