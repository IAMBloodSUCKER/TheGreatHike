package com.thegreathike.tracking.dto;

import java.util.UUID;

public record UserVisitStats(
        UUID userId,
        long visitCount,
        long totalGrams
) {}
