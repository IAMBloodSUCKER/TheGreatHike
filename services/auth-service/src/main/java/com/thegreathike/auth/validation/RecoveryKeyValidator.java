package com.thegreathike.auth.validation;

public final class RecoveryKeyValidator {

    private RecoveryKeyValidator() {}

    public static void validate(String recoveryKey, String username, String password) {
        if (recoveryKey == null || recoveryKey.isBlank()) {
            throw new IllegalArgumentException("Укажите ключевую фразу");
        }
        if (recoveryKey.length() < 8 || recoveryKey.length() > 128) {
            throw new IllegalArgumentException("Ключевая фраза: от 8 до 128 символов");
        }
        boolean hasLetter = recoveryKey.chars().anyMatch(Character::isLetter);
        boolean hasDigit = recoveryKey.chars().anyMatch(Character::isDigit);
        if (!hasLetter || !hasDigit) {
            throw new IllegalArgumentException("Ключевая фраза должна содержать буквы и цифры");
        }
        if (recoveryKey.equals(username) || recoveryKey.equals(password)) {
            throw new IllegalArgumentException("Ключевая фраза не должна совпадать с логином или паролем");
        }
    }
}
