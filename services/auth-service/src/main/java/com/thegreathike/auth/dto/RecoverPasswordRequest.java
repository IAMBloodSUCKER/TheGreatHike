package com.thegreathike.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RecoverPasswordRequest(
        @NotBlank @Size(min = 3, max = 64)
        @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Логин: только латиница, цифры и _")
        String username,

        @NotBlank @Size(min = 8, max = 128)
        String recoveryKey,

        @NotBlank @Size(min = 6, max = 128)
        String newPassword,

        @NotBlank
        String captchaId,

        @NotBlank
        String captchaAnswer,

        Boolean rememberMe
) {}
