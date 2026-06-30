/** Характерный линейный размер предмета (мм) и форма для отрисовки в масштабе с человеком (~170 см). */

export type ObjectShape = 'box' | 'flat' | 'disc' | 'cylinder' | 'soft' | 'generic';
export type StackMode = 'stack' | 'pile';
/** stack — слои; cluster — рядом; books — стопка книг; bundle/packs — связки на полу */
export type VisualLayout = 'stack' | 'cluster' | 'books' | 'bundle' | 'packs';
import type { PackKind } from './packLayout';
import { decomposeIntoPacks, layoutPacksOnGround, PACK_PROFILES } from './packLayout';

export type { PackKind };
export type BundleKind = PackKind;

export interface ObjectDimensions {
  /** Высота одного слоя в стопке (мм) */
  sizeMm: number;
  /** Ширина слоя (мм); если нет — из aspect */
  widthMm?: number;
  shape: ObjectShape;
  /** ширина / высота */
  aspect: number;
  stackMode: StackMode;
  /** Шаг между слоями в стопке (мм) — реальный */
  stackStepMm: number;
  visualLayout?: VisualLayout;
  /** Сколько фигурок рисуем максимум (книги — 10, самокаты — 5) */
  maxVisualLayers?: number;
  bundleKind?: PackKind;
  /** Размеры пачек для микса (крупные первыми) */
  packSizes?: number[];
  /** @deprecated используй packSizes */
  unitsPerBundle?: number;
  /** Габарит связки для отрисовки (мм) */
  bundleHeightMm?: number;
  bundleWidthMm?: number;
}

const HUMAN_HEIGHT_MM = 1700;

type Rule = {
  pattern: RegExp;
  sizeMm: number;
  widthMm?: number;
  shape?: ObjectShape;
  aspect?: number;
  stackMode?: StackMode;
  stackStepMm?: number;
  visualLayout?: VisualLayout;
  maxVisualLayers?: number;
  bundleKind?: PackKind;
  packSizes?: number[];
  unitsPerBundle?: number;
  bundleHeightMm?: number;
  bundleWidthMm?: number;
};

const BUNDLE_RULE = {
  visualLayout: 'packs' as const,
  maxVisualLayers: 10,
};

const CLUSTER_RULE: Pick<Rule, 'visualLayout' | 'maxVisualLayers'> = {
  visualLayout: 'cluster',
  maxVisualLayers: 5,
};

const RULES: Rule[] = [
  { pattern: /шампун/, sizeMm: 220, widthMm: 68, shape: 'cylinder', stackStepMm: 220 },
  {
    pattern: /самокат/,
    sizeMm: 1000,
    widthMm: 480,
    shape: 'box',
    stackStepMm: 1000,
    ...CLUSTER_RULE,
  },
  { pattern: /кролик/, sizeMm: 420, widthMm: 200, shape: 'soft', stackStepMm: 420, ...CLUSTER_RULE },
  { pattern: /кошк|кот\b/, sizeMm: 280, widthMm: 120, shape: 'soft', stackStepMm: 280 },
  { pattern: /собак/, sizeMm: 550, widthMm: 220, shape: 'soft', stackStepMm: 550 },
  { pattern: /хомяк/, sizeMm: 80, widthMm: 45, shape: 'disc', stackStepMm: 75 },
  { pattern: /курин|куриц/, sizeMm: 380, widthMm: 140, shape: 'soft', stackStepMm: 380 },
  { pattern: /спич/, sizeMm: 50, widthMm: 35, shape: 'box', aspect: 1.35, stackStepMm: 12, bundleKind: 'matches', packSizes: PACK_PROFILES.matches.sizes, ...BUNDLE_RULE },
  { pattern: /банкнот/, sizeMm: 0.12, shape: 'flat', aspect: 2.18, stackStepMm: 0.12 },
  { pattern: /банковск.*карт|кредитн.*карт/, sizeMm: 0.8, shape: 'flat', aspect: 1.58, stackStepMm: 0.8 },
  { pattern: /монет/, sizeMm: 20.5, shape: 'disc', stackMode: 'pile', stackStepMm: 2.2, bundleKind: 'coins', packSizes: PACK_PROFILES.coins.sizes, ...BUNDLE_RULE },
  { pattern: /скрепк/, sizeMm: 1, shape: 'flat', aspect: 3.5, stackStepMm: 1.2, bundleKind: 'clips', packSizes: PACK_PROFILES.clips.sizes, ...BUNDLE_RULE },
  {
    pattern: /карандаш/,
    sizeMm: 175,
    widthMm: 8,
    shape: 'cylinder',
    stackStepMm: 10,
    bundleKind: 'pencils',
    packSizes: PACK_PROFILES.pencils.sizes,
    bundleHeightMm: 178,
    bundleWidthMm: 34,
    maxVisualLayers: 8,
    visualLayout: 'packs',
  },
  {
    pattern: /ручк/,
    sizeMm: 145,
    widthMm: 12,
    shape: 'cylinder',
    stackStepMm: 12,
    bundleKind: 'pens',
    packSizes: PACK_PROFILES.pens.sizes,
    bundleHeightMm: 148,
    bundleWidthMm: 38,
    maxVisualLayers: 8,
    visualLayout: 'packs',
  },
  { pattern: /ножниц/, sizeMm: 75, widthMm: 14, shape: 'flat', aspect: 6.5, stackStepMm: 14 },
  { pattern: /бритв/, sizeMm: 12, shape: 'flat', aspect: 5.5, stackStepMm: 12 },
  { pattern: /зубн.*щ[её]тк/, sizeMm: 190, widthMm: 18, shape: 'cylinder', stackStepMm: 190 },
  { pattern: /курин.*яйц|яйц/, sizeMm: 57, shape: 'disc', aspect: 0.78, stackStepMm: 52 },
  { pattern: /яблок/, sizeMm: 75, shape: 'disc', aspect: 1, stackStepMm: 68 },
  { pattern: /носк/, sizeMm: 38, widthMm: 90, shape: 'soft', stackStepMm: 38, bundleKind: 'socks', packSizes: PACK_PROFILES.socks.sizes, ...BUNDLE_RULE },
  { pattern: /бейсбол|бейсб/, sizeMm: 38, widthMm: 75, shape: 'soft', aspect: 2.0, stackStepMm: 38, bundleKind: 'discs', packSizes: PACK_PROFILES.discs.sizes, ...BUNDLE_RULE },
  { pattern: /кепк/, sizeMm: 120, widthMm: 220, shape: 'soft', aspect: 220 / 120, stackStepMm: 120 },
  { pattern: /кроссов/, sizeMm: 120, widthMm: 280, shape: 'soft', aspect: 280 / 120, stackStepMm: 120 },
  { pattern: /лягуш/, sizeMm: 80, widthMm: 55, shape: 'disc', aspect: 1.35, stackStepMm: 75 },
  { pattern: /шампиньон|гриб/, sizeMm: 55, widthMm: 45, shape: 'disc', stackStepMm: 50 },
  { pattern: /клубник/, sizeMm: 22, shape: 'disc', aspect: 1.2, stackStepMm: 20 },
  { pattern: /кревет/, sizeMm: 85, widthMm: 22, shape: 'disc', aspect: 2.8, stackStepMm: 80 },
  { pattern: /улитк/, sizeMm: 35, widthMm: 24, shape: 'disc', stackStepMm: 32 },
  { pattern: /булк|батон|хлеб/, sizeMm: 55, widthMm: 120, shape: 'soft', stackStepMm: 55 },
  { pattern: /настольн.*теннис|мячик.*теннис/, sizeMm: 40, shape: 'disc', aspect: 1, stackStepMm: 38, bundleKind: 'discs', packSizes: PACK_PROFILES.discs.sizes, ...BUNDLE_RULE },
  { pattern: /теннисн.*мяч/, sizeMm: 67, shape: 'disc', stackStepMm: 62, bundleKind: 'balls', packSizes: PACK_PROFILES.balls.sizes, ...BUNDLE_RULE },
  { pattern: /гольф/, sizeMm: 43, shape: 'disc', stackStepMm: 40, bundleKind: 'discs', packSizes: PACK_PROFILES.discs.sizes, ...BUNDLE_RULE },
  { pattern: /надут.*футбол|футбольн.*мяч/, sizeMm: 220, shape: 'disc', stackStepMm: 220, bundleKind: 'balls', packSizes: PACK_PROFILES.balls.sizes, ...BUNDLE_RULE },
  { pattern: /баскетбольн.*мяч/, sizeMm: 240, shape: 'disc', stackStepMm: 240, bundleKind: 'balls', packSizes: [3, 1], ...BUNDLE_RULE },
  { pattern: /гусениц/, sizeMm: 22, widthMm: 48, shape: 'soft', stackStepMm: 22, bundleKind: 'caterpillars', packSizes: PACK_PROFILES.caterpillars.sizes, ...BUNDLE_RULE },
  { pattern: /губк/, sizeMm: 70, widthMm: 110, shape: 'soft', stackStepMm: 70, bundleKind: 'sponges', packSizes: PACK_PROFILES.sponges.sizes, ...BUNDLE_RULE },
  { pattern: /плитк.*шоколад|шоколад.*100/, sizeMm: 18, widthMm: 100, shape: 'flat', aspect: 100 / 18, stackStepMm: 18, bundleKind: 'chocolate', packSizes: PACK_PROFILES.chocolate.sizes, ...BUNDLE_RULE },
  { pattern: /виноградин/, sizeMm: 18, shape: 'disc', stackStepMm: 16 },
  { pattern: /конфет|печень/, sizeMm: 12, shape: 'disc', stackStepMm: 10 },
  { pattern: /арахис|каштан|орех/, sizeMm: 14, shape: 'disc', stackStepMm: 12 },
  { pattern: /книг|учебник/, sizeMm: 235, widthMm: 158, shape: 'box', stackStepMm: 32, visualLayout: 'books', maxVisualLayers: 10 },
  { pattern: /коробк|упаковк/, sizeMm: 200, widthMm: 140, shape: 'box', stackStepMm: 200 },
  { pattern: /батарейк.*aa(?!a)/i, sizeMm: 50, widthMm: 14, shape: 'cylinder', stackStepMm: 50 },
  { pattern: /батарейк.*aaa/i, sizeMm: 44, widthMm: 10, shape: 'cylinder', stackStepMm: 44 },
  { pattern: /лампоч/, sizeMm: 105, widthMm: 60, shape: 'disc', stackStepMm: 100 },
  { pattern: /магнит/, sizeMm: 32, shape: 'box', aspect: 1.2, stackStepMm: 30 },
  { pattern: /шестер[её]н/, sizeMm: 18, shape: 'disc', aspect: 1, stackStepMm: 16 },
  { pattern: /пончик/, sizeMm: 32, shape: 'disc', aspect: 1.15, stackStepMm: 30 },
  { pattern: /банан/, sizeMm: 28, widthMm: 180, shape: 'disc', aspect: 6.4, stackStepMm: 26 },
  { pattern: /апельсин|мандарин/, sizeMm: 62, shape: 'disc', stackStepMm: 58, bundleKind: 'oranges', packSizes: PACK_PROFILES.oranges.sizes, ...BUNDLE_RULE },
  { pattern: /калькулятор/, sizeMm: 145, widthMm: 80, shape: 'box', stackStepMm: 12 },
  { pattern: /мыла/, sizeMm: 65, widthMm: 90, shape: 'box', stackStepMm: 65 },
  { pattern: /туалетн.*бумаг|рулон/, sizeMm: 110, widthMm: 120, shape: 'disc', stackStepMm: 110 },
  { pattern: /рюкзак/, sizeMm: 450, widthMm: 320, shape: 'soft', stackStepMm: 450, ...CLUSTER_RULE },
  { pattern: /чемодан/, sizeMm: 550, widthMm: 380, shape: 'box', stackStepMm: 550, ...CLUSTER_RULE },
  { pattern: /подушк/, sizeMm: 150, widthMm: 600, shape: 'soft', stackStepMm: 150 },
  { pattern: /стул/, sizeMm: 850, widthMm: 450, shape: 'box', stackStepMm: 850, ...CLUSTER_RULE },
  { pattern: /диван/, sizeMm: 850, widthMm: 2000, shape: 'box', stackStepMm: 850, maxVisualLayers: 2, visualLayout: 'cluster' },
  { pattern: /двер/, sizeMm: 2000, widthMm: 800, shape: 'box', stackStepMm: 2000, maxVisualLayers: 2, visualLayout: 'cluster' },
  { pattern: /кирпич/, sizeMm: 65, widthMm: 120, shape: 'box', stackStepMm: 65 },
  { pattern: /бутылк.*пив|пива/, sizeMm: 230, widthMm: 68, shape: 'cylinder', stackStepMm: 230 },
  { pattern: /бутылк.*вин|вина/, sizeMm: 300, widthMm: 75, shape: 'cylinder', stackStepMm: 300 },
  { pattern: /газировк|стакан.*330/, sizeMm: 145, widthMm: 66, shape: 'cylinder', stackStepMm: 145 },
  { pattern: /чашк.*коф|чашк.*ча/, sizeMm: 95, widthMm: 80, shape: 'cylinder', stackStepMm: 95 },
  { pattern: /арбуз/, sizeMm: 300, widthMm: 250, shape: 'disc', stackStepMm: 280 },
  { pattern: /гантел/, sizeMm: 180, widthMm: 320, shape: 'box', stackStepMm: 180 },
  { pattern: /гитар/, sizeMm: 1000, widthMm: 350, shape: 'box', stackStepMm: 1000, ...CLUSTER_RULE },
  { pattern: /ноутбук|лэптоп/, sizeMm: 25, widthMm: 320, shape: 'flat', aspect: 320 / 25, stackStepMm: 25 },
  { pattern: /смартфон|телефон/, sizeMm: 8, widthMm: 150, shape: 'flat', aspect: 150 / 8, stackStepMm: 8 },
  { pattern: /принтер/, sizeMm: 250, widthMm: 420, shape: 'box', stackStepMm: 250 },
  { pattern: /роутер/, sizeMm: 45, widthMm: 220, shape: 'box', stackStepMm: 45 },
  { pattern: /свеч/, sizeMm: 120, widthMm: 25, shape: 'cylinder', stackStepMm: 120 },
  { pattern: /гаечн.*ключ/, sizeMm: 250, widthMm: 60, shape: 'box', stackStepMm: 250, ...CLUSTER_RULE },
  {
    pattern: /ключ/,
    sizeMm: 55,
    widthMm: 22,
    shape: 'flat',
    stackStepMm: 4,
    bundleKind: 'keys',
    packSizes: PACK_PROFILES.keys.sizes,
    bundleHeightMm: 72,
    bundleWidthMm: 46,
    ...BUNDLE_RULE,
  },
];

function volumeToHeightMm(grams: number, densityGPerCm3 = 1): number {
  if (grams <= 0) return 20;
  const volumeCm3 = grams / densityGPerCm3;
  const edgeMm = Math.cbrt(volumeCm3) * 10;
  return Math.max(25, Math.min(900, edgeMm * 1.65));
}

function deriveStack(shape: ObjectShape, sizeMm: number, stackMode?: StackMode, stackStepMm?: number) {
  if (stackStepMm != null) {
    return { stackMode: stackMode ?? 'stack', stackStepMm };
  }
  if (shape === 'disc') {
    return { stackMode: stackMode ?? ('stack' as StackMode), stackStepMm: Math.max(2, sizeMm * 0.92) };
  }
  if (shape === 'flat') {
    return { stackMode: 'stack' as StackMode, stackStepMm: Math.max(0.5, sizeMm) };
  }
  return { stackMode: 'stack' as StackMode, stackStepMm: sizeMm };
}

function buildDims(
  sizeMm: number,
  shape: ObjectShape,
  aspect: number,
  stackMode?: StackMode,
  stackStepMm?: number,
  widthMm?: number,
  visualLayout?: VisualLayout,
  maxVisualLayers?: number,
  bundleKind?: PackKind,
  packSizes?: number[],
  unitsPerBundle?: number,
  bundleHeightMm?: number,
  bundleWidthMm?: number,
): ObjectDimensions {
  const stack = deriveStack(shape, sizeMm, stackMode, stackStepMm);
  const w = widthMm ?? sizeMm * aspect;
  const sizes = packSizes ?? (bundleKind ? PACK_PROFILES[bundleKind]?.sizes : undefined);
  return {
    sizeMm,
    widthMm: w,
    shape,
    aspect: w / sizeMm,
    visualLayout,
    maxVisualLayers,
    bundleKind,
    packSizes: sizes,
    unitsPerBundle,
    bundleHeightMm,
    bundleWidthMm,
    ...stack,
  };
}

function flatDims(lengthMm: number, thicknessMm: number): ObjectDimensions {
  return buildDims(thicknessMm, 'flat', lengthMm / thicknessMm, 'stack', thicknessMm, lengthMm);
}

export function resolveObjectDimensions(
  objectName: string,
  emoji: string,
  grams: number,
): ObjectDimensions {
  const name = objectName.toLowerCase();

  for (const rule of RULES) {
    if (rule.pattern.test(name)) {
      const aspect = rule.aspect ?? (rule.widthMm != null ? rule.widthMm / rule.sizeMm : 1);
      return buildDims(
        rule.sizeMm,
        rule.shape ?? 'generic',
        aspect,
        rule.stackMode,
        rule.stackStepMm,
        rule.widthMm,
        rule.visualLayout,
        rule.maxVisualLayers,
        rule.bundleKind,
        rule.packSizes,
        rule.unitsPerBundle,
        rule.bundleHeightMm,
        rule.bundleWidthMm,
      );
    }
  }

  const emojiDefaults: Record<string, Partial<ObjectDimensions> & { lengthMm?: number }> = {
    '🧴': { sizeMm: 220, widthMm: 68, shape: 'cylinder', stackStepMm: 220 },
    '🛴': { sizeMm: 1000, widthMm: 480, shape: 'box', stackStepMm: 1000, visualLayout: 'cluster', maxVisualLayers: 5 },
    '🐰': { sizeMm: 420, widthMm: 200, shape: 'soft', stackStepMm: 420, visualLayout: 'cluster', maxVisualLayers: 5 },
    '📖': { sizeMm: 235, widthMm: 158, shape: 'box', stackStepMm: 32, visualLayout: 'books', maxVisualLayers: 10 },
    '📚': { sizeMm: 235, widthMm: 158, shape: 'box', stackStepMm: 32, visualLayout: 'books', maxVisualLayers: 10 },
    '🔥': { sizeMm: 50, widthMm: 35, shape: 'box', stackStepMm: 50 },
    '💵': { lengthMm: 157, sizeMm: 0.12, shape: 'flat', stackStepMm: 0.12 },
    '💳': { lengthMm: 86, sizeMm: 0.8, shape: 'flat', stackStepMm: 0.8 },
    '💰': {
      sizeMm: 20.5,
      shape: 'disc',
      stackMode: 'pile',
      stackStepMm: 2.2,
      bundleKind: 'coins',
      unitsPerBundle: 25,
      bundleHeightMm: 28,
      bundleWidthMm: 28,
      maxVisualLayers: 10,
      visualLayout: 'bundle',
    },
    '🧦': { sizeMm: 38, widthMm: 90, shape: 'soft', stackStepMm: 38, bundleKind: 'socks', packSizes: PACK_PROFILES.socks.sizes, visualLayout: 'packs', maxVisualLayers: 10 },
    '🧢': { sizeMm: 120, widthMm: 220, shape: 'soft', stackStepMm: 120 },
    '🐸': { sizeMm: 80, widthMm: 55, shape: 'disc', stackStepMm: 75 },
    '✂️': { sizeMm: 75, widthMm: 14, shape: 'flat', stackStepMm: 14 },
    '🥚': { sizeMm: 57, shape: 'disc', stackStepMm: 52 },
    '🍎': { sizeMm: 75, shape: 'disc', stackStepMm: 68 },
    '🍄': { sizeMm: 55, widthMm: 45, shape: 'disc', stackStepMm: 50 },
    '🖊️': {
      sizeMm: 145,
      widthMm: 12,
      shape: 'cylinder',
      stackStepMm: 12,
      bundleKind: 'pens',
      unitsPerBundle: 10,
      bundleHeightMm: 148,
      bundleWidthMm: 38,
      maxVisualLayers: 8,
      visualLayout: 'bundle',
    },
    '✏️': {
      sizeMm: 175,
      widthMm: 8,
      shape: 'cylinder',
      stackStepMm: 10,
      bundleKind: 'pencils',
      unitsPerBundle: 12,
      bundleHeightMm: 178,
      bundleWidthMm: 34,
      maxVisualLayers: 8,
      visualLayout: 'bundle',
    },
    '⚽': { sizeMm: 220, shape: 'disc', stackStepMm: 220, bundleKind: 'balls', packSizes: PACK_PROFILES.balls.sizes, visualLayout: 'packs', maxVisualLayers: 10 },
    '🔑': {
      sizeMm: 55,
      widthMm: 22,
      shape: 'flat',
      stackStepMm: 4,
      bundleKind: 'keys',
      packSizes: PACK_PROFILES.keys.sizes,
      bundleHeightMm: 72,
      bundleWidthMm: 46,
      maxVisualLayers: 10,
      visualLayout: 'packs',
    },
  };

  const fromEmoji = emojiDefaults[emoji];
  if (fromEmoji) {
    if (fromEmoji.shape === 'flat' && fromEmoji.lengthMm) {
      return flatDims(fromEmoji.lengthMm, fromEmoji.sizeMm ?? 0.12);
    }
    const aspect =
      fromEmoji.aspect ??
      (fromEmoji.widthMm != null ? fromEmoji.widthMm / (fromEmoji.sizeMm ?? 50) : 1);
    return buildDims(
      fromEmoji.sizeMm ?? volumeToHeightMm(grams),
      fromEmoji.shape ?? 'generic',
      aspect,
      fromEmoji.stackMode,
      fromEmoji.stackStepMm,
      fromEmoji.widthMm,
      fromEmoji.visualLayout,
      fromEmoji.maxVisualLayers,
      fromEmoji.bundleKind,
      fromEmoji.packSizes,
      fromEmoji.unitsPerBundle,
      fromEmoji.bundleHeightMm,
      fromEmoji.bundleWidthMm,
    );
  }

  const heightMm = volumeToHeightMm(grams);
  const widthMm = heightMm * 0.4;
  const generic = buildDims(heightMm, 'generic', widthMm / heightMm, 'stack', heightMm, widthMm);
  if (heightMm < 120) {
    return {
      ...generic,
      shape: 'disc',
      visualLayout: 'packs',
      bundleKind: 'discs',
      packSizes: PACK_PROFILES.discs.sizes,
      maxVisualLayers: 10,
    };
  }
  return generic;
}

export function massBlobDiameterMm(grams: number, densityGPerCm3 = 1.05): number {
  if (grams <= 0) {
    return 10;
  }
  const volumeCm3 = grams / densityGPerCm3;
  const radiusCm = ((3 * volumeCm3) / (4 * Math.PI)) ** (1 / 3);
  return radiusCm * 2 * 10;
}

export const REAL_SCALE = {
  humanHeightMm: HUMAN_HEIGHT_MM,
  humanMassGrams: 70_000,
} as const;

/** Высота сцены слева с учётом типа раскладки */
export function stackDisplayHeightPx(
  count: number,
  dims: ObjectDimensions,
  mmToPx: (mm: number) => number,
): number {
  const { heightPx } = unitFootprintPx(dims, mmToPx);

  if (dims.visualLayout === 'cluster') {
    return heightPx;
  }

  if (dims.visualLayout === 'bundle' || dims.visualLayout === 'packs') {
    const kind = dims.bundleKind ?? 'discs';
    const sizes = dims.packSizes ?? PACK_PROFILES[kind].sizes;
    const unitH = mmToPx(PACK_PROFILES[kind].unitH);
    if (count < 1) {
      return unitH * 0.35;
    }
    const packs = decomposeIntoPacks(count, sizes);
    const { totalH } = layoutPacksOnGround(packs, kind, 0, 1000, mmToPx);
    return Math.max(unitH, totalH);
  }

  if (count < 1) {
    return Math.max(heightPx * 0.15, count * mmToPx(dims.stackStepMm));
  }
  return Math.max(heightPx, count * mmToPx(dims.stackStepMm));
}

/** Ширина и высота одного слоя в пикселях (линейный масштаб с человеком). */
export function unitFootprintPx(
  dims: ObjectDimensions,
  mmToPx: (mm: number) => number,
): { widthPx: number; heightPx: number } {
  const heightPx = mmToPx(dims.sizeMm);
  const widthPx = mmToPx(dims.widthMm ?? dims.sizeMm * dims.aspect);
  return { widthPx, heightPx };
}

export function bundleFootprintPx(
  dims: ObjectDimensions,
  mmToPx: (mm: number) => number,
): { widthPx: number; heightPx: number } {
  const heightPx = mmToPx(dims.bundleHeightMm ?? dims.sizeMm);
  const widthPx = mmToPx(dims.bundleWidthMm ?? dims.widthMm ?? dims.sizeMm * dims.aspect);
  return { widthPx, heightPx };
}
