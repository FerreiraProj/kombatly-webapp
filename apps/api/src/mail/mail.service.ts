import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get('MAIL_HOST', 'smtp.example.com'),
      port: config.get<number>('MAIL_PORT', 587),
      secure: config.get('MAIL_PORT', '587') === '465',
      auth: {
        user: config.get('MAIL_USER'),
        pass: config.get('MAIL_PASS'),
      },
    });
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    const link = `${frontendUrl}/reset-password?token=${token}`;
    await this.send({
      to: email,
      subject: 'Recuperação de password — Kombatly',
      html: `
        <p>Recebemos um pedido para redefinir a sua password.</p>
        <p>Clique no link abaixo para criar uma nova password. O link expira em 1 hora.</p>
        <p><a href="${link}" style="padding:12px 24px;background:#ef4444;color:#fff;border-radius:6px;text-decoration:none">Redefinir password</a></p>
        <p>Se não solicitou este pedido, ignore este email.</p>
      `,
    });
  }

  async sendTournamentInvite(to: string, tournamentName: string, slug: string, deadline: string): Promise<void> {
    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    const link = `${frontendUrl}/t/${slug}`;
    await this.send({
      to,
      subject: `Convite para ${tournamentName} — Kombatly`,
      html: `
        <p>Foste convidado para participar em <strong>${tournamentName}</strong>.</p>
        <p>Deadline de inscrição: <strong>${deadline}</strong></p>
        <p><a href="${link}" style="padding:12px 24px;background:#ef4444;color:#fff;border-radius:6px;text-decoration:none">Ver torneio e inscrever-me</a></p>
        <p style="color:#6b7280;font-size:12px">Se não quiseres receber este tipo de convites, podes ignorar este email.</p>
      `,
    });
  }

  async sendEmailVerification(email: string, token: string): Promise<void> {
    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    const link = `${frontendUrl}/verify-email?token=${token}`;
    await this.send({
      to: email,
      subject: 'Confirme o seu email — Kombatly',
      html: `
        <p>Bem-vindo à Kombatly!</p>
        <p>Clique no link abaixo para confirmar o seu endereço de email.</p>
        <p><a href="${link}" style="padding:12px 24px;background:#ef4444;color:#fff;border-radius:6px;text-decoration:none">Confirmar email</a></p>
      `,
    });
  }

  private async send(options: { to: string; subject: string; html: string }): Promise<void> {
    const from = this.config.get('MAIL_FROM', 'noreply@kombatly.com');
    if (!this.config.get('MAIL_USER')) {
      this.logger.warn(`[DEV] Email not sent (MAIL_USER not set). Would send to ${options.to}: ${options.subject}`);
      return;
    }
    try {
      await this.transporter.sendMail({ from, ...options });
    } catch (err) {
      this.logger.error(`Failed to send email to ${options.to}: ${err.message}`);
    }
  }
}
