package com.thegreathike.auth.security;

import com.thegreathike.auth.service.AdminSessionService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

public class AdminGateFilter extends OncePerRequestFilter {

    private final AdminSessionService adminSessionService;

    public AdminGateFilter(AdminSessionService adminSessionService) {
        this.adminSessionService = adminSessionService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (!path.startsWith("/api/auth/admin/")) {
            return true;
        }
        return path.endsWith("/unlock");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        Object userId = request.getAttribute(JwtAuthFilter.USER_ID_ATTR);
        if (!(userId instanceof UUID id)) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Требуется авторизация");
            return;
        }
        try {
            adminSessionService.validate(request.getHeader(AdminSessionService.HEADER_NAME), id);
        } catch (IllegalArgumentException e) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, e.getMessage());
            return;
        }
        filterChain.doFilter(request, response);
    }
}
