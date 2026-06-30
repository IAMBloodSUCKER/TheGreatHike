/** Unicode 13+ emojis that render as ▯ on Windows 10 without a color-emoji font */
const FALLBACK: Record<string, string> = {
  '🪙': '💰',
  '🪥': '🦷',
  '🪒': '✂️',
  '🪛': '🔧',
  '🪚': '🔨',
};

export function safeEmoji(emoji: string): string {
  return FALLBACK[emoji] ?? emoji;
}

/** Убирает «(серия 2)», «№2» и подобный мусор из старого каталога. */
export function cleanComparisonText(text: string): string {
  return text
    .replace(/\s*\(серия\s*\d+\)/gi, '')
    .replace(/\s*№\s*\d+/g, '')
    .trim();
}

export function parseComparisonLine(line: string): { emoji: string; text: string } {
  const space = line.indexOf(' ');
  if (space === -1) {
    return { emoji: '', text: line };
  }
  return {
    emoji: safeEmoji(line.slice(0, space)),
    text: line.slice(space + 1),
  };
}

export function formatComparisonLine(line: string): string {
  const { emoji, text } = parseComparisonLine(line);
  const cleaned = cleanComparisonText(text);
  return emoji ? `${emoji} ${cleaned}` : cleaned;
}
