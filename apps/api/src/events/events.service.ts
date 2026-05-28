import { Injectable } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

@Injectable()
export class EventsService {
  constructor(private gateway: EventsGateway) {}

  emitToTournament(tournamentId: string, event: string, data: unknown): void {
    this.gateway.emitToRoom(`tournament:${tournamentId}`, event, data);
  }

  emitToArea(areaId: string, event: string, data: unknown): void {
    this.gateway.emitToRoom(`area:${areaId}`, event, data);
  }
}
