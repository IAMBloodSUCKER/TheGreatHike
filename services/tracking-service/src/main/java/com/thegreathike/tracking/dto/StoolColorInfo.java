package com.thegreathike.tracking.dto;

import com.thegreathike.tracking.model.StoolColor;

public record StoolColorInfo(
        StoolColor color,
        String label,
        String hex
) {
    public static java.util.List<StoolColorInfo> all() {
        return java.util.Arrays.stream(StoolColor.values())
                .map(c -> new StoolColorInfo(c, c.getLabel(), c.getHex()))
                .toList();
    }
}
