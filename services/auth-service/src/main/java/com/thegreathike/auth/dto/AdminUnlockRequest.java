package com.thegreathike.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record AdminUnlockRequest(
        @NotBlank String captchaId,
        @NotBlank String captchaAnswer,
        @NotBlank String adminSecret
) {}
