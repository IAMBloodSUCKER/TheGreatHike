package com.thegreathike.tracking.config;

import com.thegreathike.tracking.security.AdminGateFilter;
import com.thegreathike.tracking.security.JwtAuthFilter;
import com.thegreathike.tracking.service.AdminSessionService;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FilterConfig {

    @Bean
    public AdminGateFilter adminGateFilter(AdminSessionService adminSessionService) {
        return new AdminGateFilter(adminSessionService);
    }

    @Bean
    public FilterRegistrationBean<JwtAuthFilter> jwtFilter(JwtAuthFilter filter) {
        FilterRegistrationBean<JwtAuthFilter> bean = new FilterRegistrationBean<>();
        bean.setFilter(filter);
        bean.addUrlPatterns("/api/tracking/*");
        bean.setOrder(1);
        return bean;
    }

    @Bean
    public FilterRegistrationBean<AdminGateFilter> adminGateFilterRegistration(AdminGateFilter filter) {
        FilterRegistrationBean<AdminGateFilter> bean = new FilterRegistrationBean<>();
        bean.setFilter(filter);
        bean.addUrlPatterns("/api/tracking/admin/*");
        bean.setOrder(2);
        return bean;
    }
}
