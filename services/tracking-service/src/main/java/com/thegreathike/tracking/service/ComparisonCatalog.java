package com.thegreathike.tracking.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.thegreathike.tracking.model.ComparisonItem;
import org.springframework.core.io.ClassPathResource;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;

@Component
public class ComparisonCatalog {

    private final ObjectMapper objectMapper;
    private List<ComparisonItem> items;

    public ComparisonCatalog(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    void load() throws IOException {
        try (InputStream in = new ClassPathResource("comparisons.json").getInputStream()) {
            this.items = objectMapper.readValue(in, new TypeReference<List<ComparisonItem>>() {})
                    .stream()
                    .map(item -> new ComparisonItem(
                            EmojiNormalizer.normalize(item.emoji()),
                            item.one(),
                            item.few(),
                            item.many(),
                            item.grams()))
                    .toList();
        }
    }

    public List<ComparisonItem> all() {
        return items;
    }

    public int size() {
        return items.size();
    }
}
