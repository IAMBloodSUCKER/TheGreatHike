package com.thegreathike.auth.service;

import com.thegreathike.auth.dto.MeResponse;
import com.thegreathike.auth.entity.Gender;
import com.thegreathike.auth.entity.User;
import com.thegreathike.auth.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class MeService {

    private final UserRepository userRepository;

    public MeService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public MeResponse me(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
        if (user.isBlocked()) {
            throw new IllegalStateException("Учётная запись заблокирована");
        }
        return new MeResponse(
                user.getUsername(),
                user.isAdmin(),
                user.getGender() != null ? user.getGender() : Gender.MALE);
    }
}
