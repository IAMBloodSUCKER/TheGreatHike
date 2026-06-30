-- Ключевая фраза при регистрации (хранится как BCrypt-хеш)
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS recovery_key_hash varchar(255);
