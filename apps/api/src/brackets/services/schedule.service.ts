import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  async calculateSchedules(tournamentId: string): Promise<void> {
    const tournament = await this.prisma.tournament.findUniqueOrThrow({
      where: { id: tournamentId },
      include: { areas: true },
    });

    const startTime = new Date(tournament.startDate);
    const [hours, minutes] = tournament.startTime
      .toISOString()
      .substring(11, 16)
      .split(':')
      .map(Number);
    startTime.setHours(hours, minutes, 0, 0);

    const BUFFER_MINUTES = 2;

    for (const area of tournament.areas) {
      const combats = await this.prisma.combat.findMany({
        where: { tournamentId, areaId: area.id, status: 'SCHEDULED' },
        include: { category: { include: { grade: true } } },
        orderBy: [{ roundNumber: 'asc' }, { bracketPosition: 'asc' }],
      });

      let currentTime = new Date(startTime);

      for (const combat of combats) {
        const avgDuration = combat.category.avgCombatDuration ?? 6;

        await this.prisma.combat.update({
          where: { id: combat.id },
          data: { scheduledTime: new Date(currentTime) },
        });

        currentTime = new Date(
          currentTime.getTime() + (avgDuration + BUFFER_MINUTES) * 60 * 1000,
        );
      }
    }
  }

  async recalculateFromNow(areaId: string, tournamentId: string): Promise<void> {
    const combats = await this.prisma.combat.findMany({
      where: { areaId, tournamentId, status: 'SCHEDULED' },
      include: { category: true },
      orderBy: [{ roundNumber: 'asc' }, { bracketPosition: 'asc' }],
    });

    let currentTime = new Date();
    const BUFFER_MINUTES = 2;

    for (const combat of combats) {
      const avgDuration = combat.category.avgCombatDuration ?? 6;
      await this.prisma.combat.update({
        where: { id: combat.id },
        data: { scheduledTime: new Date(currentTime) },
      });
      currentTime = new Date(
        currentTime.getTime() + (avgDuration + BUFFER_MINUTES) * 60 * 1000,
      );
    }
  }
}
