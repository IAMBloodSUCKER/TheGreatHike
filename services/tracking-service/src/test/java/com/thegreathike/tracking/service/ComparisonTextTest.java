package com.thegreathike.tracking.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ComparisonTextTest {

    @Test
    void stripsSeriesAndNumberSuffixes() {
        assertEquals("вафля", ComparisonText.cleanLabel("вафля №2"));
        assertEquals("дверь", ComparisonText.cleanLabel("дверь (серия 2)"));
        assertEquals("чашка чая", ComparisonText.cleanLabel("чашка чая (серия 2)"));
    }
}
