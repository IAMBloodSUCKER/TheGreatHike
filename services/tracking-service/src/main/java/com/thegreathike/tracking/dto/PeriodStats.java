package com.thegreathike.tracking.dto;

public record PeriodStats(
        String period,
        long totalGrams,
        long totalVisits,
        long totalCount,
        FunFact funFact
) {}
