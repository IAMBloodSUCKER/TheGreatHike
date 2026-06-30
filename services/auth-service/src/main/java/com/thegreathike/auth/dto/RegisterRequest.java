package com.thegreathike.auth.dto;

import com.thegreathike.auth.entity.Gender;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(min = 3, max = 64)
        @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Логин: только латиница, цифры и _")
        String username,

        @NotBlank @Size(min = 6, max = 128)
        String password,

        @NotBlank @Size(min = 8, max = 128)
        String recoveryKey,

        @NotBlank
        String captchaId,

        @NotBlank
        String captchaAnswer,

        boolean termsAccepted,

        @NotNull
        Gender gender
) {}
