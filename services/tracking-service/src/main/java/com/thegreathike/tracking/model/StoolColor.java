package com.thegreathike.tracking.model;

public enum StoolColor {
    BROWN("Коричневый", "#8B5E3C"),
    LIGHT_BROWN("Светло-коричневый", "#C49A6C"),
    DARK_BROWN("Тёмно-коричневый", "#5C3A1E"),
    YELLOW("Жёлтый", "#D4A82A"),
    GREEN("Зелёный", "#6B8E4E"),
    BLACK("Чёрный", "#2A2218"),
    RED("Красноватый", "#9B4545");

    private final String label;
    private final String hex;

    StoolColor(String label, String hex) {
        this.label = label;
        this.hex = hex;
    }

    public String getLabel() {
        return label;
    }

    public String getHex() {
        return hex;
    }
}
