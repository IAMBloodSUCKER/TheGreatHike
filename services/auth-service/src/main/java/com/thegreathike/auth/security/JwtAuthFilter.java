package com.thegreathike.auth.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

public class JwtAuthFilter extends OncePerRequestFilter {

    public static final String USER_ID_ATTR = "userId";
    public static final String USERNAME_ATTR = "username";
    public static final String ADMIN_ATTR = "admin";

    private final SecretKey key;

    public JwtAuthFilter(@Value("${app.jwt.secret}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")) {
            try {
                String token = header.substring(7);
                Claims claims = Jwts.parser()
                        .verifyWith(key)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();
                request.setAttribute(USER_ID_ATTR, UUID.fromString(claims.getSubject()));
                request.setAttribute(USERNAME_ATTR, claims.get("username", String.class));
                Boolean admin = claims.get("admin", Boolean.class);
                request.setAttribute(ADMIN_ATTR, Boolean.TRUE.equals(admin));
            } catch (Exception ignored) {
                // leave unauthenticated
            }
        }
        filterChain.doFilter(request, response);
    }
}
