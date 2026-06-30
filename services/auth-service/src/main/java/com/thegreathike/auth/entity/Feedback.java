package com.thegreathike.auth.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "feedback", indexes = {
        @Index(name = "idx_feedback_user", columnList = "userId"),
        @Index(name = "idx_feedback_created", columnList = "createdAt")
})
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 64)
    private String username;

    @Column(nullable = false, length = 2000)
    private String message;

    @Column(nullable = false)
    private boolean adminInitiated = false;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(length = 2000)
    private String adminReply;

    private Instant repliedAt;

    private Instant replyReadAt;

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isAdminInitiated() {
        return adminInitiated;
    }

    public void setAdminInitiated(boolean adminInitiated) {
        this.adminInitiated = adminInitiated;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public String getAdminReply() {
        return adminReply;
    }

    public void setAdminReply(String adminReply) {
        this.adminReply = adminReply;
    }

    public Instant getRepliedAt() {
        return repliedAt;
    }

    public void setRepliedAt(Instant repliedAt) {
        this.repliedAt = repliedAt;
    }

    public Instant getReplyReadAt() {
        return replyReadAt;
    }

    public void setReplyReadAt(Instant replyReadAt) {
        this.replyReadAt = replyReadAt;
    }
}
