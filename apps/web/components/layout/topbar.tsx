'use client';

import { Bell, Timer } from 'lucide-react';

export function Topbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Elite Promoter Command
        </p>
      </div>
      <div className="flex items-center gap-4">
        {/* Next live event */}
        <div className="hidden items-center gap-2 rounded border border-border bg-surface-elevated px-3 py-1.5 sm:flex">
          <Timer className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium uppercase tracking-wider text-foreground">
            Next Live Event
          </span>
          <span className="text-xs font-bold text-primary">—</span>
        </div>
        {/* Notifications */}
        <button className="relative flex h-8 w-8 items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
