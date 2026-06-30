package com.thegreathike.tracking.dto;

import com.thegreathike.tracking.model.ConsistencyLevel;
import com.thegreathike.tracking.model.StoolColor;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateVisitRequest(
        @Min(1) @Max(1) int count,
        @NotNull ConsistencyLevel consistency,
        Integer customGramsPerUnit,
        StoolColor color,
        LocalDate visitDate,
        @Size(max = 256) String note
) {}
