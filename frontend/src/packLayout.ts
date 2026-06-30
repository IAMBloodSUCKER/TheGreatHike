/** Разбиение количества на связки/паллеты/ящики — только целые пачки, без «дробных» предметов. */

export type PackKind =
  | 'keys'
  | 'pens'
  | 'pencils'
  | 'coins'
  | 'matches'
  | 'clips'
  | 'balls'
  | 'sponges'
  | 'oranges'
  | 'chocolate'
  | 'socks'
  | 'caterpillars'
  | 'discs';

export interface PackPiece {
  size: number;
}

export interface PackProfile {
  sizes: number[];
  /** габарит одной штуки (мм) */
  unitW: number;
  unitH: number;
}

export const PACK_PROFILES: Record<PackKind, PackProfile> = {
  balls: { sizes: [5, 3, 1], unitW: 220, unitH: 220 },
  sponges: { sizes: [10, 5, 1], unitW: 110, unitH: 70 },
  oranges: { sizes: [50, 20, 10, 5, 3, 1], unitW: 72, unitH: 72 },
  chocolate: { sizes: [100, 50, 20, 15, 10, 5, 3, 1], unitW: 100, unitH: 18 },
  socks: { sizes: [20, 10, 5, 3, 1], unitW: 95, unitH: 38 },
  caterpillars: { sizes: [3, 1], unitW: 48, unitH: 22 },
  keys: { sizes: [25, 10, 5, 1], unitW: 22, unitH: 55 },
  discs: { sizes: [10, 5, 3, 1], unitW: 50, unitH: 50 },
  pens: { sizes: [10, 5, 1], unitW: 12, unitH: 145 },
  pencils: { sizes: [12, 6, 1], unitW: 8, unitH: 175 },
  coins: { sizes: [25, 10, 1], unitW: 22, unitH: 22 },
  matches: { sizes: [10, 5, 1], unitW: 35, unitH: 50 },
  clips: { sizes: [50, 10, 1], unitW: 28, unitH: 22 },
};

export const MAX_VISUAL_PACKS = 10;

/** Жадное разбиение на пачки (крупные сначала). */
export function decomposeIntoPacks(total: number, sizes: number[]): PackPiece[] {
  const whole = Math.max(0, Math.floor(total + 0.0001));
  if (whole === 0) {
    return [];
  }
  const sorted = [...sizes].sort((a, b) => b - a);
  let remaining = whole;
  const buckets: PackPiece[] = [];

  for (const size of sorted) {
    const qty = Math.floor(remaining / size);
    for (let i = 0; i < qty; i++) {
      buckets.push({ size });
    }
    remaining -= qty * size;
  }

  if (remaining > 0) {
    buckets.push({ size: remaining });
  }
  return buckets;
}

export function packFootprintMm(kind: PackKind, packSize: number): { w: number; h: number } {
  const p = PACK_PROFILES[kind];
  switch (kind) {
    case 'balls':
      if (packSize >= 5) return { w: 200, h: 75 };
      if (packSize >= 3) return { w: 145, h: 72 };
      return { w: p.unitW, h: p.unitH };
    case 'sponges':
      if (packSize >= 10) return { w: 130, h: 55 };
      if (packSize >= 5) return { w: 100, h: 48 };
      return { w: p.unitW, h: p.unitH };
    case 'oranges':
      if (packSize >= 50) return { w: 160, h: 90 };
      if (packSize >= 20) return { w: 130, h: 80 };
      if (packSize >= 10) return { w: 110, h: 70 };
      if (packSize >= 5) return { w: 90, h: 62 };
      if (packSize >= 3) return { w: 72, h: 58 };
      return { w: p.unitW, h: p.unitH };
    case 'chocolate':
      if (packSize >= 100) return { w: 150, h: 95 };
      if (packSize >= 50) return { w: 130, h: 80 };
      if (packSize >= 20) return { w: 110, h: 55 };
      if (packSize >= 15) return { w: 100, h: 48 };
      if (packSize >= 10) return { w: 90, h: 42 };
      if (packSize >= 5) return { w: 70, h: 32 };
      if (packSize >= 3) return { w: 55, h: 28 };
      return { w: p.unitW, h: p.unitH };
    case 'socks':
      if (packSize >= 20) return { w: 150, h: 65 };
      if (packSize >= 10) return { w: 125, h: 58 };
      if (packSize >= 5) return { w: 95, h: 50 };
      if (packSize >= 3) return { w: 75, h: 45 };
      return { w: p.unitW, h: p.unitH };
    case 'caterpillars':
      if (packSize >= 3) return { w: 85, h: 38 };
      return { w: p.unitW, h: p.unitH };
    case 'keys':
      if (packSize >= 25) return { w: 58, h: 52 };
      if (packSize >= 10) return { w: 50, h: 48 };
      if (packSize >= 5) return { w: 44, h: 44 };
      return { w: 36, h: 40 };
    default:
      if (packSize >= 10) return { w: p.unitW * 2.2, h: p.unitH * 1.8 };
      if (packSize >= 5) return { w: p.unitW * 1.6, h: p.unitH * 1.4 };
      if (packSize >= 3) return { w: p.unitW * 1.3, h: p.unitH * 1.2 };
      return { w: p.unitW, h: p.unitH };
  }
}

export interface PlacedPack {
  size: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Раскладка пачек на «полу» — снизу вверх, без парения. */
export function layoutPacksOnGround(
  packs: PackPiece[],
  kind: PackKind,
  anchorCx: number,
  groundY: number,
  mmToPx: (mm: number) => number,
  maxWidthPx = 150,
): { placed: PlacedPack[]; hidden: number; totalH: number } {
  const visible = packs.slice(0, MAX_VISUAL_PACKS);
  const hidden = Math.max(0, packs.length - MAX_VISUAL_PACKS);

  const items = visible.map((pack) => {
    const fp = packFootprintMm(kind, pack.size);
    return {
      size: pack.size,
      w: mmToPx(fp.w),
      h: mmToPx(fp.h),
    };
  });

  const rows: (typeof items)[] = [];
  let row: typeof items = [];
  let rowW = 0;
  const gap = 4;

  for (const item of items) {
    if (row.length > 0 && rowW + gap + item.w > maxWidthPx) {
      rows.push(row);
      row = [];
      rowW = 0;
    }
    row.push(item);
    rowW += (row.length === 1 ? 0 : gap) + item.w;
  }
  if (row.length) {
    rows.push(row);
  }

  const placed: PlacedPack[] = [];
  let yCursor = groundY;

  for (let ri = rows.length - 1; ri >= 0; ri--) {
    const r = rows[ri];
    const rowH = Math.max(...r.map((i) => i.h));
    yCursor -= rowH;
    const totalRowW = r.reduce((s, i, idx) => s + i.w + (idx ? gap : 0), 0);
    let x = anchorCx - totalRowW / 2;
    for (const item of r) {
      placed.push({ size: item.size, x, y: yCursor, w: item.w, h: item.h });
      x += item.w + gap;
    }
  }

  const totalH = groundY - (placed.length ? Math.min(...placed.map((p) => p.y)) : groundY);
  return { placed, hidden, totalH: Math.max(totalH, mmToPx(PACK_PROFILES[kind].unitH)) };
}

export function wholeAndRemainder(count: number, gramsPerUnit: number): {
  whole: number;
  remainderCount: number;
  remainderGrams: number;
} {
  const whole = Math.floor(count + 0.0001);
  const remainderCount = count - whole;
  return {
    whole,
    remainderCount,
    remainderGrams: Math.round(remainderCount * gramsPerUnit),
  };
}
