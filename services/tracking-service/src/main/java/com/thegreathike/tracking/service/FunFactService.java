package com.thegreathike.tracking.service;

import com.thegreathike.tracking.dto.ComparisonVisual;
import com.thegreathike.tracking.dto.FunFact;
import com.thegreathike.tracking.model.ComparisonItem;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class FunFactService {

    private static final int MIN_LINES = 3;
    private static final int MAX_LINES = 5;
    private static final double MIN_COUNT = 0.15;
    private static final double MAX_COUNT = 2500;

    private final ComparisonCatalog catalog;

    public FunFactService(ComparisonCatalog catalog) {
        this.catalog = catalog;
    }

    public FunFact build(long totalGrams) {
        return build(totalGrams, "default");
    }

    public FunFact build(long totalGrams, String seedKey) {
        if (totalGrams <= 0) {
            return new FunFact("🌱", "Пока тихо — самое время отметить первый поход!", List.of());
        }

        List<ScoredItem> picked = pickComparisons(totalGrams, seedKey);
        if (picked.isEmpty()) {
            return new FunFact("💩", "Уже " + totalGrams + " г — отличное начало!", List.of());
        }

        List<String> lines = picked.stream()
                .map(s -> formatLine(s.item(), s.count()))
                .collect(Collectors.toList());

        String headline = "Это весит столько же, сколько:";
        if (totalGrams >= 1_000_000) {
            headline = headline + " (" + formatTons(totalGrams) + ")";
        }

        return new FunFact(EmojiNormalizer.normalize(picked.getFirst().item().emoji()), headline, lines);
    }

    public List<ComparisonVisual> comparisonVisuals(long totalGrams, String seedKey) {
        if (totalGrams <= 0) {
            return List.of();
        }
        return pickComparisons(totalGrams, seedKey).stream()
                .map(s -> new ComparisonVisual(
                        EmojiNormalizer.normalize(s.item().emoji()),
                        s.count(),
                        formatLine(s.item(), s.count()),
                        s.item().grams(),
                        s.item().one()))
                .toList();
    }

    public List<ScoredItem> pickComparisons(long totalGrams, String seedKey) {
        List<ScoredItem> candidates = catalog.all().stream()
                .filter(this::isRealWorldItem)
                .map(item -> new ScoredItem(item, totalGrams / item.grams()))
                .filter(s -> s.count() >= MIN_COUNT && s.count() <= MAX_COUNT)
                .sorted(Comparator.comparingDouble(ScoredItem::interestScore).reversed())
                .toList();

        if (candidates.isEmpty()) {
            return List.of();
        }

        long seed = seedKey.hashCode() * 31L + totalGrams;
        Random random = new Random(seed);
        return pickDiverse(candidates, random);
    }

    private boolean isRealWorldItem(ComparisonItem item) {
        if (hasBannedMarkup(item.one()) || hasBannedMarkup(item.few()) || hasBannedMarkup(item.many())) {
            return false;
        }
        String name = item.one().toLowerCase();
        if (name.contains("резинов") || name.contains("космическ") || name.contains("деревянн")
                || name.contains("пластиков") || name.contains("золот") && name.contains("носок")) {
            return false;
        }
        return !name.contains("привиден") && !name.contains("единорог") && !name.contains("дракон")
                && !name.contains("волшебник") && !name.contains("инопланет");
    }

    /** Отсекает старые сгенерированные дубликаты вроде «вилка (серия 2)» или «гвоздь №17». */
    private boolean hasBannedMarkup(String name) {
        if (name == null || name.isBlank()) {
            return false;
        }
        String lower = name.toLowerCase();
        return lower.contains("серия") || lower.contains("№");
    }

    private List<ScoredItem> pickDiverse(List<ScoredItem> candidates, Random random) {
        int target = MIN_LINES + random.nextInt(MAX_LINES - MIN_LINES + 1);
        List<ScoredItem> pool = new ArrayList<>(candidates);
        shuffle(pool, random);

        List<ScoredItem> picked = new ArrayList<>();
        Set<Integer> usedBuckets = new LinkedHashSet<>();

        for (ScoredItem candidate : pool) {
            if (picked.size() >= target) {
                break;
            }
            int bucket = massBucket(candidate.item().grams());
            if (usedBuckets.contains(bucket) && picked.size() < target - 1) {
                continue;
            }
            if (isTooSimilar(candidate.item(), picked)) {
                continue;
            }
            picked.add(candidate);
            usedBuckets.add(bucket);
        }

        if (picked.size() < MIN_LINES) {
            for (ScoredItem candidate : pool) {
                if (picked.size() >= MIN_LINES) {
                    break;
                }
                if (!picked.contains(candidate)) {
                    picked.add(candidate);
                }
            }
        }

        return picked.stream().limit(MAX_LINES).toList();
    }

    private boolean isTooSimilar(ComparisonItem item, List<ScoredItem> picked) {
        String base = normalize(item.one());
        for (ScoredItem existing : picked) {
            String other = normalize(existing.item().one());
            if (other.contains(base) || base.contains(other)) {
                return true;
            }
        }
        return false;
    }

    private String normalize(String name) {
        return name.toLowerCase()
                .replaceAll("^(маленький|большой|гигантский|крошечный|золотой|ржавый|пластиковый|деревянный|секретный|волшебный|новенький|б/у|винтажный)\\s+", "");
    }

    private int massBucket(double grams) {
        if (grams < 1) return 0;
        if (grams < 50) return 1;
        if (grams < 500) return 2;
        if (grams < 5000) return 3;
        if (grams < 50000) return 4;
        if (grams < 500000) return 5;
        return 6;
    }

    private void shuffle(List<ScoredItem> list, Random random) {
        for (int i = list.size() - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            ScoredItem tmp = list.get(i);
            list.set(i, list.get(j));
            list.set(j, tmp);
        }
    }

    private String formatLine(ComparisonItem item, double count) {
        return EmojiNormalizer.normalize(item.emoji()) + " " + formatCount(count) + " "
                + pluralize(count,
                ComparisonText.cleanLabel(item.one()),
                ComparisonText.cleanLabel(item.few()),
                ComparisonText.cleanLabel(item.many()));
    }

    private String formatCount(double value) {
        if (value >= 100) {
            return String.format("%.0f", value);
        }
        if (value >= 10) {
            return String.format("%.1f", value);
        }
        if (value >= 1) {
            return String.format("%.1f", value);
        }
        return String.format("%.2f", value);
    }

    private String pluralize(double count, String one, String few, String many) {
        long rounded = Math.round(count);
        long mod10 = rounded % 10;
        long mod100 = rounded % 100;
        if (mod100 >= 11 && mod100 <= 14) {
            return many;
        }
        if (mod10 == 1) {
            return one;
        }
        if (mod10 >= 2 && mod10 <= 4) {
            return few;
        }
        return many;
    }

    private String formatTons(long grams) {
        double tons = grams / 1_000_000.0;
        if (tons >= 1) {
            return String.format("%.2f т", tons);
        }
        return String.format("%.1f кг", grams / 1000.0);
    }

    private record ScoredItem(ComparisonItem item, double count) {
        double interestScore() {
            double countScore = Math.log10(count + 1);
            double rarity = Math.log10(item.grams() + 1);
            double sweetSpot = 1.0 / (1.0 + Math.abs(Math.log10(count) - 0.8));
            return countScore + rarity * 0.3 + sweetSpot;
        }
    }
}
