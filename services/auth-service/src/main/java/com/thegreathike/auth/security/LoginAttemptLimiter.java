package com.thegreathike.auth.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class LoginAttemptLimiter {

    private final int maxFailures;
    private final long lockMs;
    private final Map<String, AttemptState> states = new ConcurrentHashMap<>();

    public LoginAttemptLimiter(
            @Value("${app.security.rate-limit.login-failures:8}") int maxFailures,
            @Value("${app.security.rate-limit.login-lock-minutes:15}") int lockMinutes) {
        this.maxFailures = maxFailures;
        this.lockMs = lockMinutes * 60_000L;
    }

    public void checkAllowed(String username, String ip) {
        String key = normalize(username) + "|" + ip;
        AttemptState state = states.get(key);
        if (state == null) {
            return;
        }
        long now = Instant.now().toEpochMilli();
        if (state.lockedUntil > now) {
            throw new IllegalArgumentException("Слишком много неудачных попыток. Попробуйте позже.");
        }
        if (state.lockedUntil > 0 && state.lockedUntil <= now) {
            states.remove(key);
        }
    }

    public void recordFailure(String username, String ip) {
        String key = normalize(username) + "|" + ip;
        long now = Instant.now().toEpochMilli();
        states.compute(key, (k, state) -> {
            AttemptState next = state == null ? new AttemptState() : state;
            if (next.lockedUntil > now) {
                return next;
            }
            next.failures++;
            if (next.failures >= maxFailures) {
                next.lockedUntil = now + lockMs;
                next.failures = 0;
            }
            return next;
        });
    }

    public void recordSuccess(String username, String ip) {
        states.remove(normalize(username) + "|" + ip);
    }

    private static String normalize(String username) {
        return username == null ? "" : username.trim().toLowerCase();
    }

    private static final class AttemptState {
        int failures;
        long lockedUntil;
    }
}
