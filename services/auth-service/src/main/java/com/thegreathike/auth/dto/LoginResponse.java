package com.thegreathike.auth.dto;

public record LoginResponse(
        String status,
        String token,
        String username,
        Boolean admin
) {
    public static final String STATUS_SUCCESS = "SUCCESS";
    public static final String STATUS_BLOCKED_KEY_REQUIRED = "BLOCKED_KEY_REQUIRED";

    public static LoginResponse success(String token, String username, boolean admin) {
        return new LoginResponse(STATUS_SUCCESS, token, username, admin);
    }

    public static LoginResponse blockedKeyRequired() {
        return new LoginResponse(STATUS_BLOCKED_KEY_REQUIRED, null, null, null);
    }
}
