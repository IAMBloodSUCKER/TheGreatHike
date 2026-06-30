package com.thegreathike.auth.dto;

public record AdminOverviewResponse(
        long totalUsers,
        long totalFeedback,
        long unrepliedFeedback,
        long usersWithFeedback
) {}
