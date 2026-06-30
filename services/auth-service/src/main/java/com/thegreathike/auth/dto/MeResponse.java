package com.thegreathike.auth.dto;

import com.thegreathike.auth.entity.Gender;

public record MeResponse(String username, boolean admin, Gender gender) {}
