import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BracketGeneratorService } from './services/bracket-generator.service';
import { AreaDistributionService } from './services/area-distribution.service';
import { ScheduleService } from './services/schedule.service';

@Injectable()
export class BracketsService {
  constructor(
    private prisma: PrismaService,
    private generator: BracketGeneratorService,
    private areaDistribution: AreaDistributionService,
    private schedule: ScheduleService,
  ) {}

  async generate(tournamentId: string, promoterId: string, includeUnpaid: boolean) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { categories: true, areas: true },
    });

    if (!tournament) throw new BadRequestException('Tournament not found');
    if (tournament.promoterId !== promoterId) throw new ForbiddenException();
    if (tournament.bracketsGenerated) throw new BadRequestException('Brackets already generated');

    // Delete any existing combats
    await this.prisma.combat.deleteMany({ where: { tournamentId } });

    // Create competition areas if not exist
    if (tournament.areas.length === 0) {
      for (let i = 1; i <= tournament.numAreas; i++) {
        await this.prisma.competitionArea.create({
          data: { tournamentId, name: `Area ${i}`, vestTypes: [] },
        });
      }
    }

    // Generate brackets per category
    for (const category of tournament.categories) {
      await this.generator.generateForCategory(
        tournamentId,
        category.id,
        tournament.drawType,
        includeUnpaid,
      );
    }

    // Distribute combats across areas
    await this.areaDistribution.distribute(tournamentId, tournament.drawType);

    // Calculate schedules
    await this.schedule.calculateSchedules(tournamentId);

    // Mark as generated
    await this.prisma.tournament.update({
      where: { id: tournamentId },
      data: { bracketsGenerated: true },
    });

    return { success: true, message: 'Brackets generated successfully' };
  }

  async getForTournament(tournamentId: string, categoryId?: string): Promise<any[]> {
    return this.prisma.combat.findMany({
      where: { tournamentId, ...(categoryId ? { categoryId } : {}) },
      include: {
        redAthlete: { include: { athlete: { select: { firstName: true, lastName: true } }, club: { select: { name: true } } } },
        blueAthlete: { include: { athlete: { select: { firstName: true, lastName: true } }, club: { select: { name: true } } } },
        winner: { include: { athlete: { select: { firstName: true, lastName: true } } } },
        area: { select: { id: true, name: true } },
        category: { include: { grade: true, gender: true, weightCategory: true } },
      },
      orderBy: [{ roundNumber: 'asc' }, { bracketPosition: 'asc' }],
    });
  }
}
