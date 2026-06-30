package com.thegreathike.tracking.dto;

import com.thegreathike.tracking.model.ConsistencyLevel;
import com.thegreathike.tracking.model.StoolColor;

import java.time.Instant;
import java.util.UUID;

public record VisitResponse(
        UUID id,
        int count,
        ConsistencyLevel consistency,
        String consistencyLabel,
        String imageKey,
        int totalGrams,
        StoolColor color,
        String colorLabel,
        String colorHex,
        String note,
        Instant visitedAt
) {}
