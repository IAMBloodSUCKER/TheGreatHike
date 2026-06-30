package com.thegreathike.tracking.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class AdminSessionService {

    public static final String HEADER_NAME = "X-Admin-Session";

    private final SecretKey key;

    public AdminSessionService(@Value("${app.jwt.secret}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public void validate(String token, UUID expectedUserId) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Требуется подтверждение входа в админку");
        }
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token.trim())
                    .getPayload();
            if (!Boolean.TRUE.equals(claims.get("adminGate", Boolean.class))) {
                throw new IllegalArgumentException("Недействительная сессия админки");
            }
            UUID userId = UUID.fromString(claims.getSubject());
            if (!userId.equals(expectedUserId)) {
                throw new IllegalArgumentException("Недействительная сессия админки");
            }
        } catch (JwtException | IllegalArgumentException e) {
            throw new IllegalArgumentException("Сессия админки истекла — войдите снова");
        }
    }
}
