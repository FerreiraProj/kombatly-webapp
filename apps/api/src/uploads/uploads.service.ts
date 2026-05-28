import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UploadsService {
  constructor(private prisma: PrismaService) {}

  private fileUrl(subdir: string, filename: string): string {
    return `/uploads/${subdir}/${filename}`;
  }

  async saveTournamentFlyer(
    tournamentId: string,
    promoterId: string,
    file: Express.Multer.File,
  ): Promise<{ flyerUrl: string }> {
    const tournament = await this.prisma.tournament.findFirst({
      where: { id: tournamentId, promoterId },
    });
    if (!tournament) {
      throw new BadRequestException('Torneio não encontrado ou sem permissão');
    }
    const flyerUrl = this.fileUrl('tournaments', file.filename);
    await this.prisma.tournament.update({ where: { id: tournamentId }, data: { flyerUrl } });
    return { flyerUrl };
  }

  async saveClubLogo(
    clubId: string,
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ logoUrl: string }> {
    const club = await this.prisma.club.findFirst({ where: { id: clubId, userId } });
    if (!club) {
      throw new BadRequestException('Clube não encontrado ou sem permissão');
    }
    const logoUrl = this.fileUrl('clubs', file.filename);
    await this.prisma.club.update({ where: { id: clubId }, data: { logoUrl } });
    return { logoUrl };
  }
}
