'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getProjectAdBanners, type ProjectAdBanner } from '@/lib/admin-store';

const INTERVAL_MS = 4000; // tiempo entre slides

export function ProjectAdBanners() {
  const [banners, setBanners] = useState<ProjectAdBanner[]>([]);
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const load = () => {
      getProjectAdBanners().then((all) => {
        setBanners(all.filter((b) => b.active).sort((a, b) => a.order - b.order));
        setCurrent(0);
      });
    };
    load();
  }, []);

  // Avance automático
  useEffect(() => {
    if (banners.length <= 1) return;
    timerRef.current = setTimeout(() => {
      goTo((current + 1) % banners.length);
    }, INTERVAL_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, banners.length]);

  const goTo = (index: number) => {
    if (animating || index === current) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setAnimating(false);
    }, 400);
  };

  if (banners.length === 0) return null;

  const b = banners[current];

  return (
    <div className="relative w-full rounded-xl overflow-hidden shadow-sm">
      {/* Banner activo con fade */}
      <Link
        href={b.ctaUrl}
        className="block relative w-full cursor-pointer"
        style={{
          aspectRatio: '4 / 1',
          opacity: animating ? 0 : 1,
          transition: 'opacity 0.4s ease-in-out',
        }}
      >
        <Image
          src={b.bgImage}
          alt={b.label}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 896px"
          priority
        />
      </Link>

      {/* Dots indicadores (solo si hay más de 1) */}
      {banners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-5 h-1.5 bg-white'
                  : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}


