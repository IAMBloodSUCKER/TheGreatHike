package com.thegreathike.tracking.repository;

import com.thegreathike.tracking.dto.UserVisitStats;
import com.thegreathike.tracking.entity.Visit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VisitRepository extends JpaRepository<Visit, UUID> {

    Optional<Visit> findByIdAndUserId(UUID id, UUID userId);

    List<Visit> findByUserIdAndVisitedAtBetweenOrderByVisitedAtDesc(
            UUID userId, Instant from, Instant to);

    List<Visit> findByUserIdAndVisitedAtBetweenOrderByVisitedAtAsc(
            UUID userId, Instant from, Instant to);

    long countByUserId(UUID userId);

    @Query("SELECT COALESCE(SUM(v.totalGrams), 0) FROM Visit v WHERE v.userId = :userId")
    long sumGramsByUserId(@Param("userId") UUID userId);

    @Query("SELECT COUNT(DISTINCT v.userId) FROM Visit v")
    long countDistinctUsers();

    @Query("SELECT COALESCE(SUM(v.totalGrams), 0) FROM Visit v")
    long sumAllGrams();

    @Query("""
            SELECT new com.thegreathike.tracking.dto.UserVisitStats(
                v.userId, COUNT(v), COALESCE(SUM(v.totalGrams), 0))
            FROM Visit v
            GROUP BY v.userId
            ORDER BY COUNT(v) DESC
            """)
    List<UserVisitStats> statsByUser();

    @Query("SELECT COALESCE(SUM(v.totalGrams), 0) FROM Visit v WHERE v.userId = :userId AND v.visitedAt >= :from AND v.visitedAt < :to")
    long sumGrams(@Param("userId") UUID userId, @Param("from") Instant from, @Param("to") Instant to);

    @Query("SELECT COALESCE(SUM(v.count), 0) FROM Visit v WHERE v.userId = :userId AND v.visitedAt >= :from AND v.visitedAt < :to")
    long sumCount(@Param("userId") UUID userId, @Param("from") Instant from, @Param("to") Instant to);
}
