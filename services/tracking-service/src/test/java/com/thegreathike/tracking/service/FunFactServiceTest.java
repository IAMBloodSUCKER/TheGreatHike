package com.thegreathike.tracking.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class FunFactServiceTest {

    private FunFactService service;

    @BeforeEach
    void setUp() throws Exception {
        ComparisonCatalog catalog = new ComparisonCatalog(new ObjectMapper());
        catalog.load();
        service = new FunFactService(catalog);
    }

    @Test
    void emptyReturnsEncouragement() {
        assertTrue(service.build(0).text().contains("Пока тихо"));
    }

    @Test
    void returnsMultipleComparisons() {
        var fact = service.build(6000, "week");
        assertNotNull(fact.comparisons());
        assertTrue(fact.comparisons().size() >= 3);
    }

    @Test
    void differentPeriodsCanDiffer() {
        var day = service.build(6000, "day");
        var year = service.build(6000, "year");
        assertNotEquals(day.comparisons(), year.comparisons());
    }

    @Test
    void largeMassWorks() {
        var fact = service.build(3_000_000, "year");
        assertTrue(fact.comparisons().size() >= 3);
    }

    @Test
    void comparisonsNeverContainSeriesMarkup() throws Exception {
        ComparisonCatalog catalog = new ComparisonCatalog(new ObjectMapper());
        catalog.load();
        for (var item : catalog.all()) {
            assertFalse(item.one().toLowerCase().contains("серия"), item.one());
            assertFalse(item.few().toLowerCase().contains("серия"), item.few());
            assertFalse(item.many().toLowerCase().contains("серия"), item.many());
            assertFalse(item.one().contains("№"), item.one());
            assertFalse(item.few().contains("№"), item.few());
            assertFalse(item.many().contains("№"), item.many());
        }
    }

    @Test
    void builtComparisonsNeverContainSeriesMarkup() {
        var fact = service.build(8500, "week-test");
        for (String line : fact.comparisons()) {
            assertFalse(line.toLowerCase().contains("серия"), line);
            assertFalse(line.contains("№"), line);
        }
    }
}
