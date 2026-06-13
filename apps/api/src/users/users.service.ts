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

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const hash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
  }
}
