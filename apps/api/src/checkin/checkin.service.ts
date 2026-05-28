import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';

@Injectable()
export class CheckinService {
  constructor(
    private prisma: PrismaService,
    private events: EventsService,
  ) {}

  async checkin(
    tournamentId: string,
    registrationId: string,
    userId: string,
    dto: CreateCheckinDto,
  ): Promise<any> {
    const registration = await this.prisma.tournamentRegistration.findFirst({
      where: { id: registrationId, tournamentId },
    });
    if (!registration) throw new NotFoundException('Inscrição não encontrada');

    const existing = await this.prisma.athleteCheckin.findUnique({
      where: { registrationId },
    });

    let checkin;
    if (existing) {
      checkin = await this.prisma.athleteCheckin.update({
        where: { registrationId },
        data: {
          ...(dto.actualWeight !== undefined && { actualWeight: dto.actualWeight }),
          ...(dto.athleteCardNumber !== undefined && { athleteCardNumber: dto.athleteCardNumber }),
          ...(dto.medicalCertificate !== undefined && { medicalCertificate: dto.medicalCertificate }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
        },
        include: this.checkinInclude(),
      });
    } else {
      checkin = await this.prisma.athleteCheckin.create({
        data: {
          tournamentId,
          registrationId,
          checkedInBy: userId,
          actualWeight: dto.actualWeight,
          athleteCardNumber: dto.athleteCardNumber,
          medicalCertificate: dto.medicalCertificate ?? false,
          notes: dto.notes,
        },
        include: this.checkinInclude(),
      });
    }

    this.events.emitToTournament(tournamentId, 'checkin:updated', checkin);
    return checkin;
  }

  async approveWeight(checkinId: string, tournamentId: string, userId: string): Promise<any> {
    const checkin = await this.prisma.athleteCheckin.findFirst({
      where: { id: checkinId, tournamentId },
    });
    if (!checkin) throw new NotFoundException('Check-in não encontrado');
    if (!checkin.actualWeight) throw new BadRequestException('Peso não registado');

    const updated = await this.prisma.athleteCheckin.update({
      where: { id: checkinId },
      data: {
        weightVerified: true,
        weightVerifiedBy: userId,
        weightVerifiedAt: new Date(),
      },
      include: this.checkinInclude(),
    });

    this.events.emitToTournament(tournamentId, 'checkin:updated', updated);
    return updated;
  }

  async verifyDocuments(checkinId: string, tournamentId: string, userId: string): Promise<any> {
    const checkin = await this.prisma.athleteCheckin.findFirst({
      where: { id: checkinId, tournamentId },
    });
    if (!checkin) throw new NotFoundException('Check-in não encontrado');

    const updated = await this.prisma.athleteCheckin.update({
      where: { id: checkinId },
      data: {
        documentsChecked: true,
        documentsVerifiedBy: userId,
        documentsVerifiedAt: new Date(),
      },
      include: this.checkinInclude(),
    });

    this.events.emitToTournament(tournamentId, 'checkin:updated', updated);
    return updated;
  }

  async listCheckins(tournamentId: string, categoryId?: string): Promise<any> {
    return this.prisma.athleteCheckin.findMany({
      where: {
        tournamentId,
        ...(categoryId && { registration: { categoryId } }),
      },
      include: {
        ...this.checkinInclude(),
        registration: {
          include: {
            athlete: { select: { id: true, firstName: true, lastName: true } },
            category: true,
            club: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { checkedInAt: 'asc' },
    });
  }

  private checkinInclude() {
    return {
      registration: {
        include: {
          athlete: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    };
  }
}
