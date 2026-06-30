package com.thegreathike.auth.service;

import com.thegreathike.auth.entity.Gender;
import com.thegreathike.auth.entity.User;
import com.thegreathike.auth.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AdminBootstrap {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminUsername;
    private final String adminPassword;
    private final String adminRecoveryKey;

    public AdminBootstrap(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.username:admin}") String adminUsername,
            @Value("${app.admin.password:admin}") String adminPassword,
            @Value("${app.admin.recovery-key:AdminKey1}") String adminRecoveryKey) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminUsername = adminUsername;
        this.adminPassword = adminPassword;
        this.adminRecoveryKey = adminRecoveryKey;
    }

    @PostConstruct
    @Transactional
    public void ensureAdminUser() {
        userRepository.findByUsername(adminUsername).ifPresentOrElse(
                user -> promoteIfNeeded(user),
                this::createAdmin
        );
    }

    private void promoteIfNeeded(User user) {
        boolean changed = false;
        if (!user.isAdmin()) {
            user.setAdmin(true);
            changed = true;
            log.info("Пользователь {} назначен администратором", adminUsername);
        }
        if (user.getRecoveryKeyHash() == null || user.getRecoveryKeyHash().isBlank()) {
            user.setRecoveryKeyHash(passwordEncoder.encode(adminRecoveryKey));
            changed = true;
        }
        if (changed) {
            userRepository.save(user);
        }
    }

    private void createAdmin() {
        User user = new User();
        user.setUsername(adminUsername);
        user.setPasswordHash(passwordEncoder.encode(adminPassword));
        user.setRecoveryKeyHash(passwordEncoder.encode(adminRecoveryKey));
        user.setTermsAccepted(true);
        user.setAdmin(true);
        user.setGender(Gender.MALE);
        userRepository.save(user);
        log.info("Создан администратор: {} (смените пароль после первого входа)", adminUsername);
    }
}
