import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency: 'PEN' | 'USD' = 'PEN'): string {
  if (currency === 'USD') {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
  return `S/${price.toLocaleString('es-PE')}`;
}

export function formatPriceRange(min: number, max: number, currency: 'PEN' | 'USD' = 'PEN'): string {
  return `${formatPrice(min, currency)} - ${formatPrice(max, currency)}`;
}

export function getSafetyScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

export function getSafetyScoreBg(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

export function getSafetyLabel(score: number): string {
  if (score >= 80) return 'Muy seguro';
  if (score >= 60) return 'Seguro';
  if (score >= 40) return 'Moderado';
  return 'Riesgo alto';
}

export function getLegalStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    TITULO_MATRIZ: 'Título matriz',
    INDEPENDIZACION: 'Independización',
    INSCRITO_SUNARP: 'Inscrito en SUNARP',
    HABILITACION_URBANA: 'Habilitación urbana',
    EN_TRAMITE: 'En trámite',
    SIN_DOCUMENTOS: 'Sin documentos',
  };
  return labels[status] || status;
}

export function getLegalStatusColor(status: string): string {
  const colors: Record<string, string> = {
    INSCRITO_SUNARP: 'badge-green',
    HABILITACION_URBANA: 'badge-blue',
    TITULO_MATRIZ: 'badge-blue',
    INDEPENDIZACION: 'badge-yellow',
    EN_TRAMITE: 'badge-yellow',
    SIN_DOCUMENTOS: 'badge-red',
  };
  return colors[status] || 'badge-yellow';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
