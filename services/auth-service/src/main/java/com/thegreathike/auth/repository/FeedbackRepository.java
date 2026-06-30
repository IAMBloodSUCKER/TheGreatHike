package com.thegreathike.auth.repository;

import com.thegreathike.auth.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface FeedbackRepository extends JpaRepository<Feedback, UUID> {

    List<Feedback> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<Feedback> findAllByOrderByCreatedAtDesc();

    long countByUserId(UUID userId);

    @Query("""
            SELECT COUNT(f) FROM Feedback f
            WHERE f.adminInitiated = false AND f.adminReply IS NULL
            """)
    long countUnrepliedUserFeedback();

    @Query("""
            SELECT COUNT(f) FROM Feedback f
            WHERE f.userId = :userId AND f.adminInitiated = false AND f.adminReply IS NULL
            """)
    long countUnrepliedUserFeedbackByUserId(@Param("userId") UUID userId);

    @Query("""
            SELECT COUNT(f) FROM Feedback f
            WHERE f.userId = :userId
              AND f.replyReadAt IS NULL
              AND (f.adminInitiated = true OR (f.adminReply IS NOT NULL AND f.adminReply <> ''))
            """)
    long countUnreadForUser(@Param("userId") UUID userId);

    @Query("SELECT COUNT(DISTINCT f.userId) FROM Feedback f")
    long countDistinctUserId();

    void deleteByUserId(UUID userId);

    @Modifying
    @Query("""
            UPDATE Feedback f
            SET f.replyReadAt = :readAt
            WHERE f.userId = :userId
              AND f.replyReadAt IS NULL
              AND (f.adminInitiated = true OR (f.adminReply IS NOT NULL AND f.adminReply <> ''))
            """)
    int markRepliesRead(@Param("userId") UUID userId, @Param("readAt") Instant readAt);
}
