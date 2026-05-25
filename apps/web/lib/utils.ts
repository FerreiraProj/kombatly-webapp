import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, locale = 'en-GB') {
  return new Date(date).toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date, locale = 'en-GB') {
  return new Date(date).toLocaleString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getTournamentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    DRAFT: 'Draft',
    PRIVATE: 'Private',
    PUBLIC: 'Public',
    ONGOING: 'Live',
    FINISHED: 'Completed',
    CANCELLED: 'Cancelled',
  };
  return labels[status] ?? status;
}
