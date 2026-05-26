import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const rawKey = request.headers['x-api-key'] as string | undefined;
    if (!rawKey) return false;

    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      include: { user: { select: { id: true, email: true, role: true, isActive: true } } },
    });

    if (!apiKey || !apiKey.isActive) return false;
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return false;
    if (!apiKey.user.isActive) return false;

    // Fire-and-forget last used update
    this.prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

    request.user = { id: apiKey.user.id, email: apiKey.user.email, role: apiKey.user.role };
    return true;
  }
}
