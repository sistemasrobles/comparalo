'use client';

import { useState, useEffect } from 'react';
import { getFeriaConfig, type FeriaConfig } from '@/lib/admin-store';

// ── Paletas de color por tema ─────────────────────────────────────────────
const THEMES: Record<FeriaConfig['theme'], string> = {
  orange: 'bg-gradient-to-r from-amber-600 via-orange-500 to-red-500',
  blue:   'bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-500',
  green:  'bg-gradient-to-r from-emerald-700 via-emerald-500 to-teal-500',
  purple: 'bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-500',
};
// ─────────────────────────────────────────────────────────────────────────

function useCountdown(targetMs: number) {
  const calc = () => {
    const diff = targetMs - Date.now();
    if (diff <= 0) return null;
    return {
      d: Math.floor(diff / 86_400_000),
      h: Math.floor((diff % 86_400_000) / 3_600_000),
      m: Math.floor((diff % 3_600_000) / 60_000),
      s: Math.floor((diff % 60_000) / 1_000),
    };
  };

  const [time, setTime] = useState<ReturnType<typeof calc>>(null);

  useEffect(() => {
    setTime(calc());
    const id = setInterval(() => setTime(calc()), 1_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetMs]);

  return time;
}

function Digit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center leading-none">
      <span className="tabular-nums font-bold text-white text-sm sm:text-base">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[9px] text-white/60 uppercase tracking-widest mt-0.5">{label}</span>
    </div>
  );
}

export function FeriaBanner() {
  const [cfg, setCfg] = useState<FeriaConfig | null>(null);

  useEffect(() => {
    getFeriaConfig().then(setCfg);
  }, []);

  const endMs = cfg ? new Date(cfg.endDate).getTime() : 0;
  const time  = useCountdown(endMs);

  if (!cfg || !cfg.active || time === null) return null;

  const gradientClass = THEMES[cfg.theme] ?? THEMES.orange;

  return (
    <div className={`relative z-[60] ${gradientClass} shadow-md`}>
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-4">

          {/* ── Texto principal ── */}
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-white font-bold text-xs sm:text-sm whitespace-nowrap">
              {cfg.name}
            </p>
            <span className="text-white/40 hidden sm:inline">·</span>
            <p className="text-white/75 text-[11px] sm:text-xs whitespace-nowrap hidden sm:block">
              {cfg.dates}{cfg.place ? ` · ${cfg.place}` : ''}
            </p>
          </div>

          {/* ── Separador ── */}
          <span className="text-white/30 hidden sm:inline">|</span>

          {/* ── Cuenta regresiva ── */}
          <div className="flex items-center gap-1.5 bg-black/20 rounded-lg px-2.5 py-1 flex-shrink-0">
            <Digit value={time.d} label="días" />
            <span className="text-white/40 font-bold text-xs">:</span>
            <Digit value={time.h} label="hrs" />
            <span className="text-white/40 font-bold text-xs">:</span>
            <Digit value={time.m} label="min" />
            <span className="text-white/40 font-bold text-xs">:</span>
            <Digit value={time.s} label="seg" />
          </div>

        </div>
      </div>
    </div>
  );
}
