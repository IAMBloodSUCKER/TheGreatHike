package com.thegreathike.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

@Component
public class IpRateLimitFilter extends OncePerRequestFilter {

    private final Map<String, InMemoryRateLimiter> limiters;

    public IpRateLimitFilter(
            @Value("${app.security.rate-limit.captcha-per-minute:12}") int captchaPerMinute,
            @Value("${app.security.rate-limit.auth-per-minute:30}") int authPerMinute) {
        this.limiters = Map.of(
                "/api/auth/captcha", new InMemoryRateLimiter(captchaPerMinute, 60_000),
                "/api/auth/username-available", new InMemoryRateLimiter(captchaPerMinute, 60_000),
                "/api/auth/login", new InMemoryRateLimiter(authPerMinute, 60_000),
                "/api/auth/register", new InMemoryRateLimiter(authPerMinute, 60_000),
                "/api/auth/recover", new InMemoryRateLimiter(authPerMinute, 60_000),
                "/api/auth/admin/unlock", new InMemoryRateLimiter(Math.max(6, authPerMinute / 3), 60_000)
        );
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        InMemoryRateLimiter limiter = limiters.get(path);
        if (limiter != null) {
            String key = ClientIp.resolve(request) + ":" + path;
            if (!limiter.tryConsume(key)) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"message\":\"Слишком много запросов. Подождите минуту.\"}");
                return;
            }
        }
        filterChain.doFilter(request, response);
    }
}
