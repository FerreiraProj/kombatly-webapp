import Link from 'next/link';
import { Calendar, MapPin, Users, Trophy, Clock } from 'lucide-react';
import { notFound } from 'next/navigation';

type Tournament = any;

function fmt(iso?: string) {
  if (!iso) return 'â€”';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

function fmtTime(iso?: string) {
  if (!iso) return 'â€”';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function categoryLabel(cat: any): string {
  if (cat.isCustom) return cat.customName ?? 'Custom';
  const grade = cat.grade?.names?.en ?? '';
  const gender = cat.gender?.code === 'M' ? 'Male' : cat.gender?.code === 'F' ? 'Female' : '';
  const weight = cat.weightCategory?.displayNames?.en ?? cat.weightCategory?.strWeight ?? '';
  return [grade, gender, weight].filter(Boolean).join(' Â· ');
}

async function getTournament(slug: string): Promise<Tournament | null> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    const res = await fetch(`${base}/tournaments/slug/${slug}`, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function PublicTournamentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tournament = await getTournament(slug);

  if (!tournament || (tournament.status === 'PRIVATE')) {
    notFound();
  }

  const isLive = tournament.status === 'ONGOING';
  const isOpen = tournament.status === 'PUBLIC';
  const categories = tournament.categories ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Topbar */}
      <header className="border-b border-border bg-surface px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="font-heading text-lg text-primary tracking-widest">TAEKWOMBATS</Link>
          <div className="flex items-center gap-2">
            {isLive ? (
              <span className="badge-live flex items-center gap-1">
                <span className="live-dot" /> Live
              </span>
            ) : isOpen ? (
              <span className="badge-public">Open</span>
            ) : (
              <span className="bg-muted/20 text-muted-foreground text-xs px-2 py-0.5 rounded font-medium uppercase tracking-wider">
                {tournament.status === 'FINISHED' ? 'Finished' : tournament.status}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
        {/* Hero */}
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {tournament.promoter
              ? `Organised by ${tournament.promoter.firstName} ${tournament.promoter.lastName}`
              : 'Tournament'}
          </p>
          <h1 className="font-heading text-4xl text-foreground sm:text-6xl">
            {tournament.name.toUpperCase()}
          </h1>
          {tournament.description && (
            <p className="max-w-2xl text-muted-foreground leading-relaxed">{tournament.description}</p>
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Calendar, label: 'Start Date',  value: fmt(tournament.startDate) },
            { icon: Clock,    label: 'Start Time',  value: fmtTime(tournament.startTime) },
            { icon: Calendar, label: 'Deadline',    value: fmt(tournament.registrationDeadline) },
            { icon: MapPin,   label: 'Areas',       value: String(tournament.numAreas) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="stat-card">
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
                <Icon className="h-3.5 w-3.5" /> {label}
              </div>
              <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
            </div>
          ))}
        </div>

        {/* Categories table */}
        {categories.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-heading text-2xl text-foreground">CATEGORIES</h2>
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="hidden sm:grid grid-cols-12 gap-3 border-b border-border bg-surface-elevated px-5 py-3 text-xs uppercase tracking-widest text-muted-foreground">
                <span className="col-span-5">Category</span>
                <span className="col-span-3">Grade</span>
                <span className="col-span-2">Gender</span>
                <span className="col-span-2">Vest</span>
              </div>
              <ul className="divide-y divide-border">
                {categories.map((cat: any) => (
                  <li key={cat.id} className="grid grid-cols-1 gap-1 px-5 py-3 text-sm sm:grid-cols-12 sm:items-center sm:gap-3">
                    <div className="col-span-5 font-medium text-foreground">{categoryLabel(cat)}</div>
                    <div className="col-span-3 text-muted-foreground text-xs">{cat.grade?.names?.en ?? 'â€”'}</div>
                    <div className="col-span-2 text-muted-foreground text-xs">
                      {cat.gender?.code === 'M' ? 'Male' : cat.gender?.code === 'F' ? 'Female' : 'â€”'}
                    </div>
                    <div className="col-span-2 text-muted-foreground text-xs">
                      {cat.vestType ? `Vest ${cat.vestType}` : 'â€”'}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Registration CTA */}
        {isOpen && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-6 py-8 text-center space-y-3">
            <Trophy className="mx-auto h-10 w-10 text-primary" />
            <h2 className="font-heading text-2xl text-foreground">REGISTRATIONS OPEN</h2>
            <p className="text-muted-foreground text-sm">
              Deadline: {fmt(tournament.registrationDeadline)}
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded bg-primary px-7 py-3 font-semibold text-white hover:bg-red-700 transition-colors"
            >
              <Users className="h-4 w-4" />
              Register Your Club
            </Link>
          </div>
        )}

        {isLive && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-6 py-6 text-center space-y-2">
            <span className="badge-live text-base px-4 py-1">
              <span className="live-dot mr-2" />Event Ongoing
            </span>
            <p className="text-sm text-muted-foreground mt-2">
              Competition is underway. Results will be updated in real time.
            </p>
          </div>
        )}
      </main>

      <footer className="mt-16 border-t border-border px-4 py-6 text-center text-xs text-muted-foreground">
        <p>Powered by <span className="text-primary font-medium">Taekwombats</span></p>
      </footer>
    </div>
  );
}
