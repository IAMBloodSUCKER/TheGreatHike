import { cleanComparisonText, parseComparisonLine } from '../emoji';

interface ComparisonChipProps {
  line: string;
}

export default function ComparisonChip({ line }: ComparisonChipProps) {
  const { emoji, text } = parseComparisonLine(line);
  const cleaned = cleanComparisonText(text);

  return (
    <span className="fun-chip">
      {emoji && (
        <span className="fun-chip-emoji" aria-hidden="true">
          {emoji}
        </span>
      )}
      <span className="fun-chip-text">{cleaned}</span>
    </span>
  );
}
