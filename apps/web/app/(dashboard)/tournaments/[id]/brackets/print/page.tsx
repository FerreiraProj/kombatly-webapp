'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { bracketsApi, Combat, groupByCategory, groupIntoRounds, roundLabel, categoryLabel } from '@/lib/api/brackets';

export default function BracketsPrintPage() {
  const { id: tournamentId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('categoryId') ?? undefined;
  const t = useTranslations('brackets');

  const [combats, setCombats] = useState<Combat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bracketsApi
      .getAll(tournamentId, categoryId)
      .then(setCombats)
      .finally(() => setLoading(false));
  }, [tournamentId, categoryId]);

  useEffect(() => {
    if (!loading && combats.length > 0) {
      setTimeout(() => window.print(), 500);
    }
  }, [loading, combats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-gray-500">{t('loadingBrackets')}</p>
      </div>
    );
  }

  const groups = groupByCategory(combats);

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 1cm; }
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .page-break { page-break-after: always; }
        }
        body { font-family: Inter, sans-serif; }
      `}</style>

      {/* Print toolbar — hidden when printing */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 border-b bg-white px-6 py-3 shadow-sm">
        <span className="text-sm font-medium text-gray-700">{t('printPreview')}</span>
        <div className="flex gap-3">
          <button
            onClick={() => window.close()}
            className="rounded border px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50"
          >
            {t('close')}
          </button>
          <button
            onClick={() => window.print()}
            className="rounded bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
          >
            {t('printSavePdf')}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="no-print pt-16" />
      <div className="p-8 space-y-12">
        {groups.map(({ categoryId: catId, category, combats: catCombats }, gi) => {
          const rounds = groupIntoRounds(catCombats);
          return (
            <div key={catId} className={gi > 0 ? 'page-break' : ''}>
              <div className="mb-6 border-b-2 border-gray-800 pb-3">
                <h1 className="text-2xl font-bold uppercase tracking-wide text-gray-900">
                  {categoryLabel(category ?? undefined)}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {t('combatStats', { combats: catCombats.length, rounds: rounds.length })}
                </p>
              </div>

              {/* Bracket rounds */}
              <div className="flex gap-4 overflow-x-auto">
                {rounds.map((round) => (
                  <div key={round.roundNumber} className="flex-shrink-0" style={{ minWidth: '180px' }}>
                    <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {roundLabel(round.roundType)}
                    </p>
                    <div className="flex flex-col justify-around gap-2" style={{ minHeight: `${Math.max(round.combats.length, 1) * 80}px` }}>
                      {round.combats.map((combat) => (
                        <PrintCombatCard key={combat.id} combat={combat} tbd={t('tbd')} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {groups.length === 0 && (
          <div className="flex items-center justify-center py-32">
            <p className="text-gray-400">{t('noBracketsDisplay')}</p>
          </div>
        )}
      </div>
    </>
  );
}

function PrintCombatCard({ combat, tbd }: { combat: Combat; tbd: string }) {
  const red = combat.redAthlete;
  const blue = combat.blueAthlete;
  const isFinished = combat.status === 'FINISHED';

  return (
    <div className="border border-gray-300 rounded text-xs" style={{ minWidth: '170px' }}>
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-2 py-0.5 text-gray-400" style={{ fontSize: '9px' }}>
        <span>#{combat.combatNumber}</span>
        {combat.area && <span>{combat.area.name}</span>}
      </div>
      <PrintAthleteRow
        name={red ? `${red.athlete.firstName} ${red.athlete.lastName}` : 'BYE'}
        isWinner={isFinished && combat.winnerId === combat.redAthleteId}
        color="red"
        score={combat.redScore}
      />
      <div className="h-px bg-gray-200" />
      <PrintAthleteRow
        name={blue ? `${blue.athlete.firstName} ${blue.athlete.lastName}` : tbd}
        isWinner={isFinished && combat.winnerId === combat.blueAthleteId}
        color="blue"
        score={combat.blueScore}
      />
    </div>
  );
}

function PrintAthleteRow({
  name, isWinner, color, score,
}: {
  name: string; isWinner: boolean; color: 'red' | 'blue'; score: number;
}) {
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1.5 text-xs ${isWinner ? 'font-bold' : ''}`}>
      <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${color === 'red' ? 'bg-red-500' : 'bg-blue-500'}`} />
      <span className="flex-1 truncate" style={{ maxWidth: '120px' }}>{name}</span>
      {score > 0 && <span className="flex-shrink-0 font-bold text-gray-600">{score}</span>}
      {isWinner && <span className="text-green-600" style={{ fontSize: '9px' }}>✓</span>}
    </div>
  );
}
