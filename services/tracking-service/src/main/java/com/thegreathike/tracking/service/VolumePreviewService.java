package com.thegreathike.tracking.service;

import com.thegreathike.tracking.dto.FunFact;
import com.thegreathike.tracking.dto.VolumePreview;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class VolumePreviewService {

    private static final int REFERENCE_HUMAN_GRAMS = 70_000;

    private final FunFactService funFactService;

    public VolumePreviewService(FunFactService funFactService) {
        this.funFactService = funFactService;
    }

    public VolumePreview build(int grams) {
        return build(grams, null);
    }

    public VolumePreview build(int grams, String seedKey) {
        if (grams < 1 || grams > 50_000) {
            throw new IllegalArgumentException("Масса для сравнения: от 1 до 50 000 г");
        }

        double percent = grams * 100.0 / REFERENCE_HUMAN_GRAMS;
        String humanComparison = formatHumanComparison(grams, percent);
        String resolvedSeed = resolveSeedKey(seedKey, grams);
        FunFact fact = funFactService.build(grams, resolvedSeed);
        var items = funFactService.comparisonVisuals(grams, resolvedSeed);

        return new VolumePreview(grams, percent, humanComparison, fact.comparisons(), items);
    }

    private String resolveSeedKey(String seedKey, int grams) {
        if (seedKey == null || seedKey.isBlank()) {
            return "volume-preview-" + grams;
        }
        String trimmed = seedKey.trim();
        if (trimmed.length() > 32 || !trimmed.matches("[a-zA-Z0-9_-]+")) {
            return "volume-preview-" + grams;
        }
        return trimmed;
    }

    private String formatHumanComparison(int grams, double percent) {
        if (grams >= REFERENCE_HUMAN_GRAMS) {
            double humans = grams / (double) REFERENCE_HUMAN_GRAMS;
            return String.format(Locale.forLanguageTag("ru"), "Это больше, чем вес %.1f взрослых людей (~70 кг)", humans);
        }
        if (percent >= 1) {
            return String.format(Locale.forLanguageTag("ru"), "Это ~%.1f%% массы взрослого человека (~70 кг)", percent);
        }
        return String.format(Locale.forLanguageTag("ru"), "Это ~%.2f%% массы взрослого человека (~70 кг)", percent);
    }
}
