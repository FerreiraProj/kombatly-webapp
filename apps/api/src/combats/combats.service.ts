import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { ScheduleService } from '../brackets/services/schedule.service';
import { PushService } from '../push/push.service';
import { AddPointDto } from './dto/add-point.dto';
import { UpdateCombatStatusDto } from './dto/update-combat-status.dto';
import { CombatStatus, PointType, RoundType } from '@taekwombats/database';

const POINT_VALUES: Record<PointType, number> = {
  PUNCH_BODY: 1,
  KICK_BODY: 2,
  KICK_HEAD: 3,
  SPIN_KICK_BODY: 4,
  SPIN_KICK_HEAD: 5,
  PENALTY: 1, // penalty gives 1 point to the opponent (handled specially)
};

@Injectable()
export class CombatsService {
  constructor(
    private prisma: PrismaService,
    private events: EventsService,
    private schedule: ScheduleService,
    private push: PushService,
  ) {}

  async getCombat(combatId: string): Promise<any> {
    const combat = await this.prisma.combat.findUnique({
      where: { id: combatId },
      include: this.combatInclude(),
    });
    if (!combat) throw new NotFoundException('Combate não encontrado');
    return combat;
  }

  async updateStatus(combatId: string, dto: UpdateCombatStatusDto): Promise<any> {
    const combat = await this.prisma.combat.findUnique({ where: { id: combatId } });
    if (!combat) throw new NotFoundException('Combate não encontrado');

    if (dto.status === CombatStatus.FINISHED && !dto.winnerId) {
      const redTotal = await this.sumPoints(combatId, combat.redAthleteId ?? '');
      const blueTotal = await this.sumPoints(combatId, combat.blueAthleteId ?? '');
      const autoWinnerId = redTotal >= blueTotal ? combat.redAthleteId : combat.blueAthleteId;
      dto.winnerId = autoWinnerId ?? undefined;
    }

    const updated = await this.prisma.combat.update({
      where: { id: combatId },
      data: {
        status: dto.status,
        ...(dto.status === CombatStatus.IN_PROGRESS && { startTime: new Date() }),
        ...(dto.status === CombatStatus.FINISHED && { endTime: new Date(), winnerId: dto.winnerId }),
      },
      include: this.combatInclude(),
    });

    this.events.emitToTournament(updated.tournamentId, 'combat:updated', updated);
    if (updated.areaId) this.events.emitToArea(updated.areaId, 'combat:updated', updated);

    if (dto.status === CombatStatus.FINISHED) {
      // A.1 — Advance winner to next combat in bracket
      if (dto.winnerId && combat.nextCombatId) {
        const side = (combat.bracketPosition ?? 0) % 2 === 0 ? 'redAthleteId' : 'blueAthleteId';
        const nextCombat = await this.prisma.combat.update({
          where: { id: combat.nextCombatId },
          data: { [side]: dto.winnerId },
          include: this.combatInclude(),
        });
        this.events.emitToTournament(updated.tournamentId, 'combat:updated', nextCombat);
        if (nextCombat.areaId) this.events.emitToArea(nextCombat.areaId, 'combat:updated', nextCombat);

        // C.2 — Notify both athletes when next combat has both sides filled
        if (nextCombat.redAthleteId && nextCombat.blueAthleteId) {
          const areaLabel = nextCombat.area?.name ? ` na ${nextCombat.area.name}` : '';
          const msg = { title: 'Chamado para combate', body: `O seu combate está prestes a começar${areaLabel}.` };
          if (nextCombat.redAthlete?.athlete?.id) this.push.sendToUser(nextCombat.redAthlete.athlete.id, msg);
          if (nextCombat.blueAthlete?.athlete?.id) this.push.sendToUser(nextCombat.blueAthlete.athlete.id, msg);
        }
      }

      // A.2 — Auto-create Bronze/Repechage when both semi-finals finish
      if (combat.roundType === RoundType.SEMI_FINAL) {
        await this.maybeCreateBronzeOrRepechage(combat);
      }

      // A.3 — After Repechage finishes → create Bronze (winner vs Final loser)
      if (combat.roundType === RoundType.REPECHAGE) {
        await this.maybeCreateBronzeAfterRepechage(combat);
      }

      // B.1 — Recalculate remaining schedules for this area
      if (updated.areaId) {
        await this.schedule.recalculateFromNow(updated.areaId, updated.tournamentId);
        const updatedSchedule = await this.prisma.combat.findMany({
          where: { tournamentId: updated.tournamentId, areaId: updated.areaId, status: CombatStatus.SCHEDULED },
          select: { id: true, scheduledTime: true, areaId: true },
        });
        this.events.emitToTournament(updated.tournamentId, 'schedule:updated', updatedSchedule);
      }
    }

    return updated;
  }

  async addPoint(combatId: string, dto: AddPointDto, userId: string): Promise<any> {
    const combat = await this.prisma.combat.findUnique({ where: { id: combatId } });
    if (!combat) throw new NotFoundException('Combate não encontrado');
    if (combat.status !== CombatStatus.IN_PROGRESS) {
      throw new BadRequestException('Combate não está em curso');
    }

    const pointValue = POINT_VALUES[dto.pointType];

    let targetAthleteId = dto.athleteId;
    if (dto.pointType === PointType.PENALTY) {
      targetAthleteId =
        dto.athleteId === combat.redAthleteId ? (combat.blueAthleteId ?? dto.athleteId) : (combat.redAthleteId ?? dto.athleteId);
    }

    await this.prisma.combatPoint.create({
      data: {
        combatId,
        athleteId: targetAthleteId,
        pointType: dto.pointType,
        pointValue,
        roundNumber: dto.roundNumber,
        timestamp: new Date().toISOString(),
        recordedBy: userId,
      },
    });

    const [redScore, blueScore] = await Promise.all([
      this.sumPoints(combatId, combat.redAthleteId ?? ''),
      this.sumPoints(combatId, combat.blueAthleteId ?? ''),
    ]);

    const updated = await this.prisma.combat.update({
      where: { id: combatId },
      data: { redScore, blueScore },
      include: this.combatInclude(),
    });

    this.events.emitToTournament(updated.tournamentId, 'combat:updated', updated);
    if (updated.areaId) this.events.emitToArea(updated.areaId, 'combat:updated', updated);

    return updated;
  }

  async removePoint(combatId: string, pointId: string, userId: string): Promise<any> {
    const point = await this.prisma.combatPoint.findFirst({
      where: { id: pointId, combatId },
    });
    if (!point) throw new NotFoundException('Ponto não encontrado');

    await this.prisma.combatPoint.delete({ where: { id: pointId } });

    const combat = await this.prisma.combat.findUnique({ where: { id: combatId } });
    if (!combat) throw new NotFoundException('Combate não encontrado');

    const [redScore, blueScore] = await Promise.all([
      this.sumPoints(combatId, combat.redAthleteId ?? ''),
      this.sumPoints(combatId, combat.blueAthleteId ?? ''),
    ]);

    const updated = await this.prisma.combat.update({
      where: { id: combatId },
      data: { redScore, blueScore },
      include: this.combatInclude(),
    });

    this.events.emitToTournament(updated.tournamentId, 'combat:updated', updated);
    if (updated.areaId) this.events.emitToArea(updated.areaId, 'combat:updated', updated);

    return updated;
  }

  private async maybeCreateBronzeOrRepechage(finishedSemi: any): Promise<void> {
    const semis = await this.prisma.combat.findMany({
      where: { categoryId: finishedSemi.categoryId, roundType: RoundType.SEMI_FINAL },
      orderBy: { bracketPosition: 'asc' },
    });

    if (semis.length < 2 || !semis.every(s => s.status === CombatStatus.FINISHED)) return;

    const existingBronze = await this.prisma.combat.findFirst({
      where: { categoryId: finishedSemi.categoryId, roundType: { in: [RoundType.BRONZE, RoundType.REPECHAGE] } },
    });
    if (existingBronze) return;

    const losers = semis
      .map(s => (s.redAthleteId === s.winnerId ? s.blueAthleteId : s.redAthleteId))
      .filter((id): id is string => !!id);

    if (losers.length < 2) return;

    const finalCombat = await this.prisma.combat.findFirst({
      where: { categoryId: finishedSemi.categoryId, roundType: RoundType.FINAL },
      include: { category: true },
    });

    const tournament = await this.prisma.tournament.findUnique({ where: { id: finishedSemi.tournamentId } });
    const numAthletes = await this.prisma.tournamentRegistration.count({
      where: { tournamentId: finishedSemi.tournamentId, categoryId: finishedSemi.categoryId },
    });

    const useRepechage = tournament?.hasRepechage && numAthletes >= 8;

    const avgDuration = finalCombat?.category?.avgCombatDuration ?? 6;
    const baseTime = finalCombat?.scheduledTime
      ? new Date(finalCombat.scheduledTime.getTime() + (avgDuration + 2) * 60 * 1000)
      : undefined;

    const maxCombat = await this.prisma.combat.aggregate({
      where: { tournamentId: finishedSemi.tournamentId },
      _max: { combatNumber: true },
    });

    const created = await this.prisma.combat.create({
      data: {
        tournamentId: finishedSemi.tournamentId,
        categoryId: finishedSemi.categoryId,
        areaId: finalCombat?.areaId ?? finishedSemi.areaId,
        combatNumber: (maxCombat._max.combatNumber ?? 0) + 1,
        roundNumber: (finalCombat?.roundNumber ?? finishedSemi.roundNumber) + 1,
        roundType: useRepechage ? RoundType.REPECHAGE : RoundType.BRONZE,
        bracketPosition: 0,
        redAthleteId: losers[0],
        blueAthleteId: losers[1],
        isRepechage: useRepechage,
        ...(baseTime && { scheduledTime: baseTime }),
      },
      include: this.combatInclude(),
    });

    this.events.emitToTournament(finishedSemi.tournamentId, 'combat:updated', created);
    if (created.areaId) this.events.emitToArea(created.areaId, 'combat:updated', created);
  }

  private async maybeCreateBronzeAfterRepechage(finishedRepechage: any): Promise<void> {
    const existingBronze = await this.prisma.combat.findFirst({
      where: { categoryId: finishedRepechage.categoryId, roundType: RoundType.BRONZE },
    });
    if (existingBronze) return;

    const finalCombat = await this.prisma.combat.findFirst({
      where: { categoryId: finishedRepechage.categoryId, roundType: RoundType.FINAL },
      include: { category: true },
    });
    if (!finalCombat || finalCombat.status !== CombatStatus.FINISHED || !finalCombat.winnerId) return;

    const finalLoserId = finalCombat.redAthleteId === finalCombat.winnerId
      ? finalCombat.blueAthleteId
      : finalCombat.redAthleteId;
    if (!finalLoserId || !finishedRepechage.winnerId) return;

    const avgDuration = finalCombat.category?.avgCombatDuration ?? 6;
    const baseTime = finalCombat.scheduledTime
      ? new Date(finalCombat.scheduledTime.getTime() + (avgDuration + 2) * 60 * 1000)
      : undefined;

    const maxCombat = await this.prisma.combat.aggregate({
      where: { tournamentId: finishedRepechage.tournamentId },
      _max: { combatNumber: true },
    });

    const bronze = await this.prisma.combat.create({
      data: {
        tournamentId: finishedRepechage.tournamentId,
        categoryId: finishedRepechage.categoryId,
        areaId: finalCombat.areaId ?? finishedRepechage.areaId,
        combatNumber: (maxCombat._max.combatNumber ?? 0) + 1,
        roundNumber: finalCombat.roundNumber + 1,
        roundType: RoundType.BRONZE,
        bracketPosition: 0,
        redAthleteId: finishedRepechage.winnerId,
        blueAthleteId: finalLoserId,
        isRepechage: false,
        ...(baseTime && { scheduledTime: baseTime }),
      },
      include: this.combatInclude(),
    });

    this.events.emitToTournament(finishedRepechage.tournamentId, 'combat:updated', bronze);
    if (bronze.areaId) this.events.emitToArea(bronze.areaId, 'combat:updated', bronze);
  }

  private async sumPoints(combatId: string, athleteId: string): Promise<number> {
    const result = await this.prisma.combatPoint.aggregate({
      where: { combatId, athleteId },
      _sum: { pointValue: true },
    });
    return result._sum.pointValue ?? 0;
  }

  private combatInclude() {
    return {
      redAthlete: {
        include: { athlete: { select: { id: true, firstName: true, lastName: true } } },
      },
      blueAthlete: {
        include: { athlete: { select: { id: true, firstName: true, lastName: true } } },
      },
      area: { select: { id: true, name: true } },
      category: true,
      points: { orderBy: { recordedAt: 'asc' as const } },
    };
  }
}
