import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RegulationsService {
  constructor(private prisma: PrismaService) {}

  async list(language?: string) {
    return this.prisma.regulation.findMany({
      where: {
        isActive: true,
        ...(language && { language }),
      },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, language: true, version: true, createdAt: true },
    });
  }

  async findOne(id: string) {
    const reg = await this.prisma.regulation.findUnique({ where: { id } });
    if (!reg) throw new NotFoundException('Regulamento não encontrado');
    return reg;
  }

  async create(data: { name: string; language: string; content: string; version?: string }) {
    return this.prisma.regulation.create({ data });
  }

  async update(id: string, data: { content?: string; version?: string; isActive?: boolean }) {
    const reg = await this.prisma.regulation.findUnique({ where: { id } });
    if (!reg) throw new NotFoundException('Regulamento não encontrado');
    return this.prisma.regulation.update({ where: { id }, data });
  }
}
