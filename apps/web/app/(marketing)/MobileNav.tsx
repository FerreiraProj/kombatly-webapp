'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Props {
  navEvents: string;
  navPricing: string;
  navGetStarted: string;
}

export function MobileNav({ navEvents, navPricing, navGetStarted }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center h-9 w-9 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors"
        aria-label="Menu"
      >
        {open ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-14 z-50 border-b border-border bg-background/95 backdrop-blur-sm px-4 py-4 flex flex-col gap-1 shadow-lg">
          <a
            href="#features"
            onClick={() => setOpen(false)}
            className="rounded px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-surface-elevated hover:text-foreground transition-colors"
          >
            Features
          </a>
          <Link
            href="/events"
            onClick={() => setOpen(false)}
            className="rounded px-3 py-2.5 text-sm font-semibold text-primary hover:bg-surface-elevated transition-colors"
          >
            {navEvents}
          </Link>
          <a
            href="#pricing"
            onClick={() => setOpen(false)}
            className="rounded px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-surface-elevated hover:text-foreground transition-colors"
          >
            {navPricing}
          </a>
          <div className="mt-2 pt-2 border-t border-border">
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="block w-full rounded bg-primary py-2.5 text-center text-sm font-semibold text-white hover:bg-red-700 transition-colors"
            >
              {navGetStarted}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
