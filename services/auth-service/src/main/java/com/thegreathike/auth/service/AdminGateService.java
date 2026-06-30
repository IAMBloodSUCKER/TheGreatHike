package com.thegreathike.auth.service;

import com.thegreathike.auth.dto.AdminUnlockRequest;
import com.thegreathike.auth.dto.AdminUnlockResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.UUID;

@Service
public class AdminGateService {

    private final CaptchaService captchaService;
    private final AdminSessionService adminSessionService;
    private final String adminSecretKey;

    public AdminGateService(
            CaptchaService captchaService,
            AdminSessionService adminSessionService,
            @Value("${app.admin.secret-key}") String adminSecretKey) {
        this.captchaService = captchaService;
        this.adminSessionService = adminSessionService;
        this.adminSecretKey = adminSecretKey;
    }

    public AdminUnlockResponse unlock(UUID userId, AdminUnlockRequest request) {
        captchaService.validate(request.captchaId(), request.captchaAnswer());
        if (!isValidSecret(request.adminSecret())) {
            throw new IllegalArgumentException("Неверный секретный ключ админки");
        }
        String token = adminSessionService.issue(userId);
        return new AdminUnlockResponse(token, adminSessionService.expirationSeconds());
    }

    private boolean isValidSecret(String provided) {
        if (adminSecretKey == null || adminSecretKey.length() < 12) {
            throw new IllegalStateException("ADMIN_SECRET_KEY не настроен на сервере");
        }
        if (provided == null) {
            return false;
        }
        return MessageDigest.isEqual(
                adminSecretKey.getBytes(StandardCharsets.UTF_8),
                provided.getBytes(StandardCharsets.UTF_8));
    }
}
