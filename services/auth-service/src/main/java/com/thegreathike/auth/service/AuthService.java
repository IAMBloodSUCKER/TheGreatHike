package com.thegreathike.auth.service;

import com.thegreathike.auth.dto.AuthResponse;
import com.thegreathike.auth.dto.BlockedRevealRequest;
import com.thegreathike.auth.dto.BlockedRevealResponse;
import com.thegreathike.auth.dto.LoginRequest;
import com.thegreathike.auth.dto.LoginResponse;
import com.thegreathike.auth.dto.RecoverPasswordRequest;
import com.thegreathike.auth.dto.RegisterRequest;
import com.thegreathike.auth.entity.Gender;
import com.thegreathike.auth.entity.User;
import com.thegreathike.auth.repository.UserRepository;
import com.thegreathike.auth.security.ClientIp;
import com.thegreathike.auth.security.LoginAttemptLimiter;
import com.thegreathike.auth.validation.AuthCredentialsValidator;
import com.thegreathike.auth.validation.RecoveryKeyValidator;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CaptchaService captchaService;
    private final JwtService jwtService;
    private final LoginAttemptLimiter loginAttemptLimiter;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            CaptchaService captchaService,
            JwtService jwtService,
            LoginAttemptLimiter loginAttemptLimiter) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.captchaService = captchaService;
        this.jwtService = jwtService;
        this.loginAttemptLimiter = loginAttemptLimiter;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (!request.termsAccepted()) {
            throw new IllegalArgumentException("Необходимо принять пользовательское соглашение");
        }
        captchaService.validate(request.captchaId(), request.captchaAnswer());

        if (userRepository.existsByUsernameIgnoreCase(request.username())) {
            throw new IllegalArgumentException("Такой логин уже занят");
        }

        AuthCredentialsValidator.validatePasswordNotUsername(request.username(), request.password());
        RecoveryKeyValidator.validate(request.recoveryKey(), request.username(), request.password());

        User user = new User();
        user.setUsername(request.username());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRecoveryKeyHash(passwordEncoder.encode(request.recoveryKey()));
        user.setTermsAccepted(true);
        user.setGender(request.gender());
        user = userRepository.save(user);

        String token = jwtService.generateToken(
                user.getId(),
                user.getUsername(),
                user.isAdmin(),
                jwtService.rememberExpirationMs());
        return new AuthResponse(token, user.getUsername(), user.isAdmin());
    }

    @Transactional
    public LoginResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String ip = ClientIp.resolve(httpRequest);
        loginAttemptLimiter.checkAllowed(request.username(), ip);
        captchaService.validate(request.captchaId(), request.captchaAnswer());

        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> {
                    loginAttemptLimiter.recordFailure(request.username(), ip);
                    return new IllegalArgumentException("Неверный логин или пароль");
                });

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            loginAttemptLimiter.recordFailure(request.username(), ip);
            throw new IllegalArgumentException("Неверный логин или пароль");
        }

        if (user.isBlocked()) {
            loginAttemptLimiter.recordSuccess(request.username(), ip);
            return LoginResponse.blockedKeyRequired();
        }

        loginAttemptLimiter.recordSuccess(request.username(), ip);
        long ttl = Boolean.TRUE.equals(request.rememberMe())
                ? jwtService.rememberExpirationMs()
                : jwtService.defaultExpirationMs();
        String token = jwtService.generateToken(user.getId(), user.getUsername(), user.isAdmin(), ttl);
        return LoginResponse.success(token, user.getUsername(), user.isAdmin());
    }

    @Transactional(readOnly = true)
    public BlockedRevealResponse revealBlockedAccount(BlockedRevealRequest request, HttpServletRequest httpRequest) {
        String ip = ClientIp.resolve(httpRequest);
        String limitKey = "blocked:" + request.username();
        loginAttemptLimiter.checkAllowed(limitKey, ip);
        captchaService.validate(request.captchaId(), request.captchaAnswer());

        User user = userRepository.findByUsername(request.username()).orElse(null);
        boolean valid = user != null
                && user.isBlocked()
                && passwordEncoder.matches(request.password(), user.getPasswordHash())
                && user.getRecoveryKeyHash() != null
                && !user.getRecoveryKeyHash().isBlank()
                && passwordEncoder.matches(request.recoveryKey(), user.getRecoveryKeyHash());

        if (!valid) {
            loginAttemptLimiter.recordFailure(limitKey, ip);
            throw new IllegalArgumentException("Неверная ключевая фраза");
        }

        loginAttemptLimiter.recordSuccess(limitKey, ip);
        String teamMessage = user.getBlockComment();
        if (teamMessage != null) {
            teamMessage = teamMessage.trim();
        }
        if (teamMessage == null || teamMessage.isBlank()) {
            teamMessage = null;
        }
        return new BlockedRevealResponse("Аккаунт заблокирован", teamMessage);
    }

    @Transactional
    public AuthResponse recoverPassword(RecoverPasswordRequest request, HttpServletRequest httpRequest) {
        String ip = ClientIp.resolve(httpRequest);
        String limitKey = "recover:" + request.username();
        loginAttemptLimiter.checkAllowed(limitKey, ip);
        captchaService.validate(request.captchaId(), request.captchaAnswer());

        User user = userRepository.findByUsername(request.username()).orElse(null);
        boolean valid = user != null
                && !user.isBlocked()
                && user.getRecoveryKeyHash() != null
                && !user.getRecoveryKeyHash().isBlank()
                && passwordEncoder.matches(request.recoveryKey(), user.getRecoveryKeyHash());

        if (!valid) {
            loginAttemptLimiter.recordFailure(limitKey, ip);
            throw new IllegalArgumentException("Не удалось восстановить доступ. Проверьте логин и ключевую фразу.");
        }

        AuthCredentialsValidator.validatePasswordNotUsername(request.username(), request.newPassword());
        if (request.newPassword().equals(request.recoveryKey())) {
            throw new IllegalArgumentException("Новый пароль не должен совпадать с ключевой фразой");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        loginAttemptLimiter.recordSuccess(limitKey, ip);
        long ttl = Boolean.TRUE.equals(request.rememberMe())
                ? jwtService.rememberExpirationMs()
                : jwtService.defaultExpirationMs();
        String token = jwtService.generateToken(user.getId(), user.getUsername(), user.isAdmin(), ttl);
        return new AuthResponse(token, user.getUsername(), user.isAdmin());
    }

    public boolean isUsernameAvailable(String username) {
        if (username == null || username.length() < 3) {
            return false;
        }
        return !userRepository.existsByUsernameIgnoreCase(username);
    }
}
