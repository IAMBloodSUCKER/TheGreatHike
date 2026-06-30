package com.thegreathike.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SendDirectMessageRequest(
        @NotBlank @Size(min = 1, max = 2000) String message
) {}
