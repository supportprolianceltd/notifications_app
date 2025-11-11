import { Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/**
 * NotificationsGateway
 * - Clients should join a room named `${tenantId}:${userId}` after connecting
 * - Server can emit to that room to deliver notifications in real time
 */
@WebSocketGateway({
  cors: {
    origin: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // We expect the client to emit a "join" event with { tenantId, userId }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Convenience method clients will call after connecting to join their room.
   * e.g. socket.emit('join', { tenantId: 'global', userId: 'user-123' })
   */
  @SubscribeMessage('join')
  async joinRoom(@ConnectedSocket() client: Socket, @MessageBody() payload: { tenantId: string; userId: string }) {
    try {
      const room = this.getRoomName(payload.tenantId, payload.userId);
      await client.join(room);
      this.logger.log(`Client ${client.id} joined room ${room}`);
      // Acknowledge the join so clients know they're in the right room
      client.emit('joined', { room });
    } catch (err) {
      this.logger.error(`Failed to join room for client ${client.id}: ${err?.message || err}`);
      client.emit('error', { message: 'failed_to_join_room' });
    }
  }

  sendToUser(tenantId: string, userId: string, event: string, payload: any) {
    const room = this.getRoomName(tenantId, userId);
    this.logger.debug(`Emitting event '${event}' to room ${room}`);
    this.server.to(room).emit(event, payload);
  }

  private getRoomName(tenantId: string, userId: string) {
    return `${tenantId}:${userId}`;
  }
}
