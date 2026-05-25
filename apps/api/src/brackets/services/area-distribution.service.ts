import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DrawType } from '@taekwombats/database';

interface AreaState {
  id: string;
  totalJobs: number;
  vestJobs: Record<number, number>;
  vestTypes: Set<number>;
}

@Injectable()
export class AreaDistributionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Distribute tournament combats across competition areas,
   * balancing load while respecting vest type constraints.
   * Ported from VBA: "Código VBA para distribuição de jogos por coletes"
   */
  async distribute(
    tournamentId: string,
    drawType: DrawType,
  ): Promise<void> {
    const tournament = await this.prisma.tournament.findUniqueOrThrow({
      where: { id: tournamentId },
      include: { areas: true, categories: { include: { combats: { where: { status: 'SCHEDULED' } } } } },
    });

    if (tournament.areas.length === 0) return;

    // 1. Build vest → combats map
    const vestCombats: Record<number, string[]> = { 1: [], 2: [], 3: [], 4: [] };

    for (const category of tournament.categories) {
      const vestType = category.vestType;
      for (const combat of category.combats) {
        vestCombats[vestType].push(combat.id);
      }
    }

    // 2. Sort vest types descending by game count
    const sortedVests = ([1, 2, 3, 4] as number[]).sort(
      (a, b) => vestCombats[b].length - vestCombats[a].length,
    );

    // 3. Initialise area states
    const areas: AreaState[] = tournament.areas.map((a) => ({
      id: a.id,
      totalJobs: 0,
      vestJobs: { 1: 0, 2: 0, 3: 0, 4: 0 },
      vestTypes: new Set<number>(),
    }));

    const vestCombatAssignments: Record<string, string> = {};

    // 4. Distribute combats vest-type by vest-type
    for (const vestType of sortedVests) {
      const combatIds = vestCombats[vestType];

      for (const combatId of combatIds) {
        const selectedAreaId = this.selectArea(areas, vestType, drawType, tournament.hasVestLimitation, tournament);
        const area = areas.find((a) => a.id === selectedAreaId)!;

        area.vestJobs[vestType]++;
        area.totalJobs++;
        area.vestTypes.add(vestType);
        vestCombatAssignments[combatId] = selectedAreaId;
      }
    }

    // 5. Persist area assignments
    for (const [combatId, areaId] of Object.entries(vestCombatAssignments)) {
      await this.prisma.combat.update({ where: { id: combatId }, data: { areaId } });
    }

    // 6. Update area vestTypes JSON
    for (const area of areas) {
      await this.prisma.competitionArea.update({
        where: { id: area.id },
        data: { vestTypes: [...area.vestTypes] },
      });
    }
  }

  private selectArea(
    areas: AreaState[],
    vestType: number,
    drawType: DrawType,
    hasVestLimitation: boolean,
    tournament: { vestQtyType1?: number | null; vestQtyType2?: number | null; vestQtyType3?: number | null; vestQtyType4?: number | null },
  ): string {
    // Vest quantity limits per type (if applicable)
    const vestLimits: Record<number, number | null> = {
      1: tournament.vestQtyType1 ?? null,
      2: tournament.vestQtyType2 ?? null,
      3: tournament.vestQtyType3 ?? null,
      4: tournament.vestQtyType4 ?? null,
    };

    // Candidate areas: already have this vest OR can add a new vest type
    let candidates = areas.filter((area) => {
      const alreadyHas = area.vestTypes.has(vestType);
      if (alreadyHas) {
        // Check vest quantity limit
        if (hasVestLimitation && vestLimits[vestType] !== null) {
          return area.vestJobs[vestType] < vestLimits[vestType]!;
        }
        return true;
      }
      // Can add new vest type if area has fewer than 4 different types
      return area.vestTypes.size < 4;
    });

    // Fallback: if no candidates, relax constraints (force into any area with this vest)
    if (candidates.length === 0) {
      candidates = areas.filter((a) => a.vestTypes.has(vestType));
    }
    if (candidates.length === 0) {
      candidates = [...areas];
    }

    // Select area with fewest total jobs; break ties per drawType
    const minTotal = Math.min(...candidates.map((a) => a.totalJobs));
    const best = candidates.filter((a) => a.totalJobs === minTotal);

    if (drawType === DrawType.RANDOM) {
      return best[Math.floor(Math.random() * best.length)].id;
    }
    return best[0].id;
  }
}
