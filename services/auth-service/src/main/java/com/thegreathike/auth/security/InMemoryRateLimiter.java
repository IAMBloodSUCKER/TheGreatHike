package com.thegreathike.auth.security;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Простой in-memory rate limiter (окно 1 мин). Достаточно для одного инстанса без Redis.
 */
public final class InMemoryRateLimiter {

    private final ConcurrentHashMap<String, Deque<Long>> windows = new ConcurrentHashMap<>();
    private final int maxRequests;
    private final long windowMs;

    public InMemoryRateLimiter(int maxRequests, long windowMs) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }

    public boolean tryConsume(String key) {
        long now = Instant.now().toEpochMilli();
        Deque<Long> window = windows.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (window) {
            while (!window.isEmpty() && now - window.peekFirst() > windowMs) {
                window.pollFirst();
            }
            if (window.size() >= maxRequests) {
                return false;
            }
            window.addLast(now);
            return true;
        }
    }
}
