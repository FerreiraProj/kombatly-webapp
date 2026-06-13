'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { tournamentsApi, Tournament, Medalist } from '@/lib/api/tournaments';

export default function ResultsPrintPage() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [medalists, setMedalists] = useState<Medalist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      tournamentsApi.getOne(id),
      tournamentsApi.getMedalists(id),
    ])
      .then(([t, m]) => { setTournament(t); setMedalists(m); })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!loading && medalists.length > 0) {
      setTimeout(() => window.print(), 600);
    }
  }, [loading, medalists]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-gray-500">A carregar resultados...</p>
      </div>
    );
  }

  const fmt = (iso?: string) => iso
    ? new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  const medals: { key: 'gold' | 'silver' | 'bronze'; label: string; symbol: string }[] = [
    { key: 'gold',   label: 'Ouro',   symbol: '🥇' },
    { key: 'silver', label: 'Prata',  symbol: '🥈' },
    { key: 'bronze', label: 'Bronze', symbol: '🥉' },
  ];

  return (
    <div className="print-page p-8 max-w-4xl mx-auto font-sans text-gray-900">
      <style>{`
        @media print {
          @page { margin: 1.5cm; }
          body { font-size: 11px; }
          .no-print { display: none !important; }
        }
        .print-page { background: white; color: black; }
      `}</style>

      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4 mb-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">Resultados Finais</div>
          <h1 className="text-3xl font-bold uppercase tracking-wide">{tournament?.name}</h1>
          {tournament?.promoter && (
            <p className="text-sm text-gray-600 mt-1">
              Organizador: {tournament.promoter.firstName} {tournament.promoter.lastName}
            </p>
          )}
          <p className="text-sm text-gray-600">{fmt(tournament?.startDate)}</p>
        </div>
        <div className="text-right text-xs text-gray-400">
          <p className="font-bold text-lg text-gray-900">KOMBATLYPRO</p>
          <p>kombatlypro.com</p>
          <p className="mt-1">Impresso: {new Date().toLocaleDateString('pt-PT')}</p>
        </div>
      </div>

      {medalists.length === 0 ? (
        <p className="text-center text-gray-500 py-10">Sem resultados disponíveis.</p>
      ) : (
        <div className="space-y-6">
          {medalists.map((cat) => (
            <div key={cat.categoryId} className="border border-gray-200 rounded">
              <div className="bg-gray-900 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest">
                {cat.categoryLabel || 'Categoria'}
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {medals.map(({ key, label, symbol }) => {
                    const m = cat[key];
                    return (
                      <tr key={key} className="border-t border-gray-100">
                        <td className="px-4 py-2.5 w-8 text-center text-base">{symbol}</td>
                        <td className="px-2 py-2.5 font-semibold w-20 text-gray-700">{label}</td>
                        <td className="px-2 py-2.5 font-bold">
                          {m ? `${m.athlete.firstName} ${m.athlete.lastName}` : '—'}
                        </td>
                        <td className="px-2 py-2.5 text-gray-500">
                          {m?.club?.name ?? ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
        Documento gerado automaticamente pela plataforma KOMBATLYPRO · kombatlypro.com
      </div>

      {/* Print button (hidden when printing) */}
      <div className="no-print fixed bottom-6 right-6">
        <button
          onClick={() => window.print()}
          className="rounded bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-gray-700"
        >
          Imprimir / Exportar PDF
        </button>
      </div>
    </div>
  );
}
