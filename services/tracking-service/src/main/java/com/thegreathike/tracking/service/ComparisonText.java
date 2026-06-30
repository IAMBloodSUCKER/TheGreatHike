package com.thegreathike.tracking.service;

import java.util.regex.Pattern;

/** Убирает мусорные метки из старого генератора каталога. */
public final class ComparisonText {

    private static final Pattern SERIES = Pattern.compile("\\s*\\(серия\\s*\\d+\\)", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
    private static final Pattern NUMBER = Pattern.compile("\\s*№\\s*\\d+");

    private ComparisonText() {
    }

    public static String cleanLabel(String label) {
        if (label == null || label.isBlank()) {
            return label;
        }
        return NUMBER.matcher(SERIES.matcher(label).replaceAll("")).replaceAll("").trim();
    }
}
