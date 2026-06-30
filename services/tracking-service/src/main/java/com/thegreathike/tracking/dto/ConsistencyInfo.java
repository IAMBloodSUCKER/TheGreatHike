package com.thegreathike.tracking.dto;

import com.thegreathike.tracking.model.ConsistencyLevel;

import java.util.List;

public record ConsistencyInfo(
        ConsistencyLevel level,
        String label,
        String description,
        int gramsPerUnit,
        String imageKey
) {
    public static List<ConsistencyInfo> all() {
        return ConsistencyLevel.selectable().stream()
                .map(l -> new ConsistencyInfo(l, l.getLabel(), l.getDescription(), l.getGramsPerUnit(), l.getImageKey()))
                .toList();
    }
}
