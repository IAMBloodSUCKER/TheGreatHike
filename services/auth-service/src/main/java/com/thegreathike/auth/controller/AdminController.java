package com.thegreathike.auth.controller;

import com.thegreathike.auth.config.FilterConfig.AuthContext;
import com.thegreathike.auth.dto.*;
import com.thegreathike.auth.service.AdminService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/overview")
    public AdminOverviewResponse overview(HttpServletRequest request) {
        AuthContext.requireAdmin(request);
        return adminService.overview();
    }

    @GetMapping("/users")
    public List<AdminUserResponse> users(HttpServletRequest request) {
        AuthContext.requireAdmin(request);
        return adminService.users();
    }

    @GetMapping("/users/{userId}/feedback")
    public List<AdminFeedbackResponse> userFeedback(
            @PathVariable UUID userId,
            HttpServletRequest request) {
        AuthContext.requireAdmin(request);
        try {
            return adminService.feedbackForUser(userId);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    @PostMapping("/users/{userId}/message")
    public AdminFeedbackResponse sendMessage(
            @PathVariable UUID userId,
            @Valid @RequestBody SendDirectMessageRequest body,
            HttpServletRequest request) {
        AuthContext.requireAdmin(request);
        try {
            return adminService.sendDirectMessage(userId, body);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PostMapping("/users/{userId}/block")
    public AdminUserResponse blockUser(@PathVariable UUID userId, HttpServletRequest request) {
        AuthContext.requireAdmin(request);
        try {
            return adminService.blockUser(userId, AuthContext.requireUserId(request));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PostMapping("/users/{userId}/unblock")
    public AdminUserResponse unblockUser(@PathVariable UUID userId, HttpServletRequest request) {
        AuthContext.requireAdmin(request);
        try {
            return adminService.unblockUser(userId, AuthContext.requireUserId(request));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @DeleteMapping("/users/{userId}")
    public void deleteUser(@PathVariable UUID userId, HttpServletRequest request) {
        AuthContext.requireAdmin(request);
        try {
            adminService.deleteUser(userId, AuthContext.requireUserId(request));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
}
