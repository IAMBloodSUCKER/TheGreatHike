package com.thegreathike.auth.repository;

import com.thegreathike.auth.entity.CaptchaChallenge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CaptchaChallengeRepository extends JpaRepository<CaptchaChallenge, UUID> {
}
