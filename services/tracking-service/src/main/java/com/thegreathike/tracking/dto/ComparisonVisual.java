package com.thegreathike.tracking.dto;

public record ComparisonVisual(
        String emoji,
        double count,
        String text,
        double gramsPerUnit,
        String objectName
) {}
