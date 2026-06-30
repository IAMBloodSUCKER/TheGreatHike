package com.thegreathike.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank @Size(min = 3, max = 64) String username,
        @NotBlank @Size(max = 128) String password,
        @NotBlank String captchaId,
        @NotBlank String captchaAnswer,
        Boolean rememberMe
) {}
