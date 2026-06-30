package com.thegreathike.auth.dto;

import jakarta.validation.constraints.Size;

public record BlockUserRequest(
        @Size(max = 2000) String comment
) {}
