import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server: Server;

  afterInit() {
    this.logger.log('WebSocket gateway initialized on /events');
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:tournament')
  handleJoinTournament(
    @MessageBody() data: { tournamentId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `tournament:${data.tournamentId}`;
    client.join(room);
    return { joined: room };
  }

  @SubscribeMessage('leave:tournament')
  handleLeaveTournament(
    @MessageBody() data: { tournamentId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`tournament:${data.tournamentId}`);
  }

  @SubscribeMessage('join:area')
  handleJoinArea(
    @MessageBody() data: { areaId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `area:${data.areaId}`;
    client.join(room);
    return { joined: room };
  }

  @SubscribeMessage('leave:area')
  handleLeaveArea(
    @MessageBody() data: { areaId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`area:${data.areaId}`);
  }

  emitToRoom(room: string, event: string, data: unknown): void {
    this.server.to(room).emit(event, data);
  }
}
