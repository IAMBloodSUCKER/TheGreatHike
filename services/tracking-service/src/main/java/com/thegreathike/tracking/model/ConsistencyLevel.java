package com.thegreathike.tracking.model;

import java.util.List;

public enum ConsistencyLevel {
    LIQUID("Жидкий", "Жидкий стул", 70, "tier-liquid"),
    PELLETS("Козий горох", "Твёрдые шарики", 55, "tier-pellets"),
    LUMPY("Комочки", "Неровные комки", 110, "tier-lumpy"),
    MOREL("Сморчок", "Морщинистая форма", 155, "tier-morel"),
    NORMAL("Стандарт", "Классическая форма", 200, "tier-normal"),
    SOFT("Мягкий", "Мягкий, плоский", 260, "tier-soft"),
    FIRM("Плотный", "Плотный, увесистый", 340, "tier-firm"),
    GIANT("Верзила", "Эпический объём", 500, "tier-massive"),
    CUSTOM("Своя граммовка", "Указать вручную", 0, "tier-custom"),

    /** Старые значения в БД — не показываются в выборе */
    TINY("Крошка", "Очень мало", 50, "tier-pellets"),
    SMALL("Малютка", "Мало", 100, "tier-lumpy"),
    MEDIUM("Стандарт", "Средне", 200, "tier-normal"),
    LARGE("Богатырь", "Много", 350, "tier-firm");

    private static final List<ConsistencyLevel> SELECTABLE = List.of(
            LIQUID, PELLETS, LUMPY, MOREL, NORMAL, SOFT, FIRM, GIANT, CUSTOM
    );

    private final String label;
    private final String description;
    private final int gramsPerUnit;
    private final String imageKey;

    ConsistencyLevel(String label, String description, int gramsPerUnit, String imageKey) {
        this.label = label;
        this.description = description;
        this.gramsPerUnit = gramsPerUnit;
        this.imageKey = imageKey;
    }

    public static List<ConsistencyLevel> selectable() {
        return SELECTABLE;
    }

    public String getLabel() {
        return label;
    }

    public String getDescription() {
        return description;
    }

    public int getGramsPerUnit() {
        return gramsPerUnit;
    }

    public String getImageKey() {
        return imageKey;
    }
}
