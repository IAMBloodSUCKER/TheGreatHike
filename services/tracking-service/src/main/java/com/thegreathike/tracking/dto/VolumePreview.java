package com.thegreathike.tracking.dto;

import java.util.List;

public record VolumePreview(
        int grams,
        double percentOfHumanBody,
        String humanComparison,
        List<String> comparisons,
        List<ComparisonVisual> comparisonItems
) {}
