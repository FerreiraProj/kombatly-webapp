import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { TournamentStatus, RoundType, CombatStatus, PlatformPaymentStatus } from '@taekwombats/database';
import slugify from 'slugify';

@Injectable()
export class TournamentsService {
  constructor(private prisma: PrismaService) {}

  async create(promoterId: string, dto: CreateTournamentDto): Promise<any> {
    const baseSlug = slugify(dto.name, { lower: true, strict: true });
    const slug = `${baseSlug}-${Date.now()}`;

    const { categoryIds, ...rest } = dto;

    const tournament = await this.prisma.tournament.create({
      data: {
        ...rest,
        promoterId,
        slug,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        registrationDeadline: new Date(dto.registrationDeadline),
        startTime: new Date(`1970-01-01T${dto.startTime}:00Z`),
        status: TournamentStatus.PRIVATE,
      },
    });

    if (categoryIds?.length) {
      await this.addCategories(tournament.id, categoryIds);
    }

    return tournament;
  }

  async findPublicEvents(filters: {
    country?: string;
    status?: 'upcoming' | 'live' | 'past' | 'all';
    search?: string;
    page?: number;
  }): Promise<{ data: any[]; total: number; page: number; pages: number }> {
    const PAGE_SIZE = 20;
    const page = Math.max(1, filters.page ?? 1);
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    let statusFilter: any;
    switch (filters.status) {
      case 'upcoming': statusFilter = { status: TournamentStatus.PUBLIC, startDate: { gte: now } }; break;
      case 'live':     statusFilter = { status: TournamentStatus.ONGOING }; break;
      case 'past':     statusFilter = { status: TournamentStatus.FINISHED, startDate: { gte: ninetyDaysAgo } }; break;
      default:         statusFilter = { status: { in: [TournamentStatus.PUBLIC, TournamentStatus.ONGOING] } };
    }

    const where: any = {
      ...statusFilter,
      ...(filters.country ? { country: { equals: filters.country, mode: 'insensitive' } } : {}),
      ...(filters.search ? {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { city: { contains: filters.search, mode: 'insensitive' } },
          { venue: { contains: filters.search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const orderBy = filters.status === 'past' ? { startDate: 'desc' as const } : { startDate: 'asc' as const };

    const [total, data] = await Promise.all([
      this.prisma.tournament.count({ where }),
      this.prisma.tournament.findMany({
        where,
        orderBy,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          _count: { select: { registrations: true, categories: true } },
          promoter: {
            select: {
              firstName: true,
              lastName: true,
              club: { select: { name: true, city: true, country: true } },
            },
          },
        },
      }),
    ]);

    return { data, total, page, pages: Math.ceil(total / PAGE_SIZE) };
  }

  async findAll(promoterId?: string, status?: TournamentStatus): Promise<any[]> {
    return this.prisma.tournament.findMany({
      where: {
        ...(promoterId ? { promoterId } : { status: TournamentStatus.PUBLIC }),
        ...(status ? { status } : {}),
      },
      include: {
        _count: { select: { registrations: true, categories: true } },
        promoter: { select: { firstName: true, lastName: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(id: string, requesterId?: string): Promise<any> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: {
        promoter: { select: { id: true, firstName: true, lastName: true } },
        categories: {
          include: {
            grade: true,
            gender: true,
            weightCategory: true,
            _count: { select: { registrations: true } },
          },
        },
        _count: { select: { registrations: true } },
      },
    });

    if (!tournament) throw new NotFoundException('Tournament not found');

    if (
      tournament.status === TournamentStatus.PRIVATE &&
      tournament.promoterId !== requesterId
    ) {
      throw new ForbiddenException('This tournament is private');
    }

    return tournament;
  }

  async findBySlug(slug: string): Promise<any> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { slug },
      include: {
        promoter: { select: { firstName: true, lastName: true } },
        categories: { include: { grade: true, gender: true, weightCategory: true } },
        areas: true,
      },
    });
    if (!tournament) throw new NotFoundException();
    return tournament;
  }

  async update(promoterId: string, id: string, dto: UpdateTournamentDto): Promise<any> {
    const tournament = await this.findOwned(id, promoterId);

    if (
      tournament.status === TournamentStatus.ONGOING &&
      dto.status !== TournamentStatus.FINISHED
    ) {
      throw new BadRequestException('Cannot edit an ongoing tournament');
    }

    const { categoryIds, ...rest } = dto;

    return this.prisma.tournament.update({
      where: { id },
      data: {
        ...rest,
        ...(rest.startDate ? { startDate: new Date(rest.startDate) } : {}),
        ...(rest.endDate ? { endDate: new Date(rest.endDate) } : {}),
        ...(rest.registrationDeadline
          ? { registrationDeadline: new Date(rest.registrationDeadline) }
          : {}),
        ...(rest.startTime ? { startTime: new Date(`1970-01-01T${rest.startTime}:00Z`) } : {}),
      },
    });
  }

  async setStatus(promoterId: string, id: string, status: TournamentStatus): Promise<any> {
    const tournament = await this.findOwned(id, promoterId);
    const updated = await this.prisma.tournament.update({ where: { id }, data: { status } });

    if (status === TournamentStatus.FINISHED && !tournament.platformPaymentId) {
      await this.createPlatformPayment(id, promoterId);
    }

    return updated;
  }

  async remove(promoterId: string, id: string): Promise<any> {
    const t = await this.findOwned(id, promoterId);
    if (t.status === TournamentStatus.ONGOING) {
      throw new BadRequestException('Cannot delete an ongoing tournament');
    }
    return this.prisma.tournament.delete({ where: { id } });
  }

  // ── Categories ───────────────────────────────────────────────────────────

  async getStandardCategories(): Promise<any[]> {
    return this.prisma.weightCategory.findMany({
      where: { isOfficial: true },
      include: { grade: true, gender: true },
      orderBy: [{ grade: { displayOrder: 'asc' } }, { gender: { code: 'asc' } }, { displayOrder: 'asc' }],
    });
  }

  async getGrades(): Promise<any[]> {
    return this.prisma.grade.findMany({ orderBy: { displayOrder: 'asc' } });
  }

  async addCategories(tournamentId: string, weightCategoryIds: string[]): Promise<any> {
    const weightCategories = await this.prisma.weightCategory.findMany({
      where: { id: { in: weightCategoryIds } },
    });

    return this.prisma.tournamentCategory.createMany({
      data: weightCategories.map((wc) => ({
        tournamentId,
        weightCategoryId: wc.id,
        gradeId: wc.gradeId,
        genderId: wc.genderId,
        vestType: wc.vestType,
      })),
      skipDuplicates: true,
    });
  }

  async addCustomCategory(
    promoterId: string,
    tournamentId: string,
    data: {
      customName: string;
      vestType: number;
      minWeight?: number;
      maxWeight?: number;
      avgCombatDuration?: number;
      gradeId?: string;
      genderId?: string;
    },
  ): Promise<any> {
    await this.findOwned(tournamentId, promoterId);
    return this.prisma.tournamentCategory.create({
      data: { tournamentId, isCustom: true, ...data },
    });
  }

  async removeCategory(promoterId: string, tournamentId: string, categoryId: string): Promise<any> {
    await this.findOwned(tournamentId, promoterId);
    return this.prisma.tournamentCategory.delete({ where: { id: categoryId } });
  }

  // ── Registrations summary ─────────────────────────────────────────────────

  async getRegistrations(promoterId: string, tournamentId: string, filters?: {
    categoryId?: string;
    isPaid?: boolean;
    checkedIn?: boolean;
  }): Promise<any[]> {
    await this.findOwned(tournamentId, promoterId);

    return this.prisma.tournamentRegistration.findMany({
      where: {
        tournamentId,
        ...(filters?.categoryId ? { categoryId: filters.categoryId } : {}),
        ...(filters?.isPaid !== undefined ? { isPaid: filters.isPaid } : {}),
        ...(filters?.checkedIn !== undefined ? { checkedIn: filters.checkedIn } : {}),
      },
      include: {
        athlete: { select: { firstName: true, lastName: true, email: true } },
        club: { select: { name: true, sigla: true } },
        category: { include: { grade: true, gender: true, weightCategory: true } },
        invoiceNote: { select: { id: true, status: true, totalAmount: true } },
      },
      orderBy: [{ category: { grade: { displayOrder: 'asc' } } }, { athlete: { lastName: 'asc' } }],
    });
  }

  // ── Medalists ─────────────────────────────────────────────────────────────

  async getMedalists(tournamentId: string): Promise<any[]> {
    const tournament = await this.prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) throw new NotFoundException('Tournament not found');

    const combats = await this.prisma.combat.findMany({
      where: {
        tournamentId,
        status: CombatStatus.FINISHED,
        roundType: { in: [RoundType.FINAL, RoundType.BRONZE] },
      },
      include: {
        category: { include: { grade: true, gender: true, weightCategory: true } },
        redAthlete: {
          include: {
            athlete: { select: { id: true, firstName: true, lastName: true } },
            club: { select: { name: true } },
          },
        },
        blueAthlete: {
          include: {
            athlete: { select: { id: true, firstName: true, lastName: true } },
            club: { select: { name: true } },
          },
        },
      },
    });

    const byCategory = new Map<string, { final?: any; bronze?: any }>();
    for (const combat of combats) {
      if (!byCategory.has(combat.categoryId)) byCategory.set(combat.categoryId, {});
      const entry = byCategory.get(combat.categoryId)!;
      if (combat.roundType === RoundType.FINAL) entry.final = combat;
      if (combat.roundType === RoundType.BRONZE) entry.bronze = combat;
    }

    return Array.from(byCategory.entries()).map(([categoryId, { final, bronze }]) => {
      const category = final?.category ?? bronze?.category;
      let gold = null;
      let silver = null;
      let bronzeMedalist = null;

      if (final?.winnerId) {
        const redWon = final.redAthleteId === final.winnerId;
        gold = redWon ? final.redAthlete : final.blueAthlete;
        silver = redWon ? final.blueAthlete : final.redAthlete;
      }

      if (bronze?.winnerId) {
        const redWon = bronze.redAthleteId === bronze.winnerId;
        bronzeMedalist = redWon ? bronze.redAthlete : bronze.blueAthlete;
      }

      return {
        categoryId,
        categoryLabel: this.buildCategoryLabel(category),
        gold,
        silver,
        bronze: bronzeMedalist,
      };
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async createPlatformPayment(tournamentId: string, promoterId: string): Promise<void> {
    const existing = await this.prisma.platformPayment.findUnique({ where: { tournamentId } });
    if (existing) return;

    const numAthletes = await this.prisma.tournamentRegistration.count({
      where: { tournamentId, isPaid: true },
    });

    const settings = await this.prisma.platformSettings.findFirst();
    const costPerAthlete = Number(settings?.costPerAthlete ?? 2.5);
    const totalAmount = costPerAthlete * numAthletes;

    const payment = await this.prisma.platformPayment.create({
      data: {
        tournamentId,
        promoterId,
        numAthletes,
        totalAmount,
        finalAmount: totalAmount,
        status: PlatformPaymentStatus.PENDING,
      },
    });

    await this.prisma.tournament.update({
      where: { id: tournamentId },
      data: { platformPaymentId: payment.id },
    });
  }

  private buildCategoryLabel(category: any): string {
    if (!category) return '';
    if (category.isCustom && category.customName) return category.customName;
    return [
      category.grade?.nameEn,
      category.gender?.nameEn,
      category.weightCategory?.displayNameEn,
    ].filter(Boolean).join(' · ');
  }

  private async findOwned(id: string, promoterId: string) {
    const tournament = await this.prisma.tournament.findUnique({ where: { id } });
    if (!tournament) throw new NotFoundException('Tournament not found');
    if (tournament.promoterId !== promoterId) throw new ForbiddenException();
    return tournament;
  }
}
