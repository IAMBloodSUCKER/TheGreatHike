package com.thegreathike.tracking.entity;

import com.thegreathike.tracking.model.ConsistencyLevel;
import com.thegreathike.tracking.model.StoolColor;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "visits", indexes = {
        @Index(name = "idx_visits_user_time", columnList = "userId,visitedAt")
})
public class Visit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private int count = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ConsistencyLevel consistency;

    @Column(nullable = false)
    private int totalGrams;

    @Column(length = 256)
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private StoolColor color;

    @Column
    private Integer customGramsPerUnit;

    @Column(nullable = false)
    private Instant visitedAt = Instant.now();

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public int getCount() {
        return count;
    }

    public void setCount(int count) {
        this.count = count;
    }

    public ConsistencyLevel getConsistency() {
        return consistency;
    }

    public void setConsistency(ConsistencyLevel consistency) {
        this.consistency = consistency;
    }

    public int getTotalGrams() {
        return totalGrams;
    }

    public void setTotalGrams(int totalGrams) {
        this.totalGrams = totalGrams;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public StoolColor getColor() {
        return color;
    }

    public void setColor(StoolColor color) {
        this.color = color;
    }

    public Integer getCustomGramsPerUnit() {
        return customGramsPerUnit;
    }

    public void setCustomGramsPerUnit(Integer customGramsPerUnit) {
        this.customGramsPerUnit = customGramsPerUnit;
    }

    public Instant getVisitedAt() {
        return visitedAt;
    }

    public void setVisitedAt(Instant visitedAt) {
        this.visitedAt = visitedAt;
    }
}
