package com.thegreathike.tracking.dto;

public record AdminTrackingOverview(
        long totalVisits,
        long totalGrams,
        long activeUsers
) {}
