package com.thegreathike.auth.validation;

public final class AuthCredentialsValidator {

    private AuthCredentialsValidator() {}

    public static void validatePasswordNotUsername(String username, String password) {
        if (password != null && password.equals(username)) {
            throw new IllegalArgumentException("Пароль не должен совпадать с логином");
        }
    }
}
