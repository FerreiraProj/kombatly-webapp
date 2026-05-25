import {
  Injectable, BadRequestException, NotFoundException, ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { TournamentStatus } from '@taekwombats/database';

@Injectable()
export class RegistrationsService {
  constructor(private prisma: PrismaService) {}

  async register(dto: CreateRegistrationDto): Promise<any> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: dto.tournamentId },
      include: { categories: true },
    });

    if (!tournament) throw new NotFoundException('Tournament not found');

    if (
      tournament.status !== TournamentStatus.PUBLIC &&
      tournament.status !== TournamentStatus.ONGOING
    ) {
      throw new BadRequestException('Tournament is not open for registration');
    }

    const now = new Date();
    const deadline = new Date(tournament.registrationDeadline);
    deadline.setHours(23, 59, 59, 999);
    if (now > deadline) throw new BadRequestException('Registration deadline has passed');

    // Validate category belongs to tournament
    const category = tournament.categories.find((c) => c.id === dto.categoryId);
    if (!category) throw new BadRequestException('Invalid category for this tournament');

    // Check duplicate
    const existing = await this.prisma.tournamentRegistration.findFirst({
      where: { tournamentId: dto.tournamentId, athleteId: dto.athleteId },
    });
    if (existing) throw new ConflictException('Athlete already registered in this tournament');

    return this.prisma.tournamentRegistration.create({
      data: {
        tournamentId: dto.tournamentId,
        athleteId: dto.athleteId,
        categoryId: dto.categoryId,
        clubId: dto.clubId,
        weight: dto.weight,
        ranking: dto.ranking ?? 0,
      },
      include: {
        athlete: { select: { firstName: true, lastName: true, email: true } },
        category: { include: { grade: true, gender: true, weightCategory: true } },
        club: { select: { name: true, sigla: true } },
      },
    });
  }

  async bulkRegister(registrations: CreateRegistrationDto[]): Promise<any[]> {
    return Promise.all(registrations.map((r) => this.register(r)));
  }

  async cancel(registrationId: string, requesterId: string): Promise<any> {
    const reg = await this.prisma.tournamentRegistration.findUnique({
      where: { id: registrationId },
      include: { tournament: true, invoiceNote: true },
    });

    if (!reg) throw new NotFoundException();
    if (reg.invoiceNote?.status === 'PAID') {
      throw new BadRequestException('Cannot cancel a paid registration');
    }

    return this.prisma.tournamentRegistration.delete({ where: { id: registrationId } });
  }

  async suggestCategory(tournamentId: string, weight: number, gradeId: string, genderId: string): Promise<any> {
    const categories = await this.prisma.tournamentCategory.findMany({
      where: { tournamentId, gradeId, genderId },
      include: { weightCategory: true },
    });

    // Find best matching category by weight
    const sorted = categories
      .filter((c) => c.weightCategory)
      .sort((a, b) => {
        const wA = Number(a.weightCategory!.weightValue);
        const wB = Number(b.weightCategory!.weightValue);
        return wA - wB;
      });

    for (const cat of sorted) {
      const maxW = Number(cat.weightCategory!.weightValue);
      if (weight <= maxW || cat.weightCategory!.symbol === '+') {
        return cat;
      }
    }

    return sorted[sorted.length - 1] ?? null;
  }
}
