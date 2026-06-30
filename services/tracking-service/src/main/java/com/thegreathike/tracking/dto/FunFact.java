package com.thegreathike.tracking.dto;

import java.util.List;

public record FunFact(
        String emoji,
        String text,
        List<String> comparisons
) {}
