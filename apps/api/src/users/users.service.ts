import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async updateProfile(userId: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<any> {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, role: true, emailVerifiedAt: true,
      },
    });
  }

  async getAthleteProfile(athleteId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: athleteId },
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
    });
    if (!user) throw new NotFoundException('Athlete not found');

    const registrations = await this.prisma.tournamentRegistration.findMany({
      where: { athleteId },
      include: {
        tournament: { select: { id: true, name: true, startDate: true, status: true, slug: true } },
        category: {
          include: {
            grade: { select: { nameEn: true } },
            gender: { select: { code: true } },
            weightCategory: { select: { strWeight: true, displayNameEn: true } },
          },
        },
        wonCombats: { select: { id: true } },
        redCombats: { select: { id: true, status: true } },
        blueCombats: { select: { id: true, status: true } },
      },
      orderBy: { tournament: { startDate: 'desc' } },
    });

    return { user, registrations };
  }

  async getAthleteStats(athleteId: string): Promise<any> {
    const registrations = await this.prisma.tournamentRegistration.findMany({
      where: { athleteId },
      select: {
        id: true,
        tournamentId: true,
        redCombats: { select: { id: true, status: true, winnerId: true } },
        blueCombats: { select: { id: true, status: true, winnerId: true } },
        wonCombats: { select: { id: true } },
        combatPoints: { select: { pointValue: true } },
      },
    });

    const tournamentIds = [...new Set(registrations.map((r) => r.tournamentId))];
    let totalCombats = 0;
    let wins = 0;

    for (const reg of registrations) {
      const allCombats = [...reg.redCombats, ...reg.blueCombats];
      const finished = allCombats.filter((c) => c.status === 'FINISHED');
      totalCombats += finished.length;
      wins += reg.wonCombats.length;
    }

    const totalPoints = registrations.reduce(
      (sum, reg) => sum + reg.combatPoints.reduce((s, p) => s + (p.pointValue ?? 0), 0),
      0,
    );

    return {
      tournaments: tournamentIds.length,
      combats: totalCombats,
      wins,
      losses: totalCombats - wins,
      winRate: totalCombats > 0 ? Math.round((wins / totalCombats) * 100) : 0,
      totalPoints,
    };
  }

  async getGlobalRankings(filters: { gradeId?: string; genderId?: string; limit?: number }): Promise<any[]> {
    const limit = Math.min(filters.limit ?? 50, 200);

    const registrations = await this.prisma.tournamentRegistration.findMany({
      where: {
        isPaid: true,
        ...(filters.gradeId ? { category: { gradeId: filters.gradeId } } : {}),
        ...(filters.genderId ? { category: { genderId: filters.genderId } } : {}),
      },
      select: {
        athleteId: true,
        athlete: { select: { id: true, firstName: true, lastName: true } },
        club: { select: { name: true, sigla: true } },
        wonCombats: { select: { id: true } },
        redCombats: { select: { id: true, status: true } },
        blueCombats: { select: { id: true, status: true } },
        combatPoints: { select: { pointValue: true } },
        tournamentId: true,
      },
    });

    const byAthlete = new Map<string, {
      athlete: { id: string; firstName: string; lastName: string };
      club?: { name: string; sigla?: string };
      wins: number; combats: number; totalPoints: number; tournaments: Set<string>;
    }>();

    for (const reg of registrations) {
      if (!reg.athlete) continue;
      const key = reg.athleteId;
      if (!byAthlete.has(key)) {
        byAthlete.set(key, {
          athlete: reg.athlete,
          club: reg.club ? { name: reg.club.name, sigla: reg.club.sigla ?? undefined } : undefined,
          wins: 0, combats: 0, totalPoints: 0, tournaments: new Set(),
        });
      }
      const entry = byAthlete.get(key)!;
      const finished = [...reg.redCombats, ...reg.blueCombats].filter((c) => c.status === 'FINISHED');
      entry.combats += finished.length;
      entry.wins += reg.wonCombats.length;
      entry.totalPoints += reg.combatPoints.reduce((s, p) => s + (p.pointValue ?? 0), 0);
      entry.tournaments.add(reg.tournamentId);
    }

    const rankings = [...byAthlete.values()]
      .filter((e) => e.combats > 0)
      .map((e) => ({
        athleteId: e.athlete.id,
        firstName: e.athlete.firstName,
        lastName: e.athlete.lastName,
        club: e.club,
        tournaments: e.tournaments.size,
        combats: e.combats,
        wins: e.wins,
        losses: e.combats - e.wins,
        winRate: Math.round((e.wins / e.combats) * 100),
        totalPoints: e.totalPoints,
      }))
      .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate || b.totalPoints - a.totalPoints)
      .slice(0, limit)
      .map((e, i) => ({ rank: i + 1, ...e }));

    return rankings;
  }

  async getReferralSummary(userId: string): Promise<{ balance: number; history: any[] }> {
    const points = await this.prisma.referralPoint.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        referrer: { select: { firstName: true, lastName: true } },
      },
    });

    const balance = points
      .filter((p) => !p.usedForDiscount)
      .reduce((sum, p) => sum + p.points, 0);

    return {
      balance,
      history: points.map((p) => ({
        id: p.id,
        points: p.points,
        reason: p.reason,
        usedForDiscount: p.usedForDiscount,
        discountAppliedAt: p.discountAppliedAt,
        createdAt: p.createdAt,
        referrer: p.referrer ? `${p.referrer.firstName} ${p.referrer.lastName}` : null,
      })),
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const hash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
  }
}
