import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtOrApiKeyGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers['authorization'] as string | undefined;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const payload = this.jwt.verify<{ sub: string; email: string; role: string }>(token, {
          secret: this.config.get('JWT_ACCESS_SECRET'),
        });
        request.user = { id: payload.sub, email: payload.email, role: payload.role };
        return true;
      } catch {
        throw new UnauthorizedException('Invalid or expired token');
      }
    }

    const rawKey = request.headers['x-api-key'] as string | undefined;
    if (rawKey) {
      const keyHash = createHash('sha256').update(rawKey).digest('hex');
      const apiKey = await this.prisma.apiKey.findUnique({
        where: { keyHash },
        include: { user: { select: { id: true, email: true, role: true, isActive: true } } },
      });

      if (!apiKey || !apiKey.isActive) throw new UnauthorizedException('Invalid API key');
      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) throw new UnauthorizedException('API key expired');
      if (!apiKey.user.isActive) throw new UnauthorizedException();

      this.prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
      request.user = { id: apiKey.user.id, email: apiKey.user.email, role: apiKey.user.role };
      return true;
    }

    throw new UnauthorizedException();
  }
}
