import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RefereeRole } from '@taekwombats/database';

@Injectable()
export class RefereesService {
  constructor(private prisma: PrismaService) {}

  async assignToCombat(combatId: string, refereeId: string, role: RefereeRole) {
    const combat = await this.prisma.combat.findUnique({ where: { id: combatId } });
    if (!combat) throw new NotFoundException('Combate não encontrado');

    const referee = await this.prisma.user.findUnique({ where: { id: refereeId } });
    if (!referee) throw new NotFoundException('Árbitro não encontrado');

    try {
      return await this.prisma.combatReferee.create({
        data: { combatId, refereeId, role },
        include: {
          referee: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });
    } catch {
      throw new ConflictException('Árbitro já atribuído a este combate');
    }
  }

  async getCombatReferees(combatId: string) {
    return this.prisma.combatReferee.findMany({
      where: { combatId },
      include: {
        referee: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async removeFromCombat(combatId: string, refereeId: string) {
    const record = await this.prisma.combatReferee.findUnique({
      where: { combatId_refereeId: { combatId, refereeId } },
    });
    if (!record) throw new NotFoundException('Atribuição não encontrada');
    await this.prisma.combatReferee.delete({
      where: { combatId_refereeId: { combatId, refereeId } },
    });
    return { message: 'Árbitro removido do combate' };
  }

  async listRefereeUsers(search?: string) {
    return this.prisma.user.findMany({
      where: {
        role: 'REFEREE',
        isActive: true,
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      select: { id: true, firstName: true, lastName: true, email: true },
      take: 50,
    });
  }
}
