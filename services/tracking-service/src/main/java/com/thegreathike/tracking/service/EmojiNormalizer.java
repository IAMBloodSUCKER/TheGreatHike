package com.thegreathike.tracking.service;

import java.util.Map;

/** Maps emojis missing on older Windows fonts to widely supported alternatives. */
public final class EmojiNormalizer {

    private static final Map<String, String> FALLBACK = Map.of(
            "🪙", "💰",
            "🪥", "🦷",
            "🪒", "✂️",
            "🪛", "🔧",
            "🪚", "🔨"
    );

    private EmojiNormalizer() {
    }

    public static String normalize(String emoji) {
        if (emoji == null || emoji.isBlank()) {
            return emoji;
        }
        return FALLBACK.getOrDefault(emoji, emoji);
    }

    public static String normalizeLine(String line) {
        if (line == null || line.isEmpty()) {
            return line;
        }
        int space = line.indexOf(' ');
        if (space <= 0) {
            return line;
        }
        String raw = line.substring(0, space);
        String safe = normalize(raw);
        if (raw.equals(safe)) {
            return line;
        }
        return safe + line.substring(space);
    }
}
