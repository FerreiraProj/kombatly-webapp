import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { CreateAthleteDto } from './dto/create-athlete.dto';
import { UserRole } from '@taekwombats/database';

@Injectable()
export class ClubsService {
  constructor(private prisma: PrismaService) {}

  async createClub(userId: string, dto: CreateClubDto) {
    const existing = await this.prisma.club.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('User already has a club');
    return this.prisma.club.create({ data: { userId, ...dto } });
  }

  async getMyClub(userId: string) {
    const club = await this.prisma.club.findUnique({
      where: { userId },
      include: { _count: { select: { registrations: true } } },
    });
    if (!club) throw new NotFoundException('Club not found');
    return club;
  }

  async getClub(clubId: string) {
    const club = await this.prisma.club.findUnique({ where: { id: clubId } });
    if (!club) throw new NotFoundException();
    return club;
  }

  async updateClub(userId: string, clubId: string, dto: UpdateClubDto) {
    const club = await this.prisma.club.findUnique({ where: { id: clubId } });
    if (!club) throw new NotFoundException();
    if (club.userId !== userId) throw new ForbiddenException();
    return this.prisma.club.update({ where: { id: clubId }, data: dto });
  }

  // ── Athletes ──────────────────────────────────────────────────────────────

  async getAthletes(userId: string) {
    const club = await this.prisma.club.findUnique({ where: { userId } });
    if (!club) return [];

    return this.prisma.user.findMany({
      where: { role: UserRole.ATHLETE, athleteRegistrations: { some: { clubId: club.id } } },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, createdAt: true },
    });
  }

  async createAthlete(clubUserId: string, dto: CreateAthleteDto) {
    const club = await this.prisma.club.findUnique({ where: { userId: clubUserId } });
    if (!club) throw new NotFoundException('Club not found');

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) return existing;

    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(Math.random().toString(36).slice(-10), 10);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: UserRole.ATHLETE,
        emailVerifiedAt: new Date(),
      },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, createdAt: true },
    });
  }

  async getClubStats(clubId: string): Promise<any> {
    const club = await this.prisma.club.findUnique({ where: { id: clubId } });
    if (!club) throw new NotFoundException('Clube não encontrado');

    const [totalAthletes, totalRegistrations, tournamentIds, wins] = await Promise.all([
      this.prisma.tournamentRegistration.findMany({
        where: { clubId },
        distinct: ['athleteId'],
        select: { athleteId: true },
      }).then((r) => r.length),
      this.prisma.tournamentRegistration.count({ where: { clubId } }),
      this.prisma.tournamentRegistration.findMany({
        where: { clubId },
        distinct: ['tournamentId'],
        select: { tournamentId: true },
      }).then((r) => r.length),
      this.prisma.combat.count({
        where: { winner: { clubId } },
      }),
    ]);

    return { totalAthletes, totalRegistrations, tournaments: tournamentIds, wins };
  }

  async listPublicClubs(search?: string) {
    return this.prisma.club.findMany({
      where: search ? { name: { contains: search, mode: 'insensitive' } } : undefined,
      select: { id: true, name: true, sigla: true, logoUrl: true, city: true, country: true },
      take: 50,
      orderBy: { name: 'asc' },
    });
  }
}
