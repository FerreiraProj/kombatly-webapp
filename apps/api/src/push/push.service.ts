import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as webPush from 'web-push';

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private enabled = false;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  onModuleInit() {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.config.get<string>('VAPID_SUBJECT') ?? 'mailto:admin@kombatlypro.com';

    if (publicKey && privateKey) {
      webPush.setVapidDetails(subject, publicKey, privateKey);
      this.enabled = true;
    } else {
      this.logger.warn('VAPID keys not configured — push notifications disabled');
    }
  }

  async subscribe(userId: string, subscription: object): Promise<void> {
    const existing = await this.prisma.pushSubscription.findFirst({ where: { userId } });
    if (existing) {
      await this.prisma.pushSubscription.update({ where: { id: existing.id }, data: { subscription } });
    } else {
      await this.prisma.pushSubscription.create({ data: { userId, subscription } });
    }
  }

  async unsubscribe(userId: string): Promise<void> {
    await this.prisma.pushSubscription.deleteMany({ where: { userId } });
  }

  async sendToUser(userId: string, payload: { title: string; body: string; data?: object }): Promise<void> {
    if (!this.enabled) return;

    const sub = await this.prisma.pushSubscription.findFirst({ where: { userId } });
    if (!sub) return;

    try {
      await webPush.sendNotification(
        sub.subscription as unknown as webPush.PushSubscription,
        JSON.stringify({ title: payload.title, body: payload.body, data: payload.data ?? {} }),
      );
    } catch (err: any) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await this.prisma.pushSubscription.deleteMany({ where: { userId } });
      } else {
        this.logger.warn(`Push failed for user ${userId}: ${err.message}`);
      }
    }
  }

  getVapidPublicKey(): string {
    return this.config.get<string>('VAPID_PUBLIC_KEY') ?? '';
  }
}
