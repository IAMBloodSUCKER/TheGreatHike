import { useEffect, useId, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { api, ComparisonVisual, VolumePreview } from '../api';
import { cleanComparisonText, parseComparisonLine, safeEmoji } from '../emoji';
import {
  massBlobDiameterMm,
  ObjectDimensions,
  REAL_SCALE,
  resolveObjectDimensions,
  stackDisplayHeightPx,
  unitFootprintPx,
} from '../objectDimensions';
import { BookStackVisual, BundleStackVisual, clusterSpreadWidthPx, SideClusterVisual } from './StackVisuals';
import { formatGrams } from '../utils';
import HumanFigure, { humanGenderLabel } from './HumanFigure';
import { useAuth } from '../hooks/useAuth';

interface VolumeVisualizerProps {
  open: boolean;
  grams: number;
  colorHex: string;
  periodLabel?: string;
  compareSeed?: string;
  onClose: () => void;
}

const HUMAN_HEIGHT_PX = 138;
const MM_TO_PX = HUMAN_HEIGHT_PX / REAL_SCALE.humanHeightMm;
const LEFT_X = 88;
const RIGHT_X = 268;
const MAX_DRAW_ITEMS = 350;
const MIN_SVG_H = 220;
const MAX_SVG_H = 520;
/** Ниже — рисуем одну стопку с полосками слоёв, иначе каша из эмодзи */
const MIN_LAYER_PX = 4.5;
const NEAT_STACK_MIN_COUNT = 2;

type CompareTarget = 'visit' | number;

function itemObjectName(item: ComparisonVisual): string {
  if (item.objectName) {
    return item.objectName;
  }
  const parsed = parseComparisonLine(item.text);
  const match = parsed.text.match(/^[\d.,]+\s+(.+)$/);
  return match?.[1] ?? parsed.text;
}

function formatCount(value: number): string {
  if (value >= 100) {
    return value.toFixed(0);
  }
  if (value >= 10) {
    return value.toFixed(1);
  }
  if (value >= 1) {
    return value.toFixed(1);
  }
  return value.toFixed(2);
}

function mmToPx(mm: number): number {
  return mm * MM_TO_PX;
}

/** Минимальная ширина силуэта стопки (высота остаётся в реальном масштабе) */
const MIN_STACK_WIDTH_PX = 22;

function unitSizePx(dims: ObjectDimensions): { widthPx: number; heightPx: number } {
  return unitFootprintPx(dims, mmToPx);
}

interface UnitPosition {
  cx: number;
  bottom: number;
  stackIndex: number;
}

function stackPositions(
  count: number,
  dims: ObjectDimensions,
  anchorCx: number,
  groundY: number,
): UnitPosition[] {
  const stepPx = mmToPx(dims.stackStepMm);
  const positions: UnitPosition[] = [];

  for (let i = 0; i < count; i++) {
    positions.push({
      cx: anchorCx,
      bottom: groundY - i * stepPx,
      stackIndex: i,
    });
  }
  return positions;
}

function pilePositions(
  count: number,
  dims: ObjectDimensions,
  anchorCx: number,
  groundY: number,
): UnitPosition[] {
  const stepPx = mmToPx(dims.stackStepMm);
  const positions: UnitPosition[] = [];

  for (let i = 0; i < count; i++) {
    const jitterMm = i % 2 === 0 ? 0.4 : -0.4;
    positions.push({
      cx: anchorCx + mmToPx(jitterMm),
      bottom: groundY - i * stepPx,
      stackIndex: i,
    });
  }
  return positions;
}

function layoutClusterPositions(
  count: number,
  dims: ObjectDimensions,
  anchorCx: number,
  groundY: number,
): UnitPosition[] {
  if (count <= 0) {
    return [];
  }

  if (dims.stackMode === 'pile') {
    return pilePositions(count, dims, anchorCx, groundY);
  }
  return stackPositions(count, dims, anchorCx, groundY);
}

function shouldUseNeatStack(count: number, dims: ObjectDimensions): boolean {
  if (dims.visualLayout === 'books' || dims.visualLayout === 'bundle' || dims.visualLayout === 'cluster') {
    return false;
  }
  if (count < NEAT_STACK_MIN_COUNT) {
    return false;
  }
  const stepPx = mmToPx(dims.stackStepMm);
  return stepPx < MIN_LAYER_PX || count > 20;
}

function pieWedgePath(cx: number, cy: number, radius: number, fraction: number): string {
  if (fraction >= 0.999) {
    return '';
  }
  const angle = Math.min(1, Math.max(0, fraction)) * Math.PI * 2;
  const x = cx + radius * Math.sin(angle);
  const y = cy - radius * Math.cos(angle);
  const largeArc = fraction > 0.5 ? 1 : 0;
  return `M ${cx} ${cy} L ${cx} ${cy - radius} A ${radius} ${radius} 0 ${largeArc} 1 ${x} ${y} Z`;
}

function stackHeightPx(count: number, dims: ObjectDimensions, unitH: number): number {
  if (count < 1) {
    return Math.max(unitH * 0.15, count * mmToPx(dims.stackStepMm));
  }
  return Math.max(unitH, count * mmToPx(dims.stackStepMm));
}

function NeatStack({
  cx,
  groundY,
  count,
  dims,
  widthPx,
  heightPx,
  emoji,
}: {
  cx: number;
  groundY: number;
  count: number;
  dims: ObjectDimensions;
  widthPx: number;
  heightPx: number;
  emoji?: string;
}) {
  const stepPx = mmToPx(dims.stackStepMm);
  const totalH = stackHeightPx(count, dims, heightPx);
  const top = groundY - totalH;
  const drawWidth = Math.max(widthPx, MIN_STACK_WIDTH_PX);
  const left = cx - drawWidth / 2;
  const full = Math.floor(count + 0.001);
  const partial = count - full;
  const rx =
    dims.shape === 'disc' ? Math.min(widthPx, heightPx) / 2 : Math.min(4, heightPx * 0.35);

  const fill =
    dims.shape === 'soft'
      ? 'rgba(180,195,210,0.12)'
      : dims.shape === 'disc'
        ? 'rgba(200,210,225,0.1)'
        : 'rgba(190,205,220,0.11)';

  const layerLines: number[] = [];
  if (stepPx >= MIN_LAYER_PX * 1.2) {
    for (let i = 1; i < full; i++) {
      layerLines.push(groundY - i * stepPx);
    }
    if (partial > 0.05) {
      layerLines.push(groundY - full * stepPx);
    }
  }

  const emojiSize = Math.max(12, Math.min(drawWidth, stepPx, totalH) * 0.72);

  return (
    <g>
      {dims.shape === 'disc' ? (
        <ellipse
          cx={cx}
          cy={top + totalH / 2}
          rx={drawWidth / 2}
          ry={totalH / 2}
          fill={fill}
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="0.6"
        />
      ) : (
        <rect
          x={left}
          y={top}
          width={drawWidth}
          height={totalH}
          rx={rx}
          fill={fill}
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="0.6"
        />
      )}
      {dims.shape === 'soft' && (
        <path
          d={`M ${left + widthPx * 0.15} ${top + totalH * 0.12} Q ${cx} ${top + totalH * 0.06} ${left + widthPx * 0.85} ${top + totalH * 0.12}`}
          fill="none"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="0.6"
        />
      )}
      {layerLines.map((y, i) => (
        <line
          key={`layer-${i}`}
          x1={left + 1}
          y1={y}
          x2={left + drawWidth - 1}
          y2={y}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="0.45"
        />
      ))}
      {partial > 0.05 && (
        <line
          x1={left}
          y1={top}
          x2={left + drawWidth}
          y2={top}
          stroke="var(--accent)"
          strokeWidth="0.8"
          strokeDasharray="2 2"
          opacity="0.85"
        />
      )}
      {emoji && (
        <text
          x={cx}
          y={top + Math.min(stepPx, totalH) * 0.55}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={emojiSize}
          className="volume-item-emoji"
        >
          {safeEmoji(emoji)}
        </text>
      )}
    </g>
  );
}

function SoftStackLayer({
  cx,
  top,
  widthPx,
  heightPx,
  depth,
}: {
  cx: number;
  top: number;
  widthPx: number;
  heightPx: number;
  depth: number;
}) {
  const left = cx - widthPx / 2;
  const rx = Math.min(4, heightPx * 0.35);

  return (
    <g>
      <rect
        x={left}
        y={top}
        width={widthPx}
        height={heightPx}
        rx={rx}
        fill={`rgba(180,195,210,${0.14 + depth})`}
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="0.7"
      />
      <path
        d={`M ${left + widthPx * 0.18} ${top + heightPx * 0.22} Q ${cx} ${top + heightPx * 0.08} ${left + widthPx * 0.82} ${top + heightPx * 0.22}`}
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="0.6"
      />
      <ellipse
        cx={left + widthPx * 0.78}
        cy={top + heightPx * 0.58}
        rx={widthPx * 0.1}
        ry={heightPx * 0.22}
        fill="rgba(255,255,255,0.06)"
      />
    </g>
  );
}

function SingleObjectUnit({
  cx,
  bottom,
  dims,
  fraction,
  emoji,
  clipId,
  showEmoji,
  stackIndex,
}: {
  cx: number;
  bottom: number;
  dims: ObjectDimensions;
  fraction: number;
  emoji?: string;
  clipId: string;
  showEmoji: boolean;
  stackIndex: number;
}) {
  const showFraction = fraction < 0.999;
  const f = Math.min(1, Math.max(0.02, fraction));
  const { widthPx: fullWidthPx, heightPx } = unitSizePx(dims);
  let widthPx = fullWidthPx;

  if (showFraction && (dims.shape === 'flat' || dims.shape === 'box' || dims.shape === 'cylinder')) {
    widthPx *= f;
  }

  const top = bottom - heightPx;
  const left = cx - widthPx / 2;
  const centerY = top + heightPx / 2;
  const emojiSize = Math.max(12, Math.min(fullWidthPx, heightPx) * 0.92);
  const depth = stackIndex * 0.012;

  if (showEmoji && emoji) {
    if (!showFraction) {
      return (
        <g>
          <text
            x={cx}
            y={centerY + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={emojiSize}
            className="volume-item-emoji"
          >
            {safeEmoji(emoji)}
          </text>
        </g>
      );
    }

    const cutLine =
      dims.shape !== 'disc' ? (
        <line
          x1={left + widthPx}
          y1={top - 1}
          x2={left + widthPx}
          y2={bottom + 1}
          stroke="var(--accent)"
          strokeWidth="0.8"
          strokeDasharray="2 2"
          opacity="0.85"
        />
      ) : null;

    return (
      <g>
        {dims.shape !== 'disc' && (
          <defs>
            <clipPath id={clipId}>
              <rect x={left - 1} y={top - 1} width={widthPx + 2} height={heightPx + 2} />
            </clipPath>
          </defs>
        )}
        <g clipPath={dims.shape !== 'disc' ? `url(#${clipId})` : undefined}>
          {dims.shape === 'disc' && (
            <path
              d={pieWedgePath(cx, centerY, Math.min(fullWidthPx, heightPx) / 2, f)}
              fill="rgba(255,255,255,0.06)"
            />
          )}
          <text
            x={cx}
            y={centerY + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={emojiSize}
            className="volume-item-emoji"
            opacity={0.35 + f * 0.65}
          >
            {safeEmoji(emoji)}
          </text>
        </g>
        {cutLine}
      </g>
    );
  }

  const body =
    dims.shape === 'soft' ? (
      <SoftStackLayer cx={cx} top={top} widthPx={fullWidthPx} heightPx={heightPx} depth={depth} />
    ) : dims.shape === 'disc' ? (
      <ellipse
        cx={cx}
        cy={centerY}
        rx={fullWidthPx / 2}
        ry={heightPx / 2}
        fill={`rgba(255,255,255,${0.08 + depth})`}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="0.6"
      />
    ) : (
      <rect
        x={cx - fullWidthPx / 2}
        y={top}
        width={fullWidthPx}
        height={heightPx}
        rx={dims.shape === 'box' ? 1.5 : 0.8}
        fill={`rgba(255,255,255,${0.08 + depth})`}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="0.6"
      />
    );

  const wedge =
    showFraction && dims.shape === 'disc' ? (
      <>
        <ellipse
          cx={cx}
          cy={centerY}
          rx={fullWidthPx / 2}
          ry={heightPx / 2}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="0.6"
          strokeDasharray="2 2"
        />
        <path
          d={pieWedgePath(cx, centerY, Math.min(fullWidthPx, heightPx) / 2, f)}
          fill="rgba(255,255,255,0.12)"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="0.6"
        />
      </>
    ) : null;

  const cutLine =
    showFraction && dims.shape !== 'disc' ? (
      <line
        x1={left + widthPx}
        y1={top - 1}
        x2={left + widthPx}
        y2={bottom + 1}
        stroke="var(--accent)"
        strokeWidth="0.8"
        strokeDasharray="2 2"
        opacity="0.85"
      />
    ) : null;

  return (
    <g>
      {showFraction && dims.shape !== 'disc' && (
        <defs>
          <clipPath id={clipId}>
            <rect x={left - 1} y={top - 1} width={widthPx + 2} height={heightPx + 2} />
          </clipPath>
        </defs>
      )}
      <g clipPath={showFraction && dims.shape !== 'disc' ? `url(#${clipId})` : undefined}>
        {wedge ?? body}
      </g>
      {cutLine}
    </g>
  );
}

function ObjectCluster({
  cx,
  dims,
  count,
  emoji,
  clipIdPrefix,
  groundY,
  regionClipId,
}: {
  cx: number;
  dims: ObjectDimensions;
  count: number;
  emoji?: string;
  clipIdPrefix: string;
  groundY: number;
  regionClipId: string;
}) {
  const { widthPx, heightPx } = unitSizePx(dims);

  if (dims.visualLayout === 'books') {
    const spreadW = Math.max(widthPx, 22);
    return (
      <g clipPath={`url(#${regionClipId})`}>
        <ellipse
          cx={cx}
          cy={groundY + 4}
          rx={spreadW * 0.48}
          ry={Math.max(4, mmToPx(dims.stackStepMm) * 2)}
          fill="#000"
          opacity="0.1"
        />
        <BookStackVisual cx={cx} groundY={groundY} count={count} dims={dims} emoji={emoji} />
      </g>
    );
  }

  if (dims.visualLayout === 'bundle') {
    const { widthPx: bundleW } = unitSizePx(dims);
    const spreadW = Math.max(bundleW, dims.bundleWidthMm ? mmToPx(dims.bundleWidthMm) : bundleW, 22);
    return (
      <g clipPath={`url(#${regionClipId})`}>
        <ellipse
          cx={cx}
          cy={groundY + 4}
          rx={spreadW * 0.48}
          ry={Math.max(4, mmToPx(dims.stackStepMm) * 3)}
          fill="#000"
          opacity="0.1"
        />
        <BundleStackVisual cx={cx} groundY={groundY} count={count} dims={dims} emoji={emoji} />
      </g>
    );
  }

  if (dims.visualLayout === 'cluster') {
    const clusterW = clusterSpreadWidthPx(count, dims);
    return (
      <g clipPath={`url(#${regionClipId})`}>
        <ellipse
          cx={cx}
          cy={groundY + 4}
          rx={clusterW * 0.45}
          ry={Math.max(4, heightPx * 0.12)}
          fill="#000"
          opacity="0.1"
        />
        <SideClusterVisual
          cx={cx}
          groundY={groundY}
          count={count}
          dims={dims}
          emoji={emoji}
          renderUnit={({ cx: unitCx, bottom, fraction, stackIndex, clipId }) => (
            <SingleObjectUnit
              key={clipId}
              cx={unitCx}
              bottom={bottom}
              dims={dims}
              fraction={fraction}
              emoji={emoji}
              clipId={`${clipIdPrefix}-${clipId}`}
              showEmoji
              stackIndex={stackIndex}
            />
          )}
        />
      </g>
    );
  }

  if (count < 0.999) {
    return (
      <g clipPath={`url(#${regionClipId})`}>
        <ellipse
          cx={cx}
          cy={groundY + 4}
          rx={Math.max(widthPx, heightPx) * 0.35}
          ry={Math.max(widthPx, heightPx) * 0.08}
          fill="#000"
          opacity="0.1"
        />
        <SingleObjectUnit
          cx={cx}
          bottom={groundY}
          dims={dims}
          fraction={count}
          emoji={emoji}
          clipId={`${clipIdPrefix}-frac`}
          showEmoji
          stackIndex={0}
        />
      </g>
    );
  }

  const fullCount = Math.floor(count + 0.001);
  const partial = count - fullCount;
  const overflow = fullCount > MAX_DRAW_ITEMS;
  const drawFull = overflow ? MAX_DRAW_ITEMS : fullCount;
  const drawPartial = !overflow && partial > 0.05;
  const totalDraw = drawFull + (drawPartial ? 1 : 0);
  const displayCount = overflow ? drawFull : count;
  const useNeat = shouldUseNeatStack(displayCount, dims);
  const topItemIndex = totalDraw - 1;
  const clusterW = widthPx;

  return (
    <g clipPath={`url(#${regionClipId})`}>
      <ellipse
        cx={cx}
        cy={groundY + 4}
        rx={clusterW * 0.45}
        ry={Math.max(4, heightPx * 0.25)}
        fill="#000"
        opacity="0.1"
      />
      {useNeat ? (
        <NeatStack
          cx={cx}
          groundY={groundY}
          count={displayCount}
          dims={dims}
          widthPx={widthPx}
          heightPx={heightPx}
          emoji={emoji}
        />
      ) : (
        <>
          {layoutClusterPositions(totalDraw, dims, cx, groundY)
            .slice(0, drawFull)
            .map((pos, i) => (
              <SingleObjectUnit
                key={`u-${i}`}
                cx={pos.cx}
                bottom={pos.bottom}
                dims={dims}
                fraction={1}
                emoji={emoji}
                clipId={`${clipIdPrefix}-${i}`}
                showEmoji={totalDraw <= 8 || i === topItemIndex}
                stackIndex={pos.stackIndex}
              />
            ))}
          {drawPartial && (
            <SingleObjectUnit
              cx={cx}
              bottom={groundY - drawFull * mmToPx(dims.stackStepMm)}
              dims={dims}
              fraction={partial}
              emoji={emoji}
              clipId={`${clipIdPrefix}-partial`}
              showEmoji={totalDraw <= 8}
              stackIndex={drawFull}
            />
          )}
        </>
      )}
      {overflow && (
        <text
          x={cx}
          y={groundY - stackHeightPx(drawFull, dims, heightPx) - 8}
          textAnchor="middle"
          fill="#9aa8b8"
          fontSize="9"
        >
          +{formatCount(fullCount - MAX_DRAW_ITEMS)} ещё
        </text>
      )}
    </g>
  );
}

function VisitMassBlob({
  cx,
  grams,
  colorHex,
  groundY,
}: {
  cx: number;
  grams: number;
  colorHex: string;
  groundY: number;
}) {
  const diameterPx = mmToPx(massBlobDiameterMm(grams));
  const radius = diameterPx / 2;
  const cy = groundY - radius;

  return (
    <g>
      <ellipse cx={cx} cy={groundY + 4} rx={radius * 0.9} ry={radius * 0.15} fill="#000" opacity="0.12" />
      <circle cx={cx} cy={cy} r={radius} fill={colorHex} opacity="0.94" />
      <ellipse cx={cx} cy={cy - radius * 0.28} rx={radius * 0.5} ry={radius * 0.2} fill="#fff" opacity="0.14" />
    </g>
  );
}

function CompareScene({
  grams,
  colorHex,
  compareTarget,
  items,
  periodLabel,
  gender,
}: {
  grams: number;
  colorHex: string;
  compareTarget: CompareTarget;
  items: ComparisonVisual[];
  periodLabel: string;
  gender: 'MALE' | 'FEMALE';
}) {
  const clipIdPrefix = useId().replace(/:/g, '');
  const regionClipId = `${clipIdPrefix}-region`;
  const selectedItem = typeof compareTarget === 'number' ? items[compareTarget] : null;

  const scene = useMemo(() => {
    if (selectedItem) {
      const dims = resolveObjectDimensions(
        itemObjectName(selectedItem),
        selectedItem.emoji,
        selectedItem.gramsPerUnit,
      );
      const count = selectedItem.count;
      const leftStackH = stackDisplayHeightPx(count, dims, mmToPx);
      const leftLabel = `${formatCount(count)} шт · ~${formatGrams(selectedItem.gramsPerUnit)} каждая`;
      const layoutLabel =
        dims.visualLayout === 'cluster'
          ? 'ряд'
          : dims.visualLayout === 'bundle'
            ? 'связки'
            : dims.visualLayout === 'books' || dims.stackMode === 'pile'
              ? 'стопка'
              : 'стопка';
      const leftHint =
        count >= 1
          ? dims.visualLayout === 'cluster'
            ? `${periodLabel} — предметы слева в масштабе`
            : dims.visualLayout === 'bundle'
              ? `${periodLabel} — связки слева в масштабе`
              : `${periodLabel} — ${layoutLabel} слева в масштабе`
          : `${periodLabel} — доля одной штуки`;
      return {
        dims,
        count,
        leftLabel,
        leftHint,
        emoji: selectedItem.emoji,
        mode: 'item' as const,
        leftStackH,
      };
    }

    const blobD = mmToPx(massBlobDiameterMm(grams));
    return {
      dims: null,
      count: 1,
      leftLabel: `~${formatGrams(grams)}`,
      leftHint: `Сумма · ${periodLabel.toLowerCase()}`,
      emoji: undefined,
      mode: 'visit' as const,
      leftStackH: blobD,
    };
  }, [selectedItem, grams, periodLabel]);

  const svgH = Math.min(MAX_SVG_H, Math.max(MIN_SVG_H, Math.max(HUMAN_HEIGHT_PX, scene.leftStackH) + 82));
  const groundY = svgH - 52;
  const dividerBottom = groundY + 8;

  return (
    <div className="volume-scene">
      <svg viewBox={`0 0 360 ${svgH}`} className="volume-scene-svg" aria-hidden="true">
        <defs>
          <clipPath id={regionClipId}>
            <rect x="0" y="12" width="176" height={groundY - 8} />
          </clipPath>
        </defs>
        <line x1="180" y1="24" x2="180" y2={dividerBottom} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
        {scene.mode === 'item' && scene.dims ? (
          <ObjectCluster
            cx={LEFT_X}
            dims={scene.dims}
            count={scene.count}
            emoji={scene.emoji}
            clipIdPrefix={clipIdPrefix}
            groundY={groundY}
            regionClipId={regionClipId}
          />
        ) : (
          <VisitMassBlob cx={LEFT_X} grams={grams} colorHex={colorHex} groundY={groundY} />
        )}
        <HumanFigure cx={RIGHT_X} groundY={groundY} height={HUMAN_HEIGHT_PX} gender={gender} />
        <text x={LEFT_X} y={svgH - 20} textAnchor="middle" fill="#e8edf2" fontSize="12" fontWeight="600">
          {scene.leftLabel}
        </text>
        <text x={LEFT_X} y={svgH - 8} textAnchor="middle" fill="#9aa8b8" fontSize="10">
          {scene.leftHint}
        </text>
        <text x={RIGHT_X} y={svgH - 20} textAnchor="middle" fill="#e8edf2" fontSize="12" fontWeight="600">
          ~70 кг
        </text>
        <text x={RIGHT_X} y={svgH - 8} textAnchor="middle" fill="#9aa8b8" fontSize="10">
          {humanGenderLabel(gender)} · ~{REAL_SCALE.humanHeightMm / 10} см
        </text>
      </svg>
    </div>
  );
}

export default function VolumeVisualizer({
  open,
  grams,
  colorHex,
  periodLabel = 'Период',
  compareSeed,
  onClose,
}: VolumeVisualizerProps) {
  const { gender } = useAuth();
  const [preview, setPreview] = useState<VolumePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [compareTarget, setCompareTarget] = useState<CompareTarget>('visit');

  useEffect(() => {
    if (!open || grams <= 0) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    setCompareTarget('visit');
    api
      .getVolumePreview(grams, compareSeed)
      .then((data) => {
        if (!cancelled) {
          setPreview(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Ошибка загрузки');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, grams, compareSeed]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const items = preview?.comparisonItems ?? [];

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog volume-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="volume-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="volume-dialog-title" className="modal-title">
          {periodLabel}: {formatGrams(grams)} — в масштабе
        </h3>

        <CompareScene
          grams={grams}
          colorHex={colorHex}
          compareTarget={compareTarget}
          items={items}
          periodLabel={periodLabel}
          gender={gender}
        />

        {loading && <p className="modal-text">Считаем сравнения…</p>}
        {error && <p className="error">{error}</p>}

        {preview && (
          <div className="volume-preview-body">
            <p className="volume-human-text">{preview.humanComparison}</p>
            <p className="volume-subtitle">
              Выберите сравнение — слева стопка в реальном масштабе, справа человек.
            </p>
            <div className="fun-fact-chips volume-compare-chips" role="tablist" aria-label="Что сравнить с человеком">
              <button
                type="button"
                role="tab"
                aria-selected={compareTarget === 'visit'}
                className={`fun-chip volume-compare-chip ${compareTarget === 'visit' ? 'selected' : ''}`}
                onClick={() => setCompareTarget('visit')}
              >
                <span className="fun-chip-emoji" aria-hidden="true">
                  📊
                </span>
                <span className="fun-chip-text">{periodLabel} vs человек</span>
              </button>
              {items.map((item, index) => (
                <button
                  key={item.text}
                  type="button"
                  role="tab"
                  aria-selected={compareTarget === index}
                  className={`fun-chip volume-compare-chip ${compareTarget === index ? 'selected' : ''}`}
                  onClick={() => setCompareTarget(index)}
                  title={item.text}
                >
                  <span className="fun-chip-emoji" aria-hidden="true">
                    {safeEmoji(item.emoji)}
                  </span>
                  <span className="fun-chip-text">
                    {cleanComparisonText(parseComparisonLine(item.text).text)}
                  </span>
                </button>
              ))}
            </div>
            {items.length === 0 && preview.comparisons.length > 0 && (
              <>
                <p className="volume-subtitle">Столько же весит:</p>
                <div className="fun-fact-chips">
                  {preview.comparisons.map((line) => (
                    <span key={line} className="fun-chip">
                      {line}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Понятно
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
