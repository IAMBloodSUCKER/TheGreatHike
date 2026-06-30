package com.thegreathike.auth.dto;

import java.time.Instant;
import java.util.UUID;

public record AdminFeedbackResponse(
        UUID id,
        UUID userId,
        String username,
        String message,
        Instant createdAt,
        String adminReply,
        Instant repliedAt,
        boolean adminInitiated
) {}
