package com.thegreathike.auth.service;

import com.thegreathike.auth.dto.*;
import com.thegreathike.auth.entity.Feedback;
import com.thegreathike.auth.entity.Gender;
import com.thegreathike.auth.entity.User;
import com.thegreathike.auth.repository.FeedbackRepository;
import com.thegreathike.auth.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final FeedbackRepository feedbackRepository;

    public AdminService(UserRepository userRepository, FeedbackRepository feedbackRepository) {
        this.userRepository = userRepository;
        this.feedbackRepository = feedbackRepository;
    }

    public AdminOverviewResponse overview() {
        long totalUsers = userRepository.count();
        long totalFeedback = feedbackRepository.count();
        long unrepliedFeedback = feedbackRepository.countUnrepliedUserFeedback();
        long usersWithFeedback = feedbackRepository.countDistinctUserId();
        return new AdminOverviewResponse(totalUsers, totalFeedback, unrepliedFeedback, usersWithFeedback);
    }

    public List<AdminUserResponse> users() {
        return userRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toUserResponse)
                .toList();
    }

    public List<AdminFeedbackResponse> feedbackForUser(UUID userId) {
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("Пользователь не найден");
        }
        return feedbackRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toAdminFeedback)
                .toList();
    }

    @Transactional
    public AdminFeedbackResponse sendDirectMessage(UUID userId, SendDirectMessageRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
        if (user.isAdmin()) {
            throw new IllegalArgumentException("Нельзя отправить сообщение администратору");
        }
        Feedback feedback = new Feedback();
        feedback.setUserId(user.getId());
        feedback.setUsername(user.getUsername());
        feedback.setMessage(request.message().trim());
        feedback.setAdminInitiated(true);
        feedback.setReplyReadAt(null);
        return toAdminFeedback(feedbackRepository.save(feedback));
    }

    @Transactional
    public AdminUserResponse blockUser(UUID userId, UUID actorId, String comment) {
        User user = requireManageableUser(userId, actorId);
        user.setBlocked(true);
        String trimmed = comment == null ? null : comment.trim();
        user.setBlockComment(trimmed == null || trimmed.isEmpty() ? null : trimmed);
        return toUserResponse(user);
    }

    @Transactional
    public AdminUserResponse unblockUser(UUID userId, UUID actorId) {
        User user = requireManageableUser(userId, actorId);
        user.setBlocked(false);
        user.setBlockComment(null);
        return toUserResponse(user);
    }

    @Transactional
    public void deleteUser(UUID userId, UUID actorId) {
        User user = requireManageableUser(userId, actorId);
        feedbackRepository.deleteByUserId(userId);
        userRepository.delete(user);
    }

    private User requireManageableUser(UUID userId, UUID actorId) {
        if (userId.equals(actorId)) {
            throw new IllegalArgumentException("Нельзя изменить свою учётную запись");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
        if (user.isAdmin()) {
            throw new IllegalArgumentException("Нельзя изменить учётную запись администратора");
        }
        return user;
    }

    private AdminUserResponse toUserResponse(User user) {
        long feedbackCount = feedbackRepository.countByUserId(user.getId());
        long unreplied = feedbackRepository.countUnrepliedUserFeedbackByUserId(user.getId());
        return new AdminUserResponse(
                user.getId(),
                user.getUsername(),
                user.getCreatedAt(),
                user.getGender() != null ? user.getGender() : Gender.MALE,
                user.isAdmin(),
                user.isBlocked(),
                user.getBlockComment(),
                feedbackCount,
                unreplied
        );
    }

    private AdminFeedbackResponse toAdminFeedback(Feedback feedback) {
        return new AdminFeedbackResponse(
                feedback.getId(),
                feedback.getUserId(),
                feedback.getUsername(),
                feedback.getMessage(),
                feedback.getCreatedAt(),
                feedback.getAdminReply(),
                feedback.getRepliedAt(),
                feedback.isAdminInitiated()
        );
    }
}
