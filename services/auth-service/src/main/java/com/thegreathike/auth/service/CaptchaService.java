package com.thegreathike.auth.service;

import com.thegreathike.auth.dto.CaptchaResponse;
import com.thegreathike.auth.entity.CaptchaChallenge;
import com.thegreathike.auth.repository.CaptchaChallengeRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Service
public class CaptchaService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int TTL_SECONDS = 300;

    private final CaptchaChallengeRepository repository;
    private final PasswordEncoder passwordEncoder;

    public CaptchaService(CaptchaChallengeRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public CaptchaResponse generate() {
        int a = RANDOM.nextInt(9) + 1;
        int b = RANDOM.nextInt(9) + 1;
        String answer = String.valueOf(a + b);
        String question = a + " + " + b + " = ?";

        CaptchaChallenge challenge = new CaptchaChallenge();
        challenge.setAnswerHash(passwordEncoder.encode(answer));
        challenge.setExpiresAt(Instant.now().plusSeconds(TTL_SECONDS));
        challenge = repository.save(challenge);

        String imageBase64 = renderImage(question);
        return new CaptchaResponse(challenge.getId().toString(), imageBase64);
    }

    @Transactional
    public void validate(String captchaId, String answer) {
        UUID id = UUID.fromString(captchaId);
        CaptchaChallenge challenge = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Капча не найдена"));

        if (challenge.isUsed()) {
            throw new IllegalArgumentException("Капча уже использована");
        }
        if (challenge.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Капча истекла");
        }
        if (!passwordEncoder.matches(answer.trim(), challenge.getAnswerHash())) {
            throw new IllegalArgumentException("Неверная капча");
        }
        challenge.setUsed(true);
        repository.save(challenge);
    }

    private String renderImage(String text) {
        int width = 180;
        int height = 60;
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        g.setColor(new Color(245, 240, 230));
        g.fillRect(0, 0, width, height);

        for (int i = 0; i < 8; i++) {
            g.setColor(new Color(RANDOM.nextInt(200), RANDOM.nextInt(200), RANDOM.nextInt(200), 80));
            g.drawLine(RANDOM.nextInt(width), RANDOM.nextInt(height),
                    RANDOM.nextInt(width), RANDOM.nextInt(height));
        }

        g.setFont(new Font("SansSerif", Font.BOLD, 28));
        g.setColor(new Color(60, 40, 20));
        g.drawString(text, 24, 40);
        g.dispose();

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            ImageIO.write(image, "png", baos);
            return Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (Exception e) {
            throw new IllegalStateException("Не удалось сгенерировать капчу", e);
        }
    }
}
