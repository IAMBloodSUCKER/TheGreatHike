package com.thegreathike.auth.service;

import com.thegreathike.auth.dto.CreateFeedbackRequest;
import com.thegreathike.auth.dto.FeedbackResponse;
import com.thegreathike.auth.dto.ReplyFeedbackRequest;
import com.thegreathike.auth.entity.Feedback;
import com.thegreathike.auth.entity.User;
import com.thegreathike.auth.repository.FeedbackRepository;
import com.thegreathike.auth.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;

    public FeedbackService(FeedbackRepository feedbackRepository, UserRepository userRepository) {
        this.feedbackRepository = feedbackRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public FeedbackResponse create(UUID userId, String username, CreateFeedbackRequest request) {
        ensureActive(userId);
        Feedback feedback = new Feedback();
        feedback.setUserId(userId);
        feedback.setUsername(username);
        feedback.setMessage(request.message().trim());
        feedback = feedbackRepository.save(feedback);
        return toResponse(feedback);
    }

    public List<FeedbackResponse> mine(UUID userId) {
        return feedbackRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<FeedbackResponse> allForAdmin() {
        return feedbackRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    public int unreadCount(UUID userId) {
        return (int) feedbackRepository.countUnreadForUser(userId);
    }

    @Transactional
    public int markRepliesRead(UUID userId) {
        return feedbackRepository.markRepliesRead(userId, Instant.now());
    }

    @Transactional
    public FeedbackResponse reply(UUID feedbackId, ReplyFeedbackRequest request) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new IllegalArgumentException("Отзыв не найден"));
        if (feedback.isAdminInitiated()) {
            throw new IllegalArgumentException("На сообщение команды нельзя ответить");
        }
        if (feedback.getAdminReply() != null && !feedback.getAdminReply().isBlank()) {
            throw new IllegalArgumentException("На этот отзыв уже дан ответ");
        }
        feedback.setAdminReply(request.reply().trim());
        feedback.setRepliedAt(Instant.now());
        feedback.setReplyReadAt(null);
        return toResponse(feedback);
    }

    private void ensureActive(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
        if (user.isBlocked()) {
            throw new IllegalArgumentException("Учётная запись заблокирована");
        }
    }

    private FeedbackResponse toResponse(Feedback feedback) {
        boolean replyUnread = feedback.getReplyReadAt() == null
                && (feedback.isAdminInitiated()
                || (feedback.getAdminReply() != null && !feedback.getAdminReply().isBlank()));
        return new FeedbackResponse(
                feedback.getId(),
                feedback.getUsername(),
                feedback.getMessage(),
                feedback.getCreatedAt(),
                feedback.getAdminReply(),
                feedback.getRepliedAt(),
                replyUnread,
                feedback.isAdminInitiated()
        );
    }
}
