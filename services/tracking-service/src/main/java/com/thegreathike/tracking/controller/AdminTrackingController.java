package com.thegreathike.tracking.controller;

import com.thegreathike.tracking.config.AuthContext;
import com.thegreathike.tracking.dto.AdminTrackingOverview;
import com.thegreathike.tracking.dto.UserVisitStats;
import com.thegreathike.tracking.service.AdminTrackingService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tracking/admin")
public class AdminTrackingController {

    private final AdminTrackingService adminTrackingService;

    public AdminTrackingController(AdminTrackingService adminTrackingService) {
        this.adminTrackingService = adminTrackingService;
    }

    @GetMapping("/overview")
    public AdminTrackingOverview overview(HttpServletRequest request) {
        AuthContext.requireUserId(request);
        AuthContext.requireAdmin(request);
        return adminTrackingService.overview();
    }

    @GetMapping("/user-stats")
    public List<UserVisitStats> userStats(HttpServletRequest request) {
        AuthContext.requireUserId(request);
        AuthContext.requireAdmin(request);
        return adminTrackingService.statsByUser();
    }
}
