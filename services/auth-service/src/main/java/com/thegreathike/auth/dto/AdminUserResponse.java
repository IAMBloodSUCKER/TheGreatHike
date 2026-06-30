package com.thegreathike.auth.dto;

import com.thegreathike.auth.entity.Gender;

import java.time.Instant;
import java.util.UUID;

public record AdminUserResponse(
        UUID id,
        String username,
        Instant createdAt,
        Gender gender,
        boolean admin,
        boolean blocked,
        long feedbackCount,
        long unrepliedFeedbackCount
) {}
