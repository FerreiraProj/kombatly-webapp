import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProtestStatus } from '@taekwombats/database';

@Injectable()
export class ProtestsService {
  constructor(private prisma: PrismaService) {}

  async file(combatId: string, userId: string, reason: string): Promise<any> {
    const combat = await this.prisma.combat.findUnique({ where: { id: combatId } });
    if (!combat) throw new NotFoundException('Combate não encontrado');

    const existing = await this.prisma.protest.findUnique({ where: { combatId } });
    if (existing) throw new BadRequestException('Já existe um protesto para este combate');

    const protest = await this.prisma.protest.create({
      data: { combatId, filedBy: userId, reason },
    });

    await this.prisma.combat.update({
      where: { id: combatId },
      data: { protestFiled: true },
    });

    return protest;
  }

  async listForTournament(tournamentId: string): Promise<any> {
    return this.prisma.protest.findMany({
      where: { combat: { tournamentId } },
      include: {
        combat: {
          include: {
            redAthlete: { include: { athlete: { select: { id: true, firstName: true, lastName: true } } } },
            blueAthlete: { include: { athlete: { select: { id: true, firstName: true, lastName: true } } } },
          },
        },
        filedByUser: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { filedAt: 'desc' },
    });
  }

  async resolve(protestId: string, userId: string, data: { status: ProtestStatus; decision?: string }): Promise<any> {
    const protest = await this.prisma.protest.findUnique({ where: { id: protestId } });
    if (!protest) throw new NotFoundException('Protesto não encontrado');
    if (protest.status !== ProtestStatus.PENDING && protest.status !== ProtestStatus.UNDER_REVIEW) {
      throw new BadRequestException('Protesto já resolvido');
    }

    return this.prisma.protest.update({
      where: { id: protestId },
      data: {
        status: data.status,
        decision: data.decision,
        decidedBy: userId,
        decidedAt: new Date(),
      },
    });
  }
}
