package com.thegreathike.auth.dto;

public record AuthResponse(String token, String username, boolean admin) {}
