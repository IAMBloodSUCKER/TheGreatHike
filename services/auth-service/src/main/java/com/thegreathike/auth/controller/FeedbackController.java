package com.thegreathike.auth.controller;

import com.thegreathike.auth.config.FilterConfig.AuthContext;
import com.thegreathike.auth.dto.*;
import com.thegreathike.auth.service.AdminGateService;
import com.thegreathike.auth.service.FeedbackService;
import com.thegreathike.auth.service.MeService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class FeedbackController {

    private final FeedbackService feedbackService;
    private final MeService meService;
    private final AdminGateService adminGateService;

    public FeedbackController(
            FeedbackService feedbackService,
            MeService meService,
            AdminGateService adminGateService) {
        this.feedbackService = feedbackService;
        this.meService = meService;
        this.adminGateService = adminGateService;
    }

    @GetMapping("/me")
    public MeResponse me(HttpServletRequest request) {
        try {
            return meService.me(AuthContext.requireUserId(request));
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        }
    }

    @PostMapping("/feedback")
    public FeedbackResponse create(@Valid @RequestBody CreateFeedbackRequest body, HttpServletRequest request) {
        try {
            return feedbackService.create(
                    AuthContext.requireUserId(request),
                    AuthContext.requireUsername(request),
                    body
            );
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @GetMapping("/feedback/mine")
    public List<FeedbackResponse> mine(HttpServletRequest request) {
        return feedbackService.mine(AuthContext.requireUserId(request));
    }

    @GetMapping("/feedback/unread-count")
    public UnreadFeedbackCountResponse unreadCount(HttpServletRequest request) {
        int count = feedbackService.unreadCount(AuthContext.requireUserId(request));
        return new UnreadFeedbackCountResponse(count);
    }

    @PostMapping("/feedback/mark-read")
    public UnreadFeedbackCountResponse markRead(HttpServletRequest request) {
        UUID userId = AuthContext.requireUserId(request);
        feedbackService.markRepliesRead(userId);
        return new UnreadFeedbackCountResponse(feedbackService.unreadCount(userId));
    }

    @PostMapping("/admin/unlock")
    public AdminUnlockResponse unlock(@Valid @RequestBody AdminUnlockRequest body, HttpServletRequest request) {
        AuthContext.requireAdmin(request);
        try {
            return adminGateService.unlock(AuthContext.requireUserId(request), body);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    @GetMapping("/admin/feedback")
    public List<FeedbackResponse> allFeedback(HttpServletRequest request) {
        AuthContext.requireAdmin(request);
        return feedbackService.allForAdmin();
    }

    @PostMapping("/admin/feedback/{id}/reply")
    public FeedbackResponse reply(
            @PathVariable UUID id,
            @Valid @RequestBody ReplyFeedbackRequest body,
            HttpServletRequest request) {
        AuthContext.requireAdmin(request);
        try {
            return feedbackService.reply(id, body);
        } catch (IllegalArgumentException e) {
            if ("Отзыв не найден".equals(e.getMessage())) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
            }
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
}
