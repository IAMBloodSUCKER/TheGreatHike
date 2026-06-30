package com.thegreathike.tracking.service;

import com.thegreathike.tracking.dto.*;
import com.thegreathike.tracking.entity.Visit;
import com.thegreathike.tracking.model.ConsistencyLevel;
import com.thegreathike.tracking.model.StoolColor;
import com.thegreathike.tracking.repository.VisitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class VisitService {

    private static final char CSV_DELIM = ';';

    private final VisitRepository visitRepository;
    private final FunFactService funFactService;

    public VisitService(VisitRepository visitRepository, FunFactService funFactService) {
        this.visitRepository = visitRepository;
        this.funFactService = funFactService;
    }

    @Transactional
    public VisitResponse create(UUID userId, CreateVisitRequest request) {
        int gramsPerUnit = resolveGramsPerUnit(request);
        StoolColor color = request.color() != null ? request.color() : StoolColor.BROWN;

        Visit visit = new Visit();
        visit.setUserId(userId);
        visit.setCount(1);
        visit.setConsistency(request.consistency());
        visit.setCustomGramsPerUnit(request.consistency() == ConsistencyLevel.CUSTOM ? gramsPerUnit : null);
        visit.setColor(color);
        visit.setTotalGrams(gramsPerUnit);
        visit.setNote(request.note());
        visit.setVisitedAt(resolveVisitedAt(request.visitDate()));
        visit = visitRepository.save(visit);
        return toResponse(visit);
    }

    private int resolveGramsPerUnit(CreateVisitRequest request) {
        if (request.consistency() == ConsistencyLevel.CUSTOM) {
            Integer custom = request.customGramsPerUnit();
            if (custom == null || custom < 10 || custom > 5000) {
                throw new IllegalArgumentException("Укажите массу от 10 до 5000 г");
            }
            return custom;
        }
        if (request.customGramsPerUnit() != null) {
            throw new IllegalArgumentException("Своя граммовка только для типа «Своя граммовка»");
        }
        return request.consistency().getGramsPerUnit();
    }

    @Transactional
    public void delete(UUID userId, UUID visitId) {
        Visit visit = visitRepository.findByIdAndUserId(visitId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Запись не найдена"));
        visitRepository.delete(visit);
    }

    private Instant resolveVisitedAt(LocalDate visitDate) {
        ZoneId zone = resolveZone();
        LocalDate date = visitDate != null ? visitDate : LocalDate.now(zone);
        LocalDate today = LocalDate.now(zone);

        if (date.isAfter(today)) {
            throw new IllegalArgumentException("Дата не может быть в будущем");
        }
        if (date.isBefore(today.minusDays(365))) {
            throw new IllegalArgumentException("Можно добавить запись максимум за год назад");
        }

        if (date.equals(today)) {
            return Instant.now();
        }
        return date.atTime(12, 0).atZone(zone).toInstant();
    }

    private ZoneId resolveZone() {
        String configured = System.getenv("APP_TIMEZONE");
        if (configured != null && !configured.isBlank()) {
            return ZoneId.of(configured.trim());
        }
        return ZoneId.systemDefault();
    }

    public DashboardResponse dashboard(UUID userId) {
        ZoneId zone = resolveZone();
        Instant now = Instant.now();
        ZonedDateTime zNow = now.atZone(zone);

        List<PeriodStats> periods = List.of(
                statsFor(userId, "day", startOfDay(zNow), endExclusive(zNow.plusDays(1))),
                statsFor(userId, "week", startOfWeek(zNow), endExclusive(zNow.plusDays(1))),
                statsFor(userId, "month", startOfMonth(zNow), endExclusive(zNow.plusDays(1))),
                statsFor(userId, "year", startOfYear(zNow), endExclusive(zNow.plusDays(1)))
        );

        Instant weekStart = startOfWeek(zNow);
        List<Visit> recent = visitRepository.findByUserIdAndVisitedAtBetweenOrderByVisitedAtDesc(
                userId, weekStart, endExclusive(zNow.plusDays(1)));

        return new DashboardResponse(
                periods,
                recent.stream().limit(20).map(this::toResponse).toList(),
                ConsistencyInfo.all(),
                StoolColorInfo.all()
        );
    }

    public List<VisitResponse> history(UUID userId, Instant from, Instant to) {
        return visitRepository.findByUserIdAndVisitedAtBetweenOrderByVisitedAtDesc(userId, from, to)
                .stream().map(this::toResponse).toList();
    }

    public String exportCsv(UUID userId, Instant from, Instant to) {
        List<Visit> visits = visitRepository.findByUserIdAndVisitedAtBetweenOrderByVisitedAtAsc(userId, from, to);
        ZoneId zone = resolveZone();
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm", Locale.forLanguageTag("ru"));

        StringBuilder sb = new StringBuilder();
        sb.append("sep=").append(CSV_DELIM).append('\n');
        sb.append("Дата и время").append(CSV_DELIM)
                .append("Количество").append(CSV_DELIM)
                .append("Консистенция").append(CSV_DELIM)
                .append("Цвет").append(CSV_DELIM)
                .append("Вес (г)").append(CSV_DELIM)
                .append("Заметка").append('\n');

        for (Visit v : visits) {
            StoolColor color = resolveColor(v);
            String dateStr = dateFormatter.format(v.getVisitedAt().atZone(zone));
            sb.append(quoteCsv(dateStr)).append(CSV_DELIM)
                    .append(v.getCount()).append(CSV_DELIM)
                    .append(quoteCsv(consistencyLabel(v))).append(CSV_DELIM)
                    .append(quoteCsv(color.getLabel())).append(CSV_DELIM)
                    .append(v.getTotalGrams()).append(CSV_DELIM)
                    .append(quoteCsv(v.getNote())).append('\n');
        }
        return sb.toString();
    }

    private String consistencyLabel(Visit visit) {
        ConsistencyLevel c = visit.getConsistency();
        if (c == ConsistencyLevel.CUSTOM && visit.getCustomGramsPerUnit() != null) {
            return c.getLabel() + " (" + visit.getCustomGramsPerUnit() + " г/шт)";
        }
        return c.getLabel();
    }

    private PeriodStats statsFor(UUID userId, String period, Instant from, Instant to) {
        long grams = visitRepository.sumGrams(userId, from, to);
        long visits = visitRepository.findByUserIdAndVisitedAtBetweenOrderByVisitedAtDesc(userId, from, to).size();
        long count = visitRepository.sumCount(userId, from, to);
        return new PeriodStats(period, grams, visits, count, funFactService.build(grams, period));
    }

    private VisitResponse toResponse(Visit visit) {
        ConsistencyLevel c = visit.getConsistency();
        StoolColor color = resolveColor(visit);
        String label = c == ConsistencyLevel.CUSTOM && visit.getCustomGramsPerUnit() != null
                ? c.getLabel() + " (" + visit.getCustomGramsPerUnit() + " г)"
                : c.getLabel();
        return new VisitResponse(
                visit.getId(),
                visit.getCount(),
                c,
                label,
                c.getImageKey(),
                visit.getTotalGrams(),
                color,
                color.getLabel(),
                color.getHex(),
                visit.getNote(),
                visit.getVisitedAt()
        );
    }

    private Instant startOfDay(ZonedDateTime zdt) {
        return zdt.toLocalDate().atStartOfDay(zdt.getZone()).toInstant();
    }

    private Instant startOfWeek(ZonedDateTime zdt) {
        LocalDate monday = zdt.toLocalDate().with(DayOfWeek.MONDAY);
        return monday.atStartOfDay(zdt.getZone()).toInstant();
    }

    private Instant startOfMonth(ZonedDateTime zdt) {
        return zdt.toLocalDate().withDayOfMonth(1).atStartOfDay(zdt.getZone()).toInstant();
    }

    private Instant startOfYear(ZonedDateTime zdt) {
        return zdt.toLocalDate().withDayOfYear(1).atStartOfDay(zdt.getZone()).toInstant();
    }

    private Instant endExclusive(ZonedDateTime zdt) {
        return zdt.toLocalDate().atStartOfDay(zdt.getZone()).toInstant();
    }

    private StoolColor resolveColor(Visit visit) {
        return visit.getColor() != null ? visit.getColor() : StoolColor.BROWN;
    }

    private String quoteCsv(String value) {
        if (value == null) {
            return "\"\"";
        }
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }
}
