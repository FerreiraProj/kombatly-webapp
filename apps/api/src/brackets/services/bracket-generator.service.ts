import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DrawType, RoundType } from '@taekwombats/database';

interface AthleteSlot {
  registrationId: string | null;
  ranking: number;
  isBye: boolean;
}

interface MatchSlot {
  red: AthleteSlot;
  blue: AthleteSlot;
  roundNumber: number;
  roundType: RoundType;
  bracketPosition: number;
}

@Injectable()
export class BracketGeneratorService {
  constructor(private prisma: PrismaService) {}

  async generateForCategory(
    tournamentId: string,
    categoryId: string,
    drawType: DrawType,
    includeUnpaid: boolean,
  ) {
    // 1. Get eligible athletes
    const registrations = await this.prisma.tournamentRegistration.findMany({
      where: {
        tournamentId,
        categoryId,
        ...(includeUnpaid ? {} : { isPaid: true }),
        checkedIn: true,
      },
      orderBy: { ranking: 'asc' },
    });

    if (registrations.length < 2) return [];

    // 2. Build athlete slots with ranking
    let slots: AthleteSlot[] = registrations.map((r, idx) => ({
      registrationId: r.id,
      ranking: r.ranking > 0 ? r.ranking : registrations.length + idx + 1,
      isBye: false,
    }));

    if (drawType === DrawType.RANDOM) {
      slots = this.shuffle(slots);
      slots.forEach((s, i) => (s.ranking = i + 1));
    } else {
      slots.sort((a, b) => a.ranking - b.ranking);
    }

    // 3. Determine bracket size (next power of 2)
    const bracketSize = this.nextPowerOfTwo(slots.length);
    const byesNeeded = bracketSize - slots.length;

    // 4. Add BYE slots (fill at end so best seeds get them)
    for (let i = 0; i < byesNeeded; i++) {
      slots.push({ registrationId: null, ranking: slots.length + 1, isBye: true });
    }

    // 5. Create round-1 matchups: seed[0] vs seed[N-1], seed[1] vs seed[N-2], ...
    const totalRounds = Math.log2(bracketSize);
    const round1Matches: MatchSlot[] = [];

    for (let i = 0; i < bracketSize / 2; i++) {
      round1Matches.push({
        red: slots[i],
        blue: slots[bracketSize - 1 - i],
        roundNumber: 1,
        roundType: this.getRoundType(1, totalRounds),
        bracketPosition: i + 1,
      });
    }

    // 6. Persist combats and chain nextCombatId
    return this.persistBracket(tournamentId, categoryId, round1Matches, totalRounds);
  }

  private async persistBracket(
    tournamentId: string,
    categoryId: string,
    round1: MatchSlot[],
    totalRounds: number,
  ) {
    const createdCombats: { id: string; roundNumber: number; bracketPosition: number }[] = [];

    // Create all rounds bottom-up so we can link nextCombatId
    const allRounds: MatchSlot[][] = [round1];

    // Build empty subsequent rounds
    let prevCount = round1.length;
    for (let round = 2; round <= totalRounds; round++) {
      const nextCount = prevCount / 2;
      const roundMatches: MatchSlot[] = [];
      for (let pos = 1; pos <= nextCount; pos++) {
        roundMatches.push({
          red: { registrationId: null, ranking: 0, isBye: false },
          blue: { registrationId: null, ranking: 0, isBye: false },
          roundNumber: round,
          roundType: this.getRoundType(round, totalRounds),
          bracketPosition: pos,
        });
      }
      allRounds.push(roundMatches);
      prevCount = nextCount;
    }

    // Create combats from last round to first (so we have IDs to reference)
    const roundIds: string[][] = [];
    for (let r = allRounds.length - 1; r >= 0; r--) {
      const ids: string[] = [];
      for (const match of allRounds[r]) {
        const combat = await this.prisma.combat.create({
          data: {
            tournamentId,
            categoryId,
            combatNumber: 0,
            roundNumber: match.roundNumber,
            roundType: match.roundType,
            bracketPosition: match.bracketPosition,
            redAthleteId:
              match.red.registrationId && !match.red.isBye ? match.red.registrationId : null,
            blueAthleteId:
              match.blue.registrationId && !match.blue.isBye ? match.blue.registrationId : null,
            status: 'SCHEDULED',
          },
        });
        ids.push(combat.id);
        createdCombats.push({ id: combat.id, roundNumber: match.roundNumber, bracketPosition: match.bracketPosition });
      }
      roundIds.unshift(ids);
    }

    // Link nextCombatId: winner of round[r][i] goes to round[r+1][floor(i/2)]
    for (let r = 0; r < roundIds.length - 1; r++) {
      for (let i = 0; i < roundIds[r].length; i++) {
        const nextIdx = Math.floor(i / 2);
        await this.prisma.combat.update({
          where: { id: roundIds[r][i] },
          data: { nextCombatId: roundIds[r + 1][nextIdx] },
        });
      }
    }

    // Assign sequential combat numbers and handle BYE auto-advance
    let combatNum = 1;
    for (const id of roundIds.flat()) {
      await this.prisma.combat.update({
        where: { id },
        data: { combatNumber: combatNum++ },
      });
    }

    // Auto-advance BYE fights in round 1
    for (let i = 0; i < round1.length; i++) {
      const match = round1[i];
      if (match.red.isBye || match.blue.isBye) {
        const winnerId = match.red.isBye ? match.blue.registrationId : match.red.registrationId;
        const combatId = roundIds[0][i];
        const combat = await this.prisma.combat.findUnique({ where: { id: combatId } });

        if (winnerId && combat?.nextCombatId) {
          await this.prisma.combat.update({
            where: { id: combatId },
            data: { winnerId, status: 'FINISHED' },
          });

          // Place winner in next round
          const nextCombat = await this.prisma.combat.findUnique({
            where: { id: combat.nextCombatId },
          });
          const isRed = Math.floor(i / 2) * 2 === i;
          await this.prisma.combat.update({
            where: { id: combat.nextCombatId },
            data: isRed ? { redAthleteId: winnerId } : { blueAthleteId: winnerId },
          });
        }
      }
    }

    return createdCombats;
  }

  private getRoundType(round: number, totalRounds: number): RoundType {
    const fromEnd = totalRounds - round;
    switch (fromEnd) {
      case 0: return RoundType.FINAL;
      case 1: return RoundType.SEMI_FINAL;
      case 2: return RoundType.QUARTER_FINAL;
      case 3: return RoundType.ROUND_OF_16;
      case 4: return RoundType.ROUND_OF_32;
      default: return RoundType.ROUND_OF_64;
    }
  }

  private nextPowerOfTwo(n: number): number {
    let p = 2;
    while (p < n) p *= 2;
    return p;
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
