package com.thegreathike.auth.dto;

import java.time.Instant;
import java.util.UUID;

public record FeedbackResponse(
        UUID id,
        String username,
        String message,
        Instant createdAt,
        String adminReply,
        Instant repliedAt,
        boolean replyUnread,
        boolean adminInitiated
) {}
