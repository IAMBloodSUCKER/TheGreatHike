import type { ReactNode } from 'react';
import { safeEmoji } from '../emoji';
import { BundleKind, bundleFootprintPx, ObjectDimensions, stackDisplayHeightPx } from '../objectDimensions';

const MM_TO_PX_RATIO = 138 / 1700;

function mmToPx(mm: number): number {
  return mm * MM_TO_PX_RATIO;
}

function unitSizePx(dims: ObjectDimensions): { widthPx: number; heightPx: number } {
  const heightPx = mmToPx(dims.sizeMm);
  const widthPx = mmToPx(dims.widthMm ?? dims.sizeMm * dims.aspect);
  return { widthPx, heightPx };
}

function BookShape({
  x,
  y,
  w,
  h,
  tone,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  tone: number;
}) {
  const spine = Math.max(1.5, w * 0.11);
  const cover = `hsl(208, ${18 + tone * 4}%, ${34 + tone * 5}%)`;
  const pages = `hsl(210, ${12 + tone * 3}%, ${52 + tone * 4}%)`;
  const edge = `hsl(205, ${10 + tone * 2}%, ${28 + tone * 3}%)`;

  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={1.2} fill={pages} />
      <rect x={x} y={y} width={spine} height={h} rx={1} fill={edge} />
      <rect x={x + spine + 1} y={y + h * 0.08} width={w - spine - 2} height={h * 0.84} rx={0.8} fill={cover} />
      <line
        x1={x + spine + w * 0.22}
        y1={y + h * 0.2}
        x2={x + spine + w * 0.22}
        y2={y + h * 0.8}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="0.5"
      />
      <line
        x1={x}
        y1={y + h}
        x2={x + w}
        y2={y + h}
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="0.6"
      />
    </g>
  );
}

/** Стопка книг: реальная высота = count × толщина корешка, рисуем до 10 слоёв */
export function BookStackVisual({
  cx,
  groundY,
  count,
  dims,
  emoji,
}: {
  cx: number;
  groundY: number;
  count: number;
  dims: ObjectDimensions;
  emoji?: string;
}) {
  const { widthPx, heightPx } = unitSizePx(dims);
  const maxLayers = dims.maxVisualLayers ?? 10;
  const totalH = stackDisplayHeightPx(count, dims, mmToPx);
  const drawW = Math.max(widthPx, 18);

  if (count < 0.999) {
    const h = Math.max(heightPx * count, totalH);
    const top = groundY - h;
    return (
      <g>
        <BookShape x={cx - drawW / 2} y={top} w={drawW * count} h={h} tone={0} />
        {emoji && (
          <text
            x={cx}
            y={top + h * 0.5}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={Math.max(10, Math.min(drawW, h) * 0.55)}
            className="volume-item-emoji"
            opacity={0.85}
          >
            {safeEmoji(emoji)}
          </text>
        )}
      </g>
    );
  }

  const full = Math.floor(count + 0.001);
  const partial = count - full;
  const visualLayers = Math.min(maxLayers, Math.max(1, full + (partial > 0.05 ? 1 : 0)));
  const stepPx = totalH / visualLayers;
  const bookH = Math.min(heightPx, stepPx * 0.92);
  const stagger = Math.min(3, drawW * 0.06);

  const layers: { x: number; y: number; h: number; tone: number }[] = [];
  for (let i = 0; i < visualLayers; i++) {
    const isTop = i === visualLayers - 1;
    const layerH = isTop && partial > 0.05 ? bookH * partial : bookH;
    const y = groundY - (i + 1) * stepPx + (stepPx - layerH) * 0.5;
    const xOff = (i % 2 === 0 ? -1 : 1) * stagger * Math.min(i, 2);
    layers.push({ x: cx - drawW / 2 + xOff, y, h: layerH, tone: i });
  }

  return (
    <g>
      {layers.map((layer, i) => (
        <BookShape key={`book-${i}`} x={layer.x} y={layer.y} w={drawW} h={layer.h} tone={layer.tone} />
      ))}
      {partial > 0.05 && (
        <line
          x1={cx - drawW / 2 - 2}
          y1={groundY - totalH}
          x2={cx + drawW / 2 + 2}
          y2={groundY - totalH}
          stroke="var(--accent)"
          strokeWidth="0.8"
          strokeDasharray="2 2"
          opacity="0.85"
        />
      )}
      {emoji && visualLayers <= 4 && (
        <text
          x={cx}
          y={groundY - totalH + Math.min(stepPx, bookH) * 0.55}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.max(10, Math.min(drawW, bookH) * 0.5)}
          className="volume-item-emoji"
        >
          {safeEmoji(emoji)}
        </text>
      )}
    </g>
  );
}

function SingleKeyShape({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const headR = Math.min(w, h) * 0.2;
  const headCx = x + w * 0.28;
  const headCy = y + h * 0.22;
  return (
    <g>
      <rect
        x={x + w * 0.42}
        y={y + h * 0.18}
        width={w * 0.48}
        height={h * 0.1}
        rx={1}
        fill="#c9b060"
        stroke="#8a7340"
        strokeWidth="0.5"
      />
      <rect
        x={x + w * 0.5}
        y={y + h * 0.28}
        width={w * 0.12}
        height={h * 0.58}
        rx={0.8}
        fill="#b8a050"
        stroke="#7a6535"
        strokeWidth="0.4"
      />
      <circle cx={headCx} cy={headCy} r={headR} fill="#d4bc6a" stroke="#8a7340" strokeWidth="0.6" />
      <circle cx={headCx} cy={headCy} r={headR * 0.45} fill="none" stroke="#6a5830" strokeWidth="0.5" />
    </g>
  );
}

function KeyBunchShape({
  x,
  y,
  w,
  h,
  fullness = 1,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  fullness?: number;
}) {
  const ringCx = x + w * 0.38;
  const ringCy = y + h * 0.58;
  const ringR = Math.min(w, h) * 0.16;
  const keyCount = Math.max(2, Math.round(6 * Math.min(1, fullness)));
  const angles = [-0.55, -0.2, 0.15, 0.45, 0.72, 0.95].slice(0, keyCount);

  return (
    <g>
      <circle cx={ringCx} cy={ringCy} r={ringR} fill="none" stroke="#c9a227" strokeWidth={Math.max(1.2, ringR * 0.22)} />
      {angles.map((angle, i) => {
        const len = h * 0.42;
        const tipX = ringCx + Math.sin(angle) * len;
        const tipY = ringCy - Math.cos(angle) * len;
        return (
          <line
            key={`k-${i}`}
            x1={ringCx + Math.sin(angle) * ringR * 0.7}
            y1={ringCy - Math.cos(angle) * ringR * 0.7}
            x2={tipX}
            y2={tipY}
            stroke="#c9b060"
            strokeWidth={Math.max(1.5, w * 0.07)}
            strokeLinecap="round"
          />
        );
      })}
      <circle cx={ringCx} cy={ringCy} r={ringR * 0.35} fill="#8a7340" opacity="0.35" />
    </g>
  );
}

function PenBundleShape({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const penCount = 7;
  const gap = w / (penCount + 1);
  const pens = Array.from({ length: penCount }, (_, i) => {
    const px = x + gap * (i + 1) - gap * 0.22;
    const tone = 200 + i * 8;
    return (
      <g key={`pen-${i}`}>
        <rect x={px} y={y + h * 0.12} width={gap * 0.44} height={h * 0.78} rx={gap * 0.15} fill={`hsl(${tone}, 45%, 42%)`} />
        <rect x={px} y={y + h * 0.04} width={gap * 0.44} height={h * 0.1} rx={1} fill={`hsl(${tone}, 30%, 28%)`} />
        <polygon
          points={`${px + gap * 0.1},${y + h * 0.9} ${px + gap * 0.34},${y + h * 0.9} ${px + gap * 0.22},${y + h * 0.98}`}
          fill="#2a3540"
        />
      </g>
    );
  });

  return (
    <g>
      {pens}
      <ellipse cx={x + w / 2} cy={y + h * 0.1} rx={w * 0.42} ry={h * 0.05} fill="none" stroke="#6a7a88" strokeWidth="1.2" opacity="0.7" />
      <rect x={x + w * 0.08} y={y + h * 0.88} width={w * 0.84} height={h * 0.06} rx={2} fill="rgba(255,255,255,0.08)" />
    </g>
  );
}

function PencilBundleShape({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const penCount = 8;
  const gap = w / (penCount + 1);
  const pencils = Array.from({ length: penCount }, (_, i) => {
    const px = x + gap * (i + 1) - gap * 0.18;
    const wood = `hsl(38, ${55 + i * 2}%, ${48 + (i % 3) * 4}%)`;
    return (
      <g key={`pencil-${i}`}>
        <rect x={px} y={y + h * 0.1} width={gap * 0.36} height={h * 0.8} rx={0.8} fill={wood} stroke="#6a5030" strokeWidth="0.3" />
        <polygon
          points={`${px + gap * 0.04},${y + h * 0.1} ${px + gap * 0.32},${y + h * 0.1} ${px + gap * 0.18},${y + h * 0.02}`}
          fill="#2a3540"
        />
      </g>
    );
  });

  return (
    <g>
      {pencils}
      <ellipse cx={x + w / 2} cy={y + h * 0.08} rx={w * 0.44} ry={h * 0.045} fill="none" stroke="#8a5030" strokeWidth="1" opacity="0.65" />
    </g>
  );
}

function CoinRollShape({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const layers = Math.min(6, Math.max(3, Math.round(h / 5)));
  const layerH = h / layers;
  return (
    <g>
      {Array.from({ length: layers }, (_, i) => (
        <ellipse
          key={`coin-${i}`}
          cx={x + w / 2}
          cy={y + h - layerH * (i + 0.5)}
          rx={w * 0.46}
          ry={Math.max(2, layerH * 0.42)}
          fill={`hsl(42, ${50 - i * 3}%, ${42 + i * 4}%)`}
          stroke="#8a7030"
          strokeWidth="0.4"
        />
      ))}
    </g>
  );
}

function MatchboxBundleShape({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const boxW = w * 0.42;
  const boxH = h * 0.88;
  const boxes = [0, 1].map((i) => (
    <g key={`box-${i}`} transform={`translate(${x + i * boxW * 0.55}, ${y + i * h * 0.04})`}>
      <rect x={0} y={0} width={boxW} height={boxH} rx={2} fill={i === 0 ? '#a04030' : '#8a3530'} stroke="#5a2018" strokeWidth="0.5" />
      <rect x={boxW * 0.12} y={boxH * 0.2} width={boxW * 0.76} height={boxH * 0.25} rx={1} fill="#d06040" opacity="0.5" />
    </g>
  ));
  return <g>{boxes}</g>;
}

function PaperclipBunchShape({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const clips = [0, 1, 2, 3].map((i) => {
    const cx = x + w * (0.25 + i * 0.18);
    const cy = y + h * (0.35 + (i % 2) * 0.15);
    const s = Math.min(w, h) * 0.22;
    return (
      <path
        key={`clip-${i}`}
        d={`M ${cx - s * 0.3} ${cy + s * 0.4} Q ${cx - s * 0.5} ${cy - s * 0.2} ${cx} ${cy - s * 0.35} Q ${cx + s * 0.55} ${cy - s * 0.1} ${cx + s * 0.35} ${cy + s * 0.35}`}
        fill="none"
        stroke="#9aa8b8"
        strokeWidth={Math.max(1.2, s * 0.18)}
        strokeLinecap="round"
      />
    );
  });
  return <g>{clips}</g>;
}

function SinglePenShape({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const pw = w * 0.28;
  const px = x + (w - pw) / 2;
  return (
    <g>
      <rect x={px} y={y + h * 0.1} width={pw} height={h * 0.78} rx={pw * 0.2} fill="#4a6a88" />
      <rect x={px} y={y + h * 0.04} width={pw} height={h * 0.08} rx={1} fill="#2a3540" />
      <polygon
        points={`${px + pw * 0.15},${y + h * 0.88} ${px + pw * 0.85},${y + h * 0.88} ${px + pw * 0.5},${y + h * 0.98}`}
        fill="#1a2028"
      />
    </g>
  );
}

function SinglePencilShape({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const pw = w * 0.22;
  const px = x + (w - pw) / 2;
  return (
    <g>
      <rect x={px} y={y + h * 0.08} width={pw} height={h * 0.82} rx={0.8} fill="#d4a050" stroke="#8a6030" strokeWidth="0.4" />
      <polygon
        points={`${px},${y + h * 0.08} ${px + pw},${y + h * 0.08} ${px + pw / 2},${y}`}
        fill="#2a3540"
      />
    </g>
  );
}

function SingleBundleShape({
  kind,
  x,
  y,
  w,
  h,
}: {
  kind: BundleKind;
  x: number;
  y: number;
  w: number;
  h: number;
}) {
  switch (kind) {
    case 'keys':
      return <SingleKeyShape x={x} y={y} w={w} h={h} />;
    case 'pens':
      return <SinglePenShape x={x} y={y} w={w} h={h} />;
    case 'pencils':
      return <SinglePencilShape x={x} y={y} w={w} h={h} />;
    case 'coins':
      return <CoinRollShape x={x} y={y} w={w} h={h * 0.35} />;
    case 'matches':
      return <MatchboxBundleShape x={x} y={y} w={w * 0.55} h={h} />;
    case 'clips':
      return <PaperclipBunchShape x={x} y={y} w={w * 0.6} h={h * 0.7} />;
    default:
      return <SingleKeyShape x={x} y={y} w={w} h={h} />;
  }
}

function BundleLayerShape({
  kind,
  x,
  y,
  w,
  h,
  fullness,
}: {
  kind: BundleKind;
  x: number;
  y: number;
  w: number;
  h: number;
  fullness: number;
}) {
  switch (kind) {
    case 'keys':
      return fullness < 0.45 ? (
        <SingleKeyShape x={x} y={y} w={w} h={h} />
      ) : (
        <KeyBunchShape x={x} y={y} w={w} h={h} fullness={fullness} />
      );
    case 'pens':
      return <PenBundleShape x={x} y={y} w={w} h={h} />;
    case 'pencils':
      return <PencilBundleShape x={x} y={y} w={w} h={h} />;
    case 'coins':
      return <CoinRollShape x={x} y={y} w={w} h={h} />;
    case 'matches':
      return <MatchboxBundleShape x={x} y={y} w={w} h={h} />;
    case 'clips':
      return <PaperclipBunchShape x={x} y={y} w={w} h={h} />;
    default:
      return <KeyBunchShape x={x} y={y} w={w} h={h} fullness={fullness} />;
  }
}

/** Связки/пачки: реальная высота кучи, рисуем до N повторяющихся связок */
export function BundleStackVisual({
  cx,
  groundY,
  count,
  dims,
  emoji,
}: {
  cx: number;
  groundY: number;
  count: number;
  dims: ObjectDimensions;
  emoji?: string;
}) {
  const kind = dims.bundleKind ?? 'keys';
  const maxLayers = dims.maxVisualLayers ?? 10;
  const { widthPx, heightPx } = bundleFootprintPx(dims, mmToPx);
  const totalH = stackDisplayHeightPx(count, dims, mmToPx);
  const drawW = Math.max(widthPx, 20);

  if (count < 0.999) {
    const h = Math.max(heightPx * 0.35, totalH);
    const top = groundY - h;
    return (
      <g>
        <BundleLayerShape kind={kind} x={cx - drawW / 2} y={top} w={drawW * Math.max(0.25, count)} h={h} fullness={count} />
      </g>
    );
  }

  if (count <= 1.001) {
    const singleH = mmToPx(dims.sizeMm);
    const singleW = Math.max(mmToPx(dims.widthMm ?? dims.sizeMm * dims.aspect), 14);
    const top = groundY - singleH;
    return (
      <g>
        <SingleBundleShape kind={kind} x={cx - singleW / 2} y={top} w={singleW} h={singleH} />
        {emoji && (
          <text
            x={cx}
            y={top + singleH * 0.5}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={Math.max(12, Math.min(singleW, singleH) * 0.45)}
            className="volume-item-emoji"
            opacity={0.9}
          >
            {safeEmoji(emoji)}
          </text>
        )}
      </g>
    );
  }

  const unitsPerBundle = dims.unitsPerBundle ?? 8;
  if (count < unitsPerBundle) {
    const top = groundY - heightPx;
    return (
      <g>
        <BundleLayerShape
          kind={kind}
          x={cx - drawW / 2}
          y={top}
          w={drawW}
          h={heightPx}
          fullness={count / unitsPerBundle}
        />
      </g>
    );
  }

  const bundleCount = count / unitsPerBundle;
  const fullBundles = Math.floor(bundleCount + 0.001);
  const partialBundle = bundleCount - fullBundles;
  const visualLayers = Math.min(maxLayers, Math.max(1, fullBundles + (partialBundle > 0.05 ? 1 : 0)));
  const stepPx = totalH / visualLayers;
  const layerH = Math.min(heightPx, stepPx * 0.9);
  const stagger = Math.min(2.5, drawW * 0.05);

  const layers: { x: number; y: number; h: number; fullness: number }[] = [];
  for (let i = 0; i < visualLayers; i++) {
    const isTop = i === visualLayers - 1;
    const fullness = isTop && partialBundle > 0.05 ? partialBundle : 1;
    const h = isTop && partialBundle > 0.05 ? layerH * partialBundle : layerH;
    const y = groundY - (i + 1) * stepPx + (stepPx - h) * 0.5;
    const xOff = (i % 2 === 0 ? -1 : 1) * stagger * Math.min(i, 2);
    layers.push({ x: cx - drawW / 2 + xOff, y, h, fullness });
  }

  return (
    <g>
      {layers.map((layer, i) => (
        <BundleLayerShape
          key={`bundle-${i}`}
          kind={kind}
          x={layer.x}
          y={layer.y}
          w={drawW}
          h={layer.h}
          fullness={layer.fullness}
        />
      ))}
      {partialBundle > 0.05 && (
        <line
          x1={cx - drawW / 2 - 2}
          y1={groundY - totalH}
          x2={cx + drawW / 2 + 2}
          y2={groundY - totalH}
          stroke="var(--accent)"
          strokeWidth="0.8"
          strokeDasharray="2 2"
          opacity="0.85"
        />
      )}
      {emoji && visualLayers <= 3 && (
        <text
          x={cx}
          y={groundY - totalH + Math.min(stepPx, layerH) * 0.5}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.max(11, Math.min(drawW, layerH) * 0.42)}
          className="volume-item-emoji"
        >
          {safeEmoji(emoji)}
        </text>
      )}
    </g>
  );
}

export function clusterSpreadWidthPx(count: number, dims: ObjectDimensions): number {
  const maxLayers = dims.maxVisualLayers ?? 5;
  const full = Math.floor(count + 0.001);
  const partial = count - full;
  const totalUnits = Math.min(maxLayers, full + (partial > 0.05 ? 1 : 0));
  if (totalUnits <= 1) {
    return unitSizePx(dims).widthPx;
  }
  const { widthPx } = unitSizePx(dims);
  const overlap = Math.min(widthPx * 0.5, 32);
  const spread = widthPx - overlap;
  return widthPx + (totalUnits - 1) * spread;
}

function clusterUnits(count: number, dims: ObjectDimensions): { cx: number; fraction: number }[] {
  const maxLayers = dims.maxVisualLayers ?? 5;
  const full = Math.floor(count + 0.001);
  const partial = count - full;
  const hasPartial = partial > 0.05;
  const totalUnits = Math.min(maxLayers, full + (hasPartial ? 1 : 0));
  if (totalUnits <= 0) {
    return [];
  }

  const { widthPx } = unitSizePx(dims);
  const overlap = Math.min(widthPx * 0.5, 32);
  const spread = widthPx - overlap;
  const totalWidth = widthPx + (totalUnits - 1) * spread;

  const result: { cx: number; fraction: number }[] = [];
  for (let i = 0; i < totalUnits; i++) {
    const cx = -totalWidth / 2 + widthPx / 2 + i * spread;
    const isPartialLayer = hasPartial && i === totalUnits - 1 && i >= full;
    result.push({ cx, fraction: isPartialLayer ? partial : 1 });
  }
  return result;
}

/** Крупные предметы рядом, каждый в полном масштабе */
export function SideClusterVisual({
  cx,
  groundY,
  count,
  dims,
  emoji,
  renderUnit,
}: {
  cx: number;
  groundY: number;
  count: number;
  dims: ObjectDimensions;
  emoji?: string;
  renderUnit: (props: {
    cx: number;
    bottom: number;
    fraction: number;
    stackIndex: number;
    clipId: string;
  }) => ReactNode;
}) {
  if (count < 0.999) {
    return (
      <>
        {renderUnit({
          cx,
          bottom: groundY,
          fraction: count,
          stackIndex: 0,
          clipId: 'cluster-frac',
        })}
      </>
    );
  }

  const units = clusterUnits(count, dims);
  return (
    <>
      {units.map((unit, i) =>
        renderUnit({
          cx: cx + unit.cx,
          bottom: groundY,
          fraction: unit.fraction,
          stackIndex: i,
          clipId: `cluster-${i}`,
        }),
      )}
      {emoji && units.length === 1 && (
        <text
          x={cx}
          y={groundY - unitSizePx(dims).heightPx * 0.52}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.max(14, Math.min(unitSizePx(dims).widthPx, unitSizePx(dims).heightPx) * 0.45)}
          className="volume-item-emoji"
        >
          {safeEmoji(emoji)}
        </text>
      )}
    </>
  );
}
