package com.thegreathike.auth.dto;

public record AdminUnlockResponse(String adminSessionToken, long expiresInSeconds) {}
