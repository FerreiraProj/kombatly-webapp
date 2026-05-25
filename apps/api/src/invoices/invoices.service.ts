import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceStatus, PaymentMethod } from '@taekwombats/database';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  // ── Generate invoice for all registrations of a club in a tournament ────────

  async generate(
    promoterId: string,
    tournamentId: string,
    clubUserId: string,  // the User.id who owns the club
    notes?: string,
  ): Promise<any> {
    // Verify promoter owns the tournament
    const tournament = await this.prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) throw new NotFoundException('Tournament not found');
    if (tournament.promoterId !== promoterId) throw new ForbiddenException();

    // Find the club owned by that user
    const club = await this.prisma.club.findUnique({ where: { userId: clubUserId } });
    if (!club) throw new NotFoundException('Club not found for that user');

    // Get unpaid registrations for this club in this tournament
    const registrations = await this.prisma.tournamentRegistration.findMany({
      where: { tournamentId, clubId: club.id, isPaid: false, invoiceNoteId: null },
    });

    if (registrations.length === 0) {
      throw new BadRequestException('No uninvoiced registrations found for this club');
    }

    // Get platform cost per athlete
    const settings = await this.prisma.platformSettings.findFirst();
    const costPerAthlete = Number(settings?.costPerAthlete ?? 2.5);
    const totalAmount = costPerAthlete * registrations.length;

    // Check no existing pending invoice for same tournament+club
    const existing = await this.prisma.invoiceNote.findFirst({
      where: { tournamentId, receiverId: clubUserId, status: InvoiceStatus.PENDING },
    });
    if (existing) {
      throw new ConflictException('A pending invoice already exists for this club in this tournament');
    }

    const invoice = await this.prisma.invoiceNote.create({
      data: {
        issuerId: promoterId,
        receiverId: clubUserId,
        tournamentId,
        numAthletes: registrations.length,
        totalAmount,
        notes,
      },
      include: {
        issuer: { select: { firstName: true, lastName: true } },
        receiver: { select: { firstName: true, lastName: true } },
        tournament: { select: { name: true } },
      },
    });

    // Link registrations to this invoice
    await this.prisma.tournamentRegistration.updateMany({
      where: { id: { in: registrations.map((r) => r.id) } },
      data: { invoiceNoteId: invoice.id },
    });

    return invoice;
  }

  // ── Mark invoice as paid ─────────────────────────────────────────────────────

  async markPaid(
    promoterId: string,
    invoiceId: string,
    paymentMethod: PaymentMethod,
  ): Promise<any> {
    const invoice = await this.prisma.invoiceNote.findUnique({
      where: { id: invoiceId },
      include: { tournament: true },
    });

    if (!invoice) throw new NotFoundException();
    if (invoice.tournament.promoterId !== promoterId) throw new ForbiddenException();
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Invoice is already paid');
    }

    const updated = await this.prisma.invoiceNote.update({
      where: { id: invoiceId },
      data: { status: InvoiceStatus.PAID, paidAt: new Date(), paymentMethod },
      include: {
        issuer: { select: { firstName: true, lastName: true } },
        receiver: { select: { firstName: true, lastName: true } },
        tournament: { select: { name: true } },
      },
    });

    // Mark all linked registrations as paid
    await this.prisma.tournamentRegistration.updateMany({
      where: { invoiceNoteId: invoiceId },
      data: { isPaid: true },
    });

    return updated;
  }

  // ── Cancel invoice ───────────────────────────────────────────────────────────

  async cancel(promoterId: string, invoiceId: string): Promise<any> {
    const invoice = await this.prisma.invoiceNote.findUnique({
      where: { id: invoiceId },
      include: { tournament: true },
    });

    if (!invoice) throw new NotFoundException();
    if (invoice.tournament.promoterId !== promoterId) throw new ForbiddenException();
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot cancel a paid invoice');
    }

    // Unlink registrations
    await this.prisma.tournamentRegistration.updateMany({
      where: { invoiceNoteId: invoiceId },
      data: { invoiceNoteId: null },
    });

    return this.prisma.invoiceNote.update({
      where: { id: invoiceId },
      data: { status: InvoiceStatus.CANCELLED },
    });
  }

  // ── Get invoices for a tournament (promoter view) ────────────────────────────

  async findForTournament(promoterId: string, tournamentId: string): Promise<any[]> {
    const tournament = await this.prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) throw new NotFoundException();
    if (tournament.promoterId !== promoterId) throw new ForbiddenException();

    return this.prisma.invoiceNote.findMany({
      where: { tournamentId },
      include: {
        issuer: { select: { firstName: true, lastName: true } },
        receiver: { select: { firstName: true, lastName: true } },
        registrations: {
          include: {
            athlete: { select: { firstName: true, lastName: true } },
            category: { include: { grade: true, gender: true, weightCategory: true } },
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  // ── Get invoices for the logged-in club user ──────────────────────────────────

  async findMine(userId: string): Promise<any[]> {
    return this.prisma.invoiceNote.findMany({
      where: { receiverId: userId },
      include: {
        issuer: { select: { firstName: true, lastName: true } },
        tournament: { select: { id: true, name: true, slug: true } },
        registrations: {
          include: {
            athlete: { select: { firstName: true, lastName: true } },
            category: { include: { grade: true, gender: true, weightCategory: true } },
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  // ── Get a single invoice ──────────────────────────────────────────────────────

  async findOne(userId: string, invoiceId: string): Promise<any> {
    const invoice = await this.prisma.invoiceNote.findUnique({
      where: { id: invoiceId },
      include: {
        issuer: { select: { firstName: true, lastName: true, email: true } },
        receiver: { select: { firstName: true, lastName: true, email: true } },
        tournament: { select: { id: true, name: true, slug: true } },
        registrations: {
          include: {
            athlete: { select: { firstName: true, lastName: true } },
            category: { include: { grade: true, gender: true, weightCategory: true } },
            club: { select: { name: true, sigla: true } },
          },
        },
      },
    });

    if (!invoice) throw new NotFoundException();

    // Only issuer or receiver can view
    if (invoice.issuerId !== userId && invoice.receiverId !== userId) {
      throw new ForbiddenException();
    }

    return invoice;
  }
}
