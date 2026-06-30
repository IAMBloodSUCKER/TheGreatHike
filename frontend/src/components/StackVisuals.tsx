import type { ReactNode } from 'react';
import { safeEmoji } from '../emoji';
import { decomposeIntoPacks, layoutPacksOnGround, PackKind, PACK_PROFILES } from '../packLayout';
import { bundleFootprintPx, ObjectDimensions, stackDisplayHeightPx } from '../objectDimensions';

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
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  fullness?: number;
}) {
  const ringCx = x + w * 0.42;
  const ringCy = y + h * 0.62;
  const ringR = Math.min(w, h) * 0.2;
  const keyCount = 8;
  const angles = [-0.75, -0.45, -0.15, 0.12, 0.38, 0.62, 0.85, 1.05];

  return (
    <g>
      <ellipse cx={x + w / 2} cy={y + h * 0.96} rx={w * 0.44} ry={h * 0.06} fill="#000" opacity="0.14" />
      <circle
        cx={ringCx}
        cy={ringCy}
        r={ringR}
        fill="none"
        stroke="#e0b830"
        strokeWidth={Math.max(2, ringR * 0.28)}
      />
      {angles.slice(0, keyCount).map((angle, i) => {
        const len = h * 0.5;
        const tipX = ringCx + Math.sin(angle) * len;
        const tipY = ringCy - Math.cos(angle) * len;
        const shaftW = Math.max(2.2, w * 0.09);
        return (
          <g key={`k-${i}`}>
            <line
              x1={ringCx + Math.sin(angle) * ringR * 0.75}
              y1={ringCy - Math.cos(angle) * ringR * 0.75}
              x2={tipX}
              y2={tipY}
              stroke="#d4b84a"
              strokeWidth={shaftW}
              strokeLinecap="round"
            />
            <circle cx={tipX} cy={tipY} r={shaftW * 0.9} fill="#c9a830" stroke="#7a6530" strokeWidth="0.4" />
            <circle
              cx={ringCx + Math.sin(angle) * ringR * 1.1}
              cy={ringCy - Math.cos(angle) * ringR * 1.1}
              r={shaftW * 1.1}
              fill="#e8cc60"
              stroke="#8a7340"
              strokeWidth="0.5"
            />
          </g>
        );
      })}
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

function PackShape({
  kind,
  packSize,
  x,
  y,
  w,
  h,
}: {
  kind: PackKind;
  packSize: number;
  x: number;
  y: number;
  w: number;
  h: number;
}) {
  switch (kind) {
    case 'balls':
      return <BallPackShape x={x} y={y} w={w} h={h} count={packSize} />;
    case 'sponges':
      return <SpongePackShape x={x} y={y} w={w} h={h} count={packSize} />;
    case 'oranges':
      return <OrangePackShape x={x} y={y} w={w} h={h} count={packSize} />;
    case 'chocolate':
      return <ChocolatePackShape x={x} y={y} w={w} h={h} count={packSize} />;
    case 'socks':
      return <SockPackShape x={x} y={y} w={w} h={h} count={packSize} />;
    case 'caterpillars':
      return <CaterpillarPackShape x={x} y={y} w={w} h={h} count={packSize} />;
    case 'keys':
      return packSize <= 1 ? (
        <SingleKeyShape x={x} y={y} w={w} h={h} />
      ) : (
        <KeyBunchShape x={x} y={y} w={w} h={h} />
      );
    case 'pens':
      return packSize <= 1 ? (
        <SinglePenShape x={x} y={y} w={w} h={h} />
      ) : (
        <PenBundleShape x={x} y={y} w={w} h={h} />
      );
    case 'pencils':
      return packSize <= 1 ? (
        <SinglePencilShape x={x} y={y} w={w} h={h} />
      ) : (
        <PencilBundleShape x={x} y={y} w={w} h={h} />
      );
    case 'coins':
      return <CoinRollShape x={x} y={y} w={w} h={h} />;
    case 'matches':
      return <MatchboxBundleShape x={x} y={y} w={w} h={h} />;
    case 'clips':
      return <PaperclipBunchShape x={x} y={y} w={w} h={h} />;
    default:
      return <OrangePackShape x={x} y={y} w={w} h={h} count={Math.min(packSize, 5)} />;
  }
}

function BallPackShape({ x, y, w, h, count }: { x: number; y: number; w: number; h: number; count: number }) {
  const r = Math.min(w, h) * 0.22;
  const cy = y + h - r - 2;
  const positions =
    count >= 5
      ? [
          { cx: x + w * 0.5, cy: cy - r * 1.6 },
          { cx: x + w * 0.32, cy },
          { cx: x + w * 0.68, cy },
          { cx: x + w * 0.22, cy: cy - r * 0.5 },
          { cx: x + w * 0.78, cy: cy - r * 0.5 },
        ]
      : count >= 3
        ? [
            { cx: x + w * 0.5, cy: cy - r * 0.9 },
            { cx: x + w * 0.3, cy },
            { cx: x + w * 0.7, cy },
          ]
        : [{ cx: x + w * 0.5, cy }];

  return (
    <g>
      {count > 1 && (
        <path
          d={`M ${x + 4} ${y + h - 2} Q ${x + w / 2} ${y + 4} ${x + w - 4} ${y + h - 2}`}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1"
        />
      )}
      {positions.map((p, i) => (
        <g key={`ball-${i}`}>
          <circle cx={p.cx} cy={p.cy} r={r} fill="#f5f5f0" stroke="#888" strokeWidth="0.6" />
          <path
            d={`M ${p.cx - r * 0.6} ${p.cy} Q ${p.cx} ${p.cy - r * 0.3} ${p.cx + r * 0.6} ${p.cy}`}
            fill="none"
            stroke="#aaa"
            strokeWidth="0.5"
          />
        </g>
      ))}
    </g>
  );
}

function SpongePackShape({ x, y, w, h, count }: { x: number; y: number; w: number; h: number; count: number }) {
  const layers = count >= 10 ? 4 : count >= 5 ? 3 : 1;
  const layerH = h / layers;
  return (
    <g>
      {Array.from({ length: layers }, (_, i) => (
        <g key={`sp-${i}`}>
          <rect
            x={x + i * 2}
            y={y + h - (i + 1) * layerH}
            width={w - i * 3}
            height={layerH - 2}
            rx={3}
            fill={`hsl(48, ${70 - i * 5}%, ${52 + i * 4}%)`}
            stroke="#8a9030"
            strokeWidth="0.5"
          />
        </g>
      ))}
    </g>
  );
}

function OrangePackShape({ x, y, w, h, count }: { x: number; y: number; w: number; h: number; count: number }) {
  if (count >= 20) {
    return (
      <g>
        <rect x={x} y={y + h * 0.2} width={w} height={h * 0.75} rx={3} fill="#8b5a2b" stroke="#5a3818" strokeWidth="0.6" />
        {Array.from({ length: 6 }, (_, i) => (
          <circle
            key={`o-${i}`}
            cx={x + w * (0.2 + (i % 3) * 0.3)}
            cy={y + h * (0.45 + Math.floor(i / 3) * 0.22)}
            r={Math.min(w, h) * 0.12}
            fill="#f08030"
          />
        ))}
      </g>
    );
  }
  const n = Math.min(count, 10);
  const cols = n <= 3 ? n : n <= 5 ? 3 : 5;
  const r = Math.min(w / (cols + 1), h * 0.22);
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cx = x + w * 0.5 + (col - (cols - 1) / 2) * r * 2.1;
        const cy = y + h - r - 2 - row * r * 1.7;
        return <circle key={`o-${i}`} cx={cx} cy={cy} r={r} fill="#f08030" stroke="#c06020" strokeWidth="0.4" />;
      })}
    </g>
  );
}

function ChocolatePackShape({ x, y, w, h, count }: { x: number; y: number; w: number; h: number; count: number }) {
  if (count >= 20) {
    return (
      <g>
        <rect x={x} y={y + h * 0.15} width={w} height={h * 0.8} rx={2} fill="#6a3020" stroke="#3a1810" strokeWidth="0.6" />
        <rect x={x + w * 0.1} y={y + h * 0.25} width={w * 0.8} height={h * 0.15} rx={1} fill="#a04030" opacity="0.6" />
      </g>
    );
  }
  const bars = Math.min(count, 15);
  const cols = bars <= 3 ? bars : bars <= 5 ? 3 : 5;
  const barW = w / cols - 2;
  const barH = h * 0.75;
  return (
    <g>
      {Array.from({ length: bars }, (_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const bx = x + col * (barW + 2) + 1;
        const by = y + h - barH - row * (barH * 0.35) - 2;
        return (
          <rect key={`ch-${i}`} x={bx} y={by} width={barW} height={barH} rx={1} fill="#8b3a28" stroke="#5a2018" strokeWidth="0.4" />
        );
      })}
    </g>
  );
}

function SockPackShape({ x, y, w, h, count }: { x: number; y: number; w: number; h: number; count: number }) {
  const n = Math.min(count, 12);
  const hues = [18, 32, 200, 140, 280, 45, 10, 350];
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const hue = hues[i % hues.length];
        const ox = (i % 4) * (w * 0.22) - w * 0.1;
        const oy = Math.floor(i / 4) * (h * 0.18);
        const cx = x + w * 0.45 + ox;
        const cy = y + h * 0.75 - oy;
        return (
          <ellipse
            key={`sock-${i}`}
            cx={cx}
            cy={cy}
            rx={w * 0.2}
            ry={h * 0.22}
            fill={`hsl(${hue}, 55%, 45%)`}
            stroke={`hsl(${hue}, 40%, 30%)`}
            strokeWidth="0.4"
            transform={`rotate(${(i % 3) * 12 - 12} ${cx} ${cy})`}
          />
        );
      })}
    </g>
  );
}

function CaterpillarPackShape({ x, y, w, h, count }: { x: number; y: number; w: number; h: number; count: number }) {
  const n = Math.min(count, 5);
  const segR = Math.min(w / (n * 2.2), h * 0.28);
  const baseY = y + h - segR - 2;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const cx = x + segR + i * segR * 1.9;
        return (
          <g key={`cat-${i}`}>
            <circle cx={cx} cy={baseY} r={segR} fill={`hsl(95, ${50 + i * 3}%, ${38 + i * 4}%)`} stroke="#3a6020" strokeWidth="0.4" />
            {i === 0 && (
              <>
                <circle cx={cx - segR * 0.35} cy={baseY - segR * 0.35} r={segR * 0.12} fill="#1a2018" />
                <circle cx={cx + segR * 0.15} cy={baseY - segR * 0.35} r={segR * 0.12} fill="#1a2018" />
              </>
            )}
          </g>
        );
      })}
    </g>
  );
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

/** Пачки на полу — целые связки, без дробления */
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
  const kind = dims.bundleKind ?? 'discs';
  const sizes = dims.packSizes ?? PACK_PROFILES[kind].sizes;
  const whole = Math.max(0, Math.floor(count + 0.0001));
  const packs = decomposeIntoPacks(whole, sizes);
  const { placed, hidden } = layoutPacksOnGround(packs, kind, cx, groundY, mmToPx);

  return (
    <g>
      {placed.map((p, i) => (
        <PackShape key={`pack-${i}`} kind={kind} packSize={p.size} x={p.x} y={p.y} w={p.w} h={p.h} />
      ))}
      {hidden > 0 && (
        <text x={cx} y={placed.length ? Math.min(...placed.map((p) => p.y)) - 6 : groundY - 12} textAnchor="middle" fill="#9aa8b8" fontSize="9">
          +{hidden} пачек
        </text>
      )}
      {emoji && placed.length <= 2 && whole <= 3 && (
        <text
          x={cx}
          y={groundY - mmToPx(dims.sizeMm) * 0.5}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={14}
          className="volume-item-emoji"
          opacity={0.85}
        >
          {safeEmoji(emoji)}
        </text>
      )}
    </g>
  );
}

export function clusterSpreadWidthPx(count: number, dims: ObjectDimensions): number {
  const maxLayers = dims.maxVisualLayers ?? 5;
  const whole = Math.floor(count + 0.001);
  const totalUnits = Math.min(maxLayers, Math.max(whole, count < 1 ? 1 : 0));
  if (totalUnits <= 1) {
    return unitSizePx(dims).widthPx;
  }
  const { widthPx } = unitSizePx(dims);
  const overlap = Math.min(widthPx * 0.35, 28);
  const spread = widthPx - overlap;
  return widthPx + (totalUnits - 1) * spread;
}

function clusterUnits(count: number, dims: ObjectDimensions): { cx: number }[] {
  const maxLayers = dims.maxVisualLayers ?? 5;
  const whole = Math.max(1, Math.floor(count + 0.001));
  const totalUnits = Math.min(maxLayers, whole);
  const { widthPx } = unitSizePx(dims);
  const overlap = Math.min(widthPx * 0.35, 28);
  const spread = widthPx - overlap;
  const totalWidth = widthPx + (totalUnits - 1) * spread;

  const result: { cx: number }[] = [];
  for (let i = 0; i < totalUnits; i++) {
    result.push({ cx: -totalWidth / 2 + widthPx / 2 + i * spread });
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
  const whole = Math.max(0, Math.floor(count + 0.001));
  if (whole <= 0) {
    return null;
  }

  const units = clusterUnits(whole, dims);
  return (
    <>
      {units.map((unit, i) =>
        renderUnit({
          cx: cx + unit.cx,
          bottom: groundY,
          fraction: 1,
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
