package com.thegreathike.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BlockedRevealRequest(
        @NotBlank @Size(min = 3, max = 64) String username,
        @NotBlank @Size(min = 6, max = 128) String password,
        @NotBlank @Size(min = 8, max = 128) String recoveryKey,
        @NotBlank String captchaId,
        @NotBlank String captchaAnswer
) {}
