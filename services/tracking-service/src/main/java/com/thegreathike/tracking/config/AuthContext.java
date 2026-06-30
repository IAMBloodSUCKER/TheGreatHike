package com.thegreathike.tracking.config;

import com.thegreathike.tracking.security.JwtAuthFilter;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

public final class AuthContext {

    private AuthContext() {
    }

    public static UUID requireUserId(HttpServletRequest request) {
        Object userId = request.getAttribute(JwtAuthFilter.USER_ID_ATTR);
        if (userId instanceof UUID id) {
            return id;
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Требуется авторизация");
    }

    public static void requireAdmin(HttpServletRequest request) {
        Object value = request.getAttribute(JwtAuthFilter.ADMIN_ATTR);
        if (!Boolean.TRUE.equals(value)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Доступ только для администратора");
        }
    }
}
