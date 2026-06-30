package com.thegreathike.auth.controller;

import com.thegreathike.auth.dto.*;
import com.thegreathike.auth.service.AuthService;
import com.thegreathike.auth.service.CaptchaService;
import com.thegreathike.auth.service.TermsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final CaptchaService captchaService;
    private final TermsService termsService;

    public AuthController(AuthService authService, CaptchaService captchaService, TermsService termsService) {
        this.authService = authService;
        this.captchaService = captchaService;
        this.termsService = termsService;
    }

    @GetMapping("/captcha")
    public CaptchaResponse captcha() {
        return captchaService.generate();
    }

    @GetMapping("/terms")
    public TermsResponse terms() {
        return termsService.getTerms();
    }

    @GetMapping("/username-available")
    public UsernameAvailableResponse usernameAvailable(@RequestParam("username") String username) {
        String normalized = username == null ? "" : username.trim();
        return new UsernameAvailableResponse(authService.isUsernameAvailable(normalized));
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        try {
            return authService.register(request);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        try {
            return authService.login(request, httpRequest);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, e.getMessage());
        }
    }

    @PostMapping("/recover")
    public AuthResponse recover(@Valid @RequestBody RecoverPasswordRequest request, HttpServletRequest httpRequest) {
        try {
            return authService.recoverPassword(request, httpRequest);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
}
