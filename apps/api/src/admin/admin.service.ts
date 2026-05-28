import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@taekwombats/database';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getUsers(page = 1, limit = 20, search?: string, role?: UserRole): Promise<any> {
    const skip = (page - 1) * limit;
    const where = {
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(role && { role }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          emailVerifiedAt: true,
          createdAt: true,
          _count: { select: { promotedTournaments: true, apiKeys: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async updateUser(id: string, data: { isActive?: boolean; role?: UserRole }): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilizador não encontrado');
    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, role: true, isActive: true },
    });
  }

  async getTournaments(page = 1, limit = 20): Promise<any> {
    const skip = (page - 1) * limit;
    const [tournaments, total] = await Promise.all([
      this.prisma.tournament.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          promoter: { select: { id: true, email: true, firstName: true, lastName: true } },
          _count: { select: { registrations: true } },
        },
      }),
      this.prisma.tournament.count(),
    ]);
    return { tournaments, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getStats(): Promise<any> {
    const [
      totalUsers,
      usersByRole,
      totalTournaments,
      tournamentsByStatus,
      totalRegistrations,
      paidRegistrations,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.groupBy({ by: ['role'], _count: true }),
      this.prisma.tournament.count(),
      this.prisma.tournament.groupBy({ by: ['status'], _count: true }),
      this.prisma.tournamentRegistration.count(),
      this.prisma.tournamentRegistration.count({ where: { isPaid: true } }),
    ]);

    return {
      users: {
        total: totalUsers,
        byRole: usersByRole.reduce((acc, r) => ({ ...acc, [r.role]: r._count }), {} as Record<string, number>),
      },
      tournaments: {
        total: totalTournaments,
        byStatus: tournamentsByStatus.reduce((acc, r) => ({ ...acc, [r.status]: r._count }), {} as Record<string, number>),
      },
      registrations: { total: totalRegistrations, paid: paidRegistrations },
    };
  }

  async getPlatformPayments(from?: string, to?: string): Promise<any> {
    const where: any = {};
    if (from || to) {
      where.createdAt = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      };
    }
    return this.prisma.platformPayment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        promoter: { select: { id: true, email: true, firstName: true, lastName: true } },
        tournament: { select: { id: true, name: true } },
      },
    });
  }

  async getPlatformSettings(): Promise<any> {
    let settings = await this.prisma.platformSettings.findFirst();
    if (!settings) {
      settings = await this.prisma.platformSettings.create({ data: {} });
    }
    return settings;
  }

  async updatePlatformSettings(data: {
    costPerAthlete?: number;
    platformEmail?: string;
    platformName?: string;
  }): Promise<any> {
    const settings = await this.getPlatformSettings();
    return this.prisma.platformSettings.update({
      where: { id: settings.id },
      data,
    });
  }

  async getFinancialReport(from?: string, to?: string): Promise<any> {
    const where: any = {};
    if (from || to) {
      where.createdAt = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      };
    }

    const [payments, byTournament] = await Promise.all([
      this.prisma.platformPayment.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        include: {
          promoter: { select: { id: true, email: true, firstName: true, lastName: true } },
          tournament: { select: { id: true, name: true } },
        },
      }),
      this.prisma.platformPayment.groupBy({
        by: ['tournamentId'],
        where,
        _sum: { finalAmount: true },
        _count: true,
        orderBy: { tournamentId: 'asc' },
        take: 10,
      }),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.finalAmount), 0);

    // Group by month for chart data
    const byMonth: Record<string, number> = {};
    for (const p of payments) {
      const month = p.createdAt.toISOString().slice(0, 7);
      byMonth[month] = (byMonth[month] ?? 0) + Number(p.finalAmount);
    }

    return {
      totalRevenue,
      paymentCount: payments.length,
      payments,
      byMonth: Object.entries(byMonth).map(([month, revenue]) => ({ month, revenue })),
      topTournaments: byTournament,
    };
  }

  async exportFinancialCsv(from?: string, to?: string): Promise<string> {
    const where: any = {};
    if (from || to) {
      where.createdAt = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      };
    }

    const payments = await this.prisma.platformPayment.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        promoter: { select: { email: true, firstName: true, lastName: true } },
        tournament: { select: { name: true } },
      },
    });

    const lines = [
      'Date,Tournament,Promoter,Amount,Athletes',
      ...payments.map((p) =>
        [
          p.createdAt.toISOString().slice(0, 10),
          `"${p.tournament?.name ?? ''}"`,
          `"${p.promoter.firstName} ${p.promoter.lastName}"`,
          Number(p.finalAmount).toFixed(2),
          p.numAthletes ?? '',
        ].join(','),
      ),
    ];

    return lines.join('\n');
  }
}
