'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'peruinversion_project_views';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Reads the raw map from localStorage: { [slug]: number[] }
 * where each number is a Unix timestamp (ms) of a visit.
 */
function readStore(): Record<string, number[]> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function writeStore(data: Record<string, number[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Counts visits to `slug` in the last 30 days, and records the current
 * visit on first render.  Returns { views30d }.
 */
export function useProjectViews(slug: string): { views30d: number } {
  const [views30d, setViews30d] = useState<number>(0);

  useEffect(() => {
    if (!slug) return;

    const now = Date.now();
    const cutoff = now - THIRTY_DAYS_MS;
    const store = readStore();

    // Keep only timestamps within the last 30 days, then add this visit
    const prev: number[] = (store[slug] ?? []).filter((t) => t > cutoff);
    prev.push(now);

    store[slug] = prev;
    writeStore(store);

    setViews30d(prev.length);
  }, [slug]);

  return { views30d };
}
