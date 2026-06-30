package com.thegreathike.auth.config;

import com.thegreathike.auth.security.AdminGateFilter;
import com.thegreathike.auth.security.IpRateLimitFilter;
import com.thegreathike.auth.security.JwtAuthFilter;
import com.thegreathike.auth.service.AdminSessionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Configuration
public class FilterConfig {

    @Bean
    public JwtAuthFilter jwtAuthFilter(@Value("${app.jwt.secret}") String secret) {
        return new JwtAuthFilter(secret);
    }

    @Bean
    public AdminGateFilter adminGateFilterBean(AdminSessionService adminSessionService) {
        return new AdminGateFilter(adminSessionService);
    }

    @Bean
    public FilterRegistrationBean<IpRateLimitFilter> ipRateLimitFilterRegistration(IpRateLimitFilter filter) {
        FilterRegistrationBean<IpRateLimitFilter> bean = new FilterRegistrationBean<>();
        bean.setFilter(filter);
        bean.addUrlPatterns("/api/auth/*");
        bean.setOrder(0);
        return bean;
    }

    @Bean
    public FilterRegistrationBean<JwtAuthFilter> jwtFilter(JwtAuthFilter filter) {
        FilterRegistrationBean<JwtAuthFilter> bean = new FilterRegistrationBean<>();
        bean.setFilter(filter);
        bean.addUrlPatterns("/api/auth/me", "/api/auth/feedback", "/api/auth/feedback/*", "/api/auth/admin", "/api/auth/admin/*");
        bean.setOrder(1);
        return bean;
    }

    @Bean
    public FilterRegistrationBean<AdminGateFilter> adminGateFilterRegistration(AdminGateFilter filter) {
        FilterRegistrationBean<AdminGateFilter> bean = new FilterRegistrationBean<>();
        bean.setFilter(filter);
        bean.addUrlPatterns("/api/auth/admin/*");
        bean.setOrder(2);
        return bean;
    }

    public static final class AuthContext {

        private AuthContext() {
        }

        public static UUID requireUserId(HttpServletRequest request) {
            Object value = request.getAttribute(JwtAuthFilter.USER_ID_ATTR);
            if (value instanceof UUID id) {
                return id;
            }
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Требуется авторизация");
        }

        public static String requireUsername(HttpServletRequest request) {
            Object value = request.getAttribute(JwtAuthFilter.USERNAME_ATTR);
            if (value instanceof String username) {
                return username;
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
}
