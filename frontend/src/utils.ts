import { ConsistencyInfo, ConsistencyLevel } from './api';

export function visitGrams(
  consistency: ConsistencyLevel,
  customGrams: number | '',
  levels: ConsistencyInfo[]
): number {
  if (consistency === 'CUSTOM') {
    const n = typeof customGrams === 'number' ? customGrams : 0;
    return n > 0 ? n : 0;
  }
  return levels.find((l) => l.level === consistency)?.gramsPerUnit ?? 0;
}

const TIER_IMAGES: Record<string, string> = {
  'tier-liquid': '/tiers/tier-liquid.svg',
  'tier-pellets': '/tiers/tier-pellets.svg',
  'tier-lumpy': '/tiers/tier-lumpy.svg',
  'tier-morel': '/tiers/tier-morel.svg',
  'tier-normal': '/tiers/tier-normal.svg',
  'tier-soft': '/tiers/tier-soft.svg',
  'tier-firm': '/tiers/tier-firm.svg',
  'tier-massive': '/tiers/tier-massive.svg',
  'tier-custom': '/tiers/tier-custom.svg',
  'tier-tiny': '/tiers/tier-pellets.svg',
  'tier-small': '/tiers/tier-lumpy.svg',
  'tier-medium': '/tiers/tier-normal.svg',
  'tier-large': '/tiers/tier-firm.svg',
  'tier-giant': '/tiers/tier-massive.svg',
};

export function tierImage(imageKey: string): string {
  return TIER_IMAGES[imageKey] ?? '/logo.png';
}

export const PERIOD_LABELS: Record<string, string> = {
  day: 'Сегодня',
  week: 'Неделя',
  month: 'Месяц',
  year: 'Год',
};

export function formatGrams(grams: number): string {
  if (grams >= 1_000_000) {
    return `${(grams / 1_000_000).toFixed(2)} т`;
  }
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(1)} кг`;
  }
  return `${grams} г`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function localDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function localDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return localDateString(date);
}

export function levelEmoji(level: ConsistencyLevel): string {
  const map: Record<ConsistencyLevel, string> = {
    LIQUID: '💧',
    PELLETS: '🫘',
    LUMPY: '🪨',
    MOREL: '🍄',
    NORMAL: '💩',
    SOFT: '🍦',
    FIRM: '🥖',
    GIANT: '🏔️',
    CUSTOM: '⚖️',
    TINY: '🫘',
    SMALL: '🪨',
    MEDIUM: '💩',
    LARGE: '🥖',
  };
  return map[level] ?? '💩';
}
