import Link from 'next/link';
import { Trophy, Zap, Users, BarChart3, ChevronRight, Check } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Nav ── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <span className="font-heading text-2xl text-primary tracking-widest">TAEKWOMBATS</span>
            <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#tournaments" className="hover:text-foreground transition-colors">Tournaments</a>
              <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
              <a href="#athletes" className="hover:text-foreground transition-colors">Athletes</a>
            </nav>
            <Link
              href="/register"
              className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
            >
              GET STARTED
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-14">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-red-950/20" />
        <div className="absolute right-0 top-0 h-full w-1/2 opacity-10">
          <div className="h-full w-full bg-gradient-to-l from-primary/30 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="mb-4 inline-block rounded bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
              The Kinetic Edge of Management
            </div>
            <h1 className="font-heading text-6xl leading-none tracking-wide text-foreground sm:text-7xl lg:text-8xl">
              MASTER YOUR
              <br />
              <span className="text-primary">TOURNAMENT</span>
            </h1>
            <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
              Elite-level software for high-stakes Taekwondo competition. Precision scoring,
              automated brackets, and seamless athlete management.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded bg-primary px-6 py-3 font-semibold text-white hover:bg-red-700 transition-colors"
              >
                GET STARTED FOR FREE
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center gap-2 rounded border border-border px-6 py-3 font-semibold text-foreground hover:border-primary hover:text-primary transition-colors"
              >
                WATCH DEMO
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 flex items-end justify-between">
            <div>
              <h2 className="font-heading text-4xl tracking-wide text-foreground sm:text-5xl">
                PRECISION FEATURES
              </h2>
              <div className="mt-2 h-0.5 w-12 bg-primary" />
            </div>
            <p className="hidden max-w-sm text-right text-sm text-muted-foreground md:block">
              Built by promoters, for promoters. Every tool designed to minimise delay and maximise
              the athlete experience.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-px bg-border md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Trophy className="h-6 w-6" />}
              title="AUTOMATIC BRACKET GENERATION"
              description="Generate single-elimination brackets in seconds. Our algorithm handles seeding and byes automatically based on global rankings."
              tags={['WT Verified', 'Instant RE-SEED']}
              highlight={false}
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="REAL-TIME SCORING"
              description="Sync wireless scoring systems directly to the platform. Display live results to spectators and update global brackets instantly."
              tags={[]}
              highlight={true}
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="CLUB & ATHLETE REGISTRATION"
              description="Customisable registration forms for clubs, integrated waiver signing and belt verification."
              tags={[]}
              highlight={false}
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="GLOBAL RANKING INTEGRATION"
              description="Connect to major federation databases. Automatically fetch athlete win/loss records and current world rank for perfect tournament seeding."
              tags={['Learn About API']}
              highlight={false}
            />
            <FeatureCard
              icon={<Trophy className="h-6 w-6" />}
              title="VEST TYPE OPTIMISATION"
              description="Intelligent distribution of combats across areas based on protective vest availability. Maximise area utilisation automatically."
              tags={[]}
              highlight={false}
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="PUSH NOTIFICATIONS"
              description="Athletes receive instant callups to their combat area. Automatic schedule recalculation keeps everyone informed."
              tags={['PWA']}
              highlight={false}
            />
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="border-y border-border bg-surface py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <p className="font-heading text-4xl tracking-widest text-foreground sm:text-5xl">
              FAIR. POWERFUL.{' '}
              <span className="text-primary">KINETIC.</span>
            </p>
            <p className="mt-4 text-muted-foreground">
              No monthly subscriptions. No hidden setup fees. You only pay when you compete.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
            {/* Promoter Pro */}
            <div className="rounded-lg border border-border bg-background p-8">
              <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                The Promoter Pro
              </p>
              <div className="mt-4 flex items-end gap-1">
                <span className="font-heading text-6xl text-foreground">€2.50</span>
                <span className="mb-2 text-sm text-muted-foreground">per athlete</span>
              </div>
              <ul className="mt-8 space-y-3">
                {[
                  'Unlimited tournaments',
                  'Automated bracketing',
                  'Mobile scoring app',
                  '24/7 priority support',
                ].map((item, i) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <Check className={`h-4 w-4 flex-shrink-0 ${i < 3 ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={i < 3 ? 'text-foreground' : 'text-muted-foreground'}>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-8 block w-full rounded bg-primary py-3 text-center font-semibold text-white hover:bg-red-700 transition-colors"
              >
                CREATE ACCOUNT
              </Link>
            </div>

            {/* Federation */}
            <div className="rounded-lg border border-primary/30 bg-background p-8">
              <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                National Federation
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Custom solutions for large-scale national events, TV integrations, and multi-day
                championship management.
              </p>
              <blockquote className="mt-8 border-l-2 border-primary pl-4">
                <p className="text-sm italic text-muted-foreground">
                  "The standard for our Olympic Qualifiers."
                </p>
                <cite className="mt-2 block text-xs text-muted-foreground">
                  — European Taekwondo Union
                </cite>
              </blockquote>
              <button className="mt-8 block w-full rounded border border-border py-3 text-center font-semibold text-foreground hover:border-primary hover:text-primary transition-colors">
                CONTACT SALES
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 text-center">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="font-heading text-5xl text-foreground sm:text-6xl">
            READY TO TAKE
            <br />
            THE MAT?
          </h2>
          <div className="mt-8">
            <Link
              href="/register"
              className="inline-block rounded bg-primary px-10 py-4 font-semibold text-white hover:bg-red-700 transition-colors"
            >
              GET STARTED FOR FREE
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">
              No credit card required for your first 5 athletes
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center">
            <span className="font-heading text-xl tracking-widest text-foreground">TAEKWOMBATS</span>
            <div className="mt-4 flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Technical Support</a>
              <a href="#" className="hover:text-foreground transition-colors">Global Ranking</a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              © 2024 Taekwombats Kinetic Systems. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  tags,
  highlight,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tags: string[];
  highlight: boolean;
}) {
  return (
    <div
      className={`p-8 ${
        highlight
          ? 'bg-primary text-white'
          : 'bg-surface text-foreground hover:bg-surface-elevated'
      } transition-colors`}
    >
      <div className={`mb-4 ${highlight ? 'text-white' : 'text-primary'}`}>{icon}</div>
      <h3 className={`font-heading text-xl tracking-wide ${highlight ? 'text-white' : 'text-foreground'}`}>
        {title}
      </h3>
      <p className={`mt-3 text-sm leading-relaxed ${highlight ? 'text-red-100' : 'text-muted-foreground'}`}>
        {description}
      </p>
      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className={`rounded px-2 py-0.5 text-xs font-medium ${
                highlight
                  ? 'bg-white/20 text-white'
                  : 'bg-border text-muted-foreground'
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
